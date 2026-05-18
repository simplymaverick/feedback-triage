export type Sentiment = "positive" | "neutral" | "negative";
export type Priority = "P0" | "P1" | "P2" | "P3";

export interface Analysis {
  summary: string;
  sentiment: Sentiment;
  tags: string[];
  priority: Priority;
  nextAction: string;
}

export interface FeedbackRecord {
  id: string;
  text: string;
  email: string | null;
  createdAt: string;
  analysis: Analysis;
}

export interface PaginatedFeedback {
  items: FeedbackRecord[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}
