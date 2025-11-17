import { Card } from "@/components/ui/card";
import { SentimentResult } from "@/types/sentiment";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

interface VisualizationPanelProps {
  results: SentimentResult[];
}

const COLORS = {
  positive: "hsl(var(--sentiment-positive))",
  neutral: "hsl(var(--sentiment-neutral))",
  negative: "hsl(var(--sentiment-negative))",
};

export const VisualizationPanel = ({ results }: VisualizationPanelProps) => {
  if (results.length === 0) {
    return (
      <Card className="p-6 shadow-card">
        <p className="text-center text-muted-foreground">
          No data to visualize yet. Start analyzing some text!
        </p>
      </Card>
    );
  }

  const sentimentCounts = results.reduce((acc, result) => {
    acc[result.label] = (acc[result.label] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(sentimentCounts).map(([label, count]) => ({
    name: label.charAt(0).toUpperCase() + label.slice(1),
    value: count,
    label,
  }));

  const avgConfidence = {
    positive: results.filter(r => r.label === "positive").reduce((sum, r) => sum + r.confidence, 0) / 
              (results.filter(r => r.label === "positive").length || 1),
    neutral: results.filter(r => r.label === "neutral").reduce((sum, r) => sum + r.confidence, 0) / 
             (results.filter(r => r.label === "neutral").length || 1),
    negative: results.filter(r => r.label === "negative").reduce((sum, r) => sum + r.confidence, 0) / 
              (results.filter(r => r.label === "negative").length || 1),
  };

  const barData = [
    { name: "Positive", confidence: avgConfidence.positive * 100 },
    { name: "Neutral", confidence: avgConfidence.neutral * 100 },
    { name: "Negative", confidence: avgConfidence.negative * 100 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 shadow-card bg-gradient-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold">Sentiment Distribution</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.label as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 shadow-card bg-gradient-card">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-bold">Average Confidence</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Bar dataKey="confidence" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};
