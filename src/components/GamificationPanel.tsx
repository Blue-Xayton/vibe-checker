import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, Zap, Target, Trophy } from "lucide-react";
import { UserStats } from "@/types/sentiment";

interface GamificationPanelProps {
  stats: UserStats;
}

export const GamificationPanel = ({ stats }: GamificationPanelProps) => {
  const badges = [
    {
      id: "analyzer",
      name: "Analyzer",
      description: "Process 100 texts",
      icon: <Zap className="w-6 h-6" />,
      threshold: 100,
      unlocked: stats.textsProcessed >= 100,
    },
    {
      id: "sharpshooter",
      name: "Sharpshooter",
      description: ">80% avg confidence",
      icon: <Target className="w-6 h-6" />,
      threshold: 0.8,
      unlocked: stats.averageConfidence >= 0.8,
    },
    {
      id: "batch_master",
      name: "Batch Master",
      description: "Complete 10 batches",
      icon: <Trophy className="w-6 h-6" />,
      threshold: 10,
      unlocked: stats.batchesCompleted >= 10,
    },
  ];

  return (
    <Card className="p-6 shadow-card bg-gradient-accent animate-scale-in">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-accent-foreground" />
          <h3 className="text-lg font-bold text-accent-foreground">Your Progress</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="bg-background/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-accent-foreground">Texts Processed</span>
              <span className="text-2xl font-bold text-accent-foreground">{stats.textsProcessed}</span>
            </div>
            <Progress value={Math.min((stats.textsProcessed / 100) * 100, 100)} className="h-2" />
          </div>

          <div className="bg-background/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-accent-foreground">Batches Completed</span>
              <span className="text-2xl font-bold text-accent-foreground">{stats.batchesCompleted}</span>
            </div>
            <Progress value={Math.min((stats.batchesCompleted / 10) * 100, 100)} className="h-2" />
          </div>

          <div className="bg-background/10 backdrop-blur-sm p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-accent-foreground">Avg Confidence</span>
              <span className="text-2xl font-bold text-accent-foreground">
                {(stats.averageConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={stats.averageConfidence * 100} className="h-2" />
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold mb-3 text-accent-foreground">Badges</h4>
          <div className="grid grid-cols-3 gap-3">
            {badges.map((badge) => (
              <div
                key={badge.id}
                className={`flex flex-col items-center gap-2 p-3 rounded-lg transition-all ${
                  badge.unlocked
                    ? "bg-background/20 backdrop-blur-sm scale-105"
                    : "bg-background/5 opacity-50 grayscale"
                }`}
              >
                <div className={badge.unlocked ? "text-accent-foreground" : "text-muted"}>
                  {badge.icon}
                </div>
                <Badge variant={badge.unlocked ? "default" : "outline"} className="text-xs">
                  {badge.name}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};
