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
}

export const ResultCard = ({ result }: ResultCardProps) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const getSentimentIcon = () => {
    switch (result.label) {
      case "positive":
        return <ThumbsUp className="w-5 h-5 text-sentiment-positive" />;
      case "negative":
        return <ThumbsDown className="w-5 h-5 text-sentiment-negative" />;
      default:
        return <Minus className="w-5 h-5 text-sentiment-neutral" />;
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
    <Card className="p-4 shadow-card hover:shadow-glow transition-all duration-300 animate-fade-in">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {getSentimentIcon()}
            <Badge className={getSentimentColor()}>
              {result.label.toUpperCase()}
            </Badge>
            <span className="text-sm font-semibold text-muted-foreground">
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
          className="text-sm text-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: highlightKeywords(result.text) }}
        />
      </div>
    </Card>
  );
};
