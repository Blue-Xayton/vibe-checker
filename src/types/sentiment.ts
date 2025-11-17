export type SentimentLabel = "positive" | "neutral" | "negative";

export interface SentimentScores {
  positive: number;
  neutral: number;
  negative: number;
}

export interface Keyword {
  token: string;
  polarity: "positive" | "negative" | "neutral";
  score: number;
}

export interface SentimentResult {
  id: string;
  text: string;
  label: SentimentLabel;
  scores: SentimentScores;
  confidence: number;
  explanation: string;
  keywords: Keyword[];
  timestamp?: string;
}

export interface BatchProgress {
  current: number;
  total: number;
  percentage: number;
  eta?: number;
}

export interface UserStats {
  textsProcessed: number;
  batchesCompleted: number;
  averageConfidence: number;
  badges: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}
