import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { InputSection } from "@/components/InputSection";
import { ResultCard } from "@/components/ResultCard";
import { VisualizationPanel } from "@/components/VisualizationPanel";
import { GamificationPanel } from "@/components/GamificationPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SentimentResult, UserStats } from "@/types/sentiment";
import { Download, Sparkles, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [stats, setStats] = useState<UserStats>({
    textsProcessed: 0,
    batchesCompleted: 0,
    averageConfidence: 0,
    badges: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    // Check auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadUserData(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      // Load user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        setStats({
          textsProcessed: profile.texts_processed,
          batchesCompleted: profile.batches_completed,
          averageConfidence: Number(profile.average_confidence),
          badges: [],
        });
      }

      // Load sentiment results
      const { data: sentimentResults } = await supabase
        .from("sentiment_results")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (sentimentResults) {
        setResults(sentimentResults.map(r => ({
          id: r.id,
          text: r.text,
          label: r.label as any,
          scores: r.scores as any,
          confidence: Number(r.confidence),
          explanation: r.explanation,
          keywords: r.keywords as any,
          timestamp: r.created_at,
        })));
      }
    } catch (error: any) {
      console.error("Error loading user data:", error);
    }
  };

  const analyzeSentiment = async (texts: string[]) => {
    if (!user) return;

    setIsAnalyzing(true);
    setBatchProgress(0);
    const newResults: SentimentResult[] = [];
    const batchSize = 5;

    try {
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        const promises = batch.map(async (text) => {
          const { data, error } = await supabase.functions.invoke("analyze-sentiment", {
            body: { text },
          });

          if (error) throw error;
          return data;
        });

        const batchResults = await Promise.all(promises);
        newResults.push(...batchResults);
        
        setBatchProgress(((i + batch.length) / texts.length) * 100);
      }

      // Save results to database
      const { error: insertError } = await supabase
        .from("sentiment_results")
        .insert(
          newResults.map(r => ({
            user_id: user.id,
            text: r.text,
            label: r.label,
            confidence: r.confidence,
            explanation: r.explanation,
            keywords: r.keywords as any,
            scores: r.scores as any,
          }))
        );

      if (insertError) throw insertError;

      setResults((prev) => [...newResults, ...prev]);
      
      // Update stats in database
      const avgConf = newResults.reduce((sum, r) => sum + r.confidence, 0) / newResults.length;
      const newTextsProcessed = stats.textsProcessed + texts.length;
      const newBatchesCompleted = stats.batchesCompleted + (texts.length > 1 ? 1 : 0);
      const newAvgConfidence = (stats.averageConfidence * stats.textsProcessed + avgConf * texts.length) / newTextsProcessed;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          texts_processed: newTextsProcessed,
          batches_completed: newBatchesCompleted,
          average_confidence: newAvgConfidence,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setStats({
        textsProcessed: newTextsProcessed,
        batchesCompleted: newBatchesCompleted,
        averageConfidence: newAvgConfidence,
        badges: stats.badges,
      });

      toast({
        title: "Analysis complete!",
        description: `Processed ${texts.length} text${texts.length > 1 ? 's' : ''} successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Analysis failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setBatchProgress(0);
    }
  };

  const exportResults = (format: "csv" | "json") => {
    if (results.length === 0) {
      toast({
        title: "No data to export",
        description: "Analyze some text first",
        variant: "destructive",
      });
      return;
    }

    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "csv") {
      const headers = ["Text", "Label", "Confidence", "Positive Score", "Neutral Score", "Negative Score", "Explanation"];
      const rows = results.map(r => [
        `"${r.text.replace(/"/g, '""')}"`,
        r.label,
        r.confidence.toFixed(3),
        r.scores.positive.toFixed(3),
        r.scores.neutral.toFixed(3),
        r.scores.negative.toFixed(3),
        `"${r.explanation.replace(/"/g, '""')}"`,
      ]);
      content = [headers, ...rows].map(row => row.join(",")).join("\n");
      filename = `sentiment-analysis-${Date.now()}.csv`;
      mimeType = "text/csv";
    } else {
      content = JSON.stringify(results, null, 2);
      filename = `sentiment-analysis-${Date.now()}.json`;
      mimeType = "application/json";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Downloaded ${filename}`,
    });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-coral-light via-purple-light to-teal-light">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-coral-dark" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-coral-dark to-purple-dark bg-clip-text text-transparent">
                Sentiment Analyzer
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input & Results */}
          <div className="lg:col-span-2 space-y-6">
            <InputSection onAnalyze={analyzeSentiment} isAnalyzing={isAnalyzing} />

            {isAnalyzing && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">
                  Analyzing sentiment...
                </h3>
                <Progress value={batchProgress} className="h-2" />
                <p className="text-sm text-gray-600 mt-2">
                  {Math.round(batchProgress)}% complete
                </p>
              </div>
            )}

            {/* Current Result */}
            {results.length > 0 && (
              <div className="space-y-4">
                <ResultCard result={results[0]} isCurrent={true} />
              </div>
            )}

            {/* History */}
            {results.length > 1 && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <span className="text-purple-600">History</span>
                  <span className="text-sm font-normal text-gray-500">
                    ({results.length - 1} previous)
                  </span>
                </h3>
                <div className="space-y-3">
                  {results.slice(1).map((result) => (
                    <ResultCard key={result.id} result={result} isCurrent={false} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Stats & Visualizations */}
          <div className="space-y-6">
            <GamificationPanel stats={stats} />
            <VisualizationPanel results={results} />

            {results.length > 0 && (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-purple-200 shadow-lg space-y-3">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Export Results
                </h3>
                <Button
                  onClick={() => exportResults("csv")}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export as CSV
                </Button>
                <Button
                  onClick={() => exportResults("json")}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export as JSON
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;