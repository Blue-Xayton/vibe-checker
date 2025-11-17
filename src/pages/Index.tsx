import { useState } from "react";
import { InputSection } from "@/components/InputSection";
import { ResultCard } from "@/components/ResultCard";
import { VisualizationPanel } from "@/components/VisualizationPanel";
import { GamificationPanel } from "@/components/GamificationPanel";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SentimentResult, UserStats } from "@/types/sentiment";
import { Download, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
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

  const analyzeSentiment = async (texts: string[]) => {
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

      setResults((prev) => [...newResults, ...prev]);
      
      // Update stats
      const avgConf = newResults.reduce((sum, r) => sum + r.confidence, 0) / newResults.length;
      setStats((prev) => ({
        textsProcessed: prev.textsProcessed + texts.length,
        batchesCompleted: prev.batchesCompleted + (texts.length > 1 ? 1 : 0),
        averageConfidence: (prev.averageConfidence * prev.textsProcessed + avgConf * texts.length) / 
                          (prev.textsProcessed + texts.length),
        badges: prev.badges,
      }));

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
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `Downloaded ${filename}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-gradient-hero text-primary-foreground py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h1 className="text-4xl md:text-5xl font-bold">Sentiment Analyzer</h1>
          </div>
          <p className="text-center text-lg opacity-90 max-w-2xl mx-auto">
            Explore emotional tones in text with AI-powered analysis. 
            Gamified, beautiful, and insightful.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Input & Results */}
          <div className="lg:col-span-3 space-y-6">
            <InputSection onAnalyze={analyzeSentiment} isAnalyzing={isAnalyzing} />

            {isAnalyzing && batchProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing batch...</span>
                  <span>{Math.round(batchProgress)}%</span>
                </div>
                <Progress value={batchProgress} className="h-2" />
              </div>
            )}

            <VisualizationPanel results={results} />

            {results.length > 0 && (
              <div className="space-y-8">
                {/* Current/Latest Result */}
                <div>
                  <h2 className="text-3xl font-bold mb-4 flex items-center gap-2">
                    <span className="text-primary">Current Analysis</span>
                  </h2>
                  <ResultCard result={results[0]} isCurrent={true} />
                </div>

                {/* History Section */}
                {results.length > 1 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-muted-foreground">
                        History ({results.length - 1})
                      </h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => exportResults("csv")}>
                          <Download className="w-4 h-4 mr-2" />
                          CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => exportResults("json")}>
                          <Download className="w-4 h-4 mr-2" />
                          JSON
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {results.slice(1).map((result) => (
                        <ResultCard key={result.id} result={result} isCurrent={false} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Gamification */}
          <div className="lg:col-span-1">
            <GamificationPanel stats={stats} />
          </div>
        </div>

        {/* Model Limitations Notice */}
        <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Model Limitations
          </h3>
          <p className="text-sm text-muted-foreground">
            Results are probabilistic and may be biased by training data. 
            This tool should not be used as the sole basis for high-stakes decisions. 
            Always verify critical sentiment analysis with human review.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
