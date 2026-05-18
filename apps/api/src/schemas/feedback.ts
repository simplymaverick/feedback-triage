import { z } from "zod";

export const createFeedbackSchema = z.object({
  text: z.string().trim().min(1, "text is required").max(10000),
  email: z.string().email("invalid email").optional().or(z.literal("")),
});

const sortByFieldSchema = z.enum([
  "summary",
  "sentiment",
  "tags",
  "priority",
  "createdAt",
]);

const sortOrderSchema = z.enum(["asc", "desc"]);

export const listFeedbackQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
  tag: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  sortBy: sortByFieldSchema.default("createdAt"),
  sortOrder: sortOrderSchema.default("desc"),
});

export const analysisSchema = z.object({
  summary: z.string().min(1).max(500),
  sentiment: z.enum(["positive", "neutral", "negative"]),
  tags: z.array(z.string().min(1).max(50)).min(1).max(5),
  priority: z.enum(["P0", "P1", "P2", "P3"]),
  nextAction: z.string().min(1).max(500),
});

export type ListFeedbackQuery = z.infer<typeof listFeedbackQuerySchema>;
export type AnalysisOutput = z.infer<typeof analysisSchema>;
