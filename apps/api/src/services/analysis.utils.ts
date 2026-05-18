import { createHash } from "node:crypto";
import { AppError, ErrorCodes } from "../lib/errors.js";
import { analysisSchema, type AnalysisOutput } from "../schemas/feedback.js";
import type { AnalysisResult } from "../types.js";

export const SYSTEM_PROMPT = `You are a product feedback triage assistant. Analyze user feedback and return ONLY valid JSON with these fields:
- summary: concise professional summary (max 2 sentences, do not include email addresses or other PII)
- sentiment: one of "positive", "neutral", "negative"
- tags: array of 1-5 short lowercase noun tags
- priority: one of "P0" (critical outage), "P1" (major issue), "P2" (moderate), "P3" (minor/nice-to-have)
- nextAction: recommended next step for the product team (one sentence)

Keep outputs concise and professional. Never echo or repeat email addresses or personal identifiers from the input.`;

export function hashText(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

export function mockAnalysis(text: string): AnalysisResult {
  const hash = hashText(text);
  const sentiments = ["positive", "neutral", "negative"] as const;
  const priorities = ["P0", "P1", "P2", "P3"] as const;
  const sentiment = sentiments[parseInt(hash.slice(0, 2), 16) % 3];
  const priority = priorities[parseInt(hash.slice(2, 4), 16) % 4];
  const tagPool = ["ux", "bug", "feature", "performance", "billing", "support"];
  const tagCount = (parseInt(hash.slice(4, 6), 16) % 3) + 1;
  const tags = Array.from({ length: tagCount }, (_, i) =>
    tagPool[(parseInt(hash.slice(6 + i * 2, 8 + i * 2), 16) || 0) % tagPool.length],
  );

  return {
    summary: `Mock analysis: ${text.slice(0, 80)}${text.length > 80 ? "…" : ""}`,
    sentiment,
    tags: [...new Set(tags)],
    priority,
    nextAction: "Review feedback and assign to the appropriate team.",
  };
}

function toAnalysisResult(output: AnalysisOutput): AnalysisResult {
  return {
    summary: output.summary,
    sentiment: output.sentiment,
    tags: output.tags,
    priority: output.priority,
    nextAction: output.nextAction,
  };
}

export function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}

export function parseAnalysisResponse(raw: string): AnalysisResult {
  let parsed: unknown;
  try {
    parsed = extractJson(raw);
  } catch {
    throw new AppError(
      ErrorCodes.AI_ANALYSIS_FAILED,
      "AI returned invalid JSON",
      502,
    );
  }

  const validated = analysisSchema.safeParse(parsed);
  if (!validated.success) {
    throw new AppError(
      ErrorCodes.AI_ANALYSIS_FAILED,
      "AI response failed validation",
      502,
    );
  }

  return toAnalysisResult(validated.data);
}
