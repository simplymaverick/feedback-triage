import type { Priority, Sentiment } from "@prisma/client";

export interface AnalysisResult {
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
  analysis: AnalysisResult;
}

export interface PaginatedFeedback {
  items: FeedbackRecord[];
  page: number;
  pageSize: number;
  total: number;
}
