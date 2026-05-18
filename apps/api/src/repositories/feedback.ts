import type { Feedback, Priority, Sentiment } from "@prisma/client";
import type { Logger } from "pino";
import { prisma } from "../lib/prisma.js";
import type { AnalysisResult, FeedbackRecord, PaginatedFeedback } from "../types.js";
import type { ListFeedbackQuery } from "../schemas/feedback.js";

export function parseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

export function toRecord(row: Feedback): FeedbackRecord {
  return {
    id: row.id,
    text: row.text,
    email: row.email,
    createdAt: row.createdAt.toISOString(),
    analysis: {
      summary: row.summary,
      sentiment: row.sentiment,
      tags: parseTags(row.tags),
      priority: row.priority,
      nextAction: row.nextAction,
    },
  };
}

export interface CreateFeedbackData {
  text: string;
  email?: string;
  analysis: AnalysisResult;
}

export class FeedbackRepository {
  async create(data: CreateFeedbackData, log: Logger): Promise<FeedbackRecord> {
    const started = Date.now();
    const row = await prisma.feedback.create({
      data: {
        text: data.text,
        email: data.email ?? null,
        summary: data.analysis.summary,
        sentiment: data.analysis.sentiment as Sentiment,
        tags: JSON.stringify(data.analysis.tags),
        priority: data.analysis.priority as Priority,
        nextAction: data.analysis.nextAction,
      },
    });
    const record = toRecord(row);
    log.info({
      event: "db_create",
      feedbackId: record.id,
      durationMs: Date.now() - started,
      sentiment: record.analysis.sentiment,
      priority: record.analysis.priority,
    });
    return record;
  }

  async findById(id: string, log: Logger): Promise<FeedbackRecord | null> {
    const started = Date.now();
    const row = await prisma.feedback.findUnique({ where: { id } });
    log.info({
      event: "db_find_by_id",
      feedbackId: id,
      found: Boolean(row),
      durationMs: Date.now() - started,
    });
    return row ? toRecord(row) : null;
  }

  async list(query: ListFeedbackQuery, log: Logger): Promise<PaginatedFeedback> {
    const started = Date.now();
    const { page, pageSize, sentiment, tag, search, sortBy, sortOrder } = query;
    const skip = (page - 1) * pageSize;

    const filterKeys = [
      sentiment ? "sentiment" : null,
      tag ? "tag" : null,
      search ? "search" : null,
    ].filter(Boolean);

    const orderBy = { [sortBy]: sortOrder } as {
      summary?: "asc" | "desc";
      sentiment?: "asc" | "desc";
      tags?: "asc" | "desc";
      priority?: "asc" | "desc";
      createdAt?: "asc" | "desc";
    };

    const where: {
      sentiment?: Sentiment;
      OR?: Array<{ text?: { contains: string }; summary?: { contains: string } }>;
    } = {};

    if (sentiment) {
      where.sentiment = sentiment;
    }

    if (search) {
      where.OR = [
        { text: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    let rows = await prisma.feedback.findMany({
      where,
      orderBy,
      skip: tag ? 0 : skip,
      take: tag ? undefined : pageSize,
    });

    if (tag) {
      const lowerTag = tag.toLowerCase();
      rows = rows.filter((row) =>
        parseTags(row.tags).some((t) => t.toLowerCase() === lowerTag),
      );
    }

    const total = tag
      ? rows.length
      : await prisma.feedback.count({ where });

    const paginatedRows = tag ? rows.slice(skip, skip + pageSize) : rows;

    const result = {
      items: paginatedRows.map(toRecord),
      page,
      pageSize,
      total,
    };

    log.info({
      event: "db_list",
      durationMs: Date.now() - started,
      resultCount: result.items.length,
      total: result.total,
      page,
      pageSize,
      filterKeys,
      sortBy,
      sortOrder,
    });

    return result;
  }
}
