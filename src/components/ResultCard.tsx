import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SentimentResult } from "@/types/sentiment";
import { ThumbsUp, ThumbsDown, Minus, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ResultCardProps {
  result: SentimentResult;
  isCurrent?: boolean;
}

export const ResultCard = ({ result, isCurrent = false }: ResultCardProps) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const getSentimentIcon = () => {
    switch (result.label) {
      case "positive":
        return <ThumbsUp className={isCurrent ? "w-8 h-8 text-sentiment-positive" : "w-5 h-5 text-sentiment-positive"} />;
      case "negative":
        return <ThumbsDown className={isCurrent ? "w-8 h-8 text-sentiment-negative" : "w-5 h-5 text-sentiment-negative"} />;
      default:
        return <Minus className={isCurrent ? "w-8 h-8 text-sentiment-neutral" : "w-5 h-5 text-sentiment-neutral"} />;
    }
  };

  const getSentimentEmoji = () => {
    switch (result.label) {
      case "positive":
        return "😊";
      case "negative":
        return "😠";
      default:
        return "😐";
    }
  };

  const getSentimentColor = () => {
    switch (result.label) {
      case "positive":
        return "bg-sentiment-positive/10 text-sentiment-positive border-sentiment-positive";
      case "negative":
        return "bg-sentiment-negative/10 text-sentiment-negative border-sentiment-negative";
      default:
        return "bg-sentiment-neutral/10 text-sentiment-neutral border-sentiment-neutral";
    }
  };

  const getCurrentGlow = () => {
    switch (result.label) {
      case "positive":
        return "shadow-[0_0_40px_rgba(16,185,129,0.4)] border-sentiment-positive/50";
      case "negative":
        return "shadow-[0_0_40px_rgba(239,68,68,0.4)] border-sentiment-negative/50";
      default:
        return "shadow-[0_0_40px_rgba(251,191,36,0.4)] border-sentiment-neutral/50";
    }
  };

  const highlightKeywords = (text: string) => {
    let highlightedText = text;
    result.keywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword.token}\\b`, 'gi');
      const colorClass = keyword.polarity === "positive" 
        ? "bg-sentiment-positive/20 text-sentiment-positive font-semibold px-1 rounded"
        : keyword.polarity === "negative"
        ? "bg-sentiment-negative/20 text-sentiment-negative font-semibold px-1 rounded"
        : "bg-sentiment-neutral/20 text-sentiment-neutral font-semibold px-1 rounded";
      
      highlightedText = highlightedText.replace(regex, `<span class="${colorClass}">${keyword.token}</span>`);
    });
    return highlightedText;
  };

  return (
    <Card className={`${
      isCurrent 
        ? `p-6 border-4 ${getCurrentGlow()} animate-scale-in relative overflow-hidden` 
        : "p-4 shadow-card hover:shadow-glow opacity-70 hover:opacity-100"
    } transition-all duration-300 animate-fade-in`}>
      {isCurrent && (
        <>
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-accent"></div>
          <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground animate-pulse">
            Latest Sentiment
          </Badge>
        </>
      )}
      <div className={isCurrent ? "space-y-4" : "space-y-3"}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className={isCurrent ? "text-4xl" : "hidden"}>{getSentimentEmoji()}</span>
            {getSentimentIcon()}
            <Badge className={`${getSentimentColor()} ${isCurrent ? "text-lg px-3 py-1" : ""}`}>
              {result.label.toUpperCase()}
            </Badge>
            <span className={`font-bold text-muted-foreground ${isCurrent ? "text-lg" : "text-sm"}`}>
              {(result.confidence * 100).toFixed(1)}% confidence
            </span>
          </div>
          
          <Dialog open={showExplanation} onOpenChange={setShowExplanation}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Info className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Why this score?</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{result.explanation}</p>
                
                <div>
                  <h4 className="font-semibold mb-2">Key Sentiment Drivers:</h4>
                  <div className="space-y-2">
                    {result.keywords.map((keyword, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{keyword.token}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={
                            keyword.polarity === "positive" 
                              ? "border-sentiment-positive text-sentiment-positive"
                              : keyword.polarity === "negative"
                              ? "border-sentiment-negative text-sentiment-negative"
                              : "border-sentiment-neutral text-sentiment-neutral"
                          }>
                            {keyword.polarity}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {(keyword.score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Confidence Breakdown:</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Positive</span>
                        <span>{(result.scores.positive * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={result.scores.positive * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Neutral</span>
                        <span>{(result.scores.neutral * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={result.scores.neutral * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Negative</span>
                        <span>{(result.scores.negative * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={result.scores.negative * 100} className="h-2" />
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div 
          className={`text-foreground leading-relaxed ${isCurrent ? "text-base font-medium" : "text-sm"}`}
          dangerouslySetInnerHTML={{ __html: highlightKeywords(result.text) }}
        />
      </div>
    </Card>
  );
};
