import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Upload, Sparkles, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InputSectionProps {
  onAnalyze: (texts: string[]) => void;
  isAnalyzing: boolean;
}

export const InputSection = ({ onAnalyze, isAnalyzing }: InputSectionProps) => {
  const [text, setText] = useState("");
  const [fileName, setFileName] = useState<string>();
  const { toast } = useToast();

  const handlePaste = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      setText(clipboardText);
      toast({
        title: "Pasted from clipboard",
        description: "Text has been pasted successfully",
      });
    } catch (err) {
      toast({
        title: "Paste failed",
        description: "Unable to access clipboard",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          const texts = Array.isArray(data) ? data.map(item => 
            typeof item === 'string' ? item : item.text || JSON.stringify(item)
          ) : [content];
          onAnalyze(texts);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n').filter(line => line.trim());
          const texts = lines.slice(1).map(line => {
            const match = line.match(/(?:^|,)(?:"([^"]*)"|([^,]*))/);
            return match ? (match[1] || match[2]).trim() : line;
          });
          onAnalyze(texts);
        } else {
          const texts = content.split('\n').filter(line => line.trim());
          onAnalyze(texts);
        }
        
        toast({
          title: "File uploaded",
          description: `Processing ${file.name}...`,
        });
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Unable to parse file. Please check the format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    if (!text.trim()) {
      toast({
        title: "No text to analyze",
        description: "Please enter some text first",
        variant: "destructive",
      });
      return;
    }
    onAnalyze([text]);
  };

  return (
    <Card className="p-6 shadow-card bg-gradient-card">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Input Text</h2>
        </div>

        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to analyze sentiment (reviews, tweets, comments)..."
          className="min-h-[120px] resize-none"
        />

        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="bg-primary hover:bg-primary/90"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Analyze Sentiment"}
          </Button>

          <Button 
            variant="outline" 
            onClick={handlePaste}
            disabled={isAnalyzing}
          >
            <FileText className="w-4 h-4 mr-2" />
            Paste from Clipboard
          </Button>

          <label>
            <Button 
              variant="outline" 
              disabled={isAnalyzing}
              asChild
            >
              <span className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {fileName ? `Uploaded: ${fileName}` : "Upload File"}
              </span>
            </Button>
            <input
              type="file"
              accept=".csv,.json,.txt"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isAnalyzing}
            />
          </label>
        </div>

        <p className="text-xs text-muted-foreground">
          Supported formats: CSV, JSON, TXT • Single text or batch processing
        </p>
      </div>
    </Card>
  );
};
