import { describe, it, expect } from "vitest";
import { parseTags, toRecord } from "../src/repositories/feedback.js";
import type { Feedback } from "@prisma/client";

describe("feedback repository helpers", () => {
  it("parseTags parses JSON array", () => {
    expect(parseTags('["ux","bug"]')).toEqual(["ux", "bug"]);
  });

  it("parseTags returns empty array on invalid JSON", () => {
    expect(parseTags("not-json")).toEqual([]);
  });

  it("toRecord maps prisma row to API shape", () => {
    const row = {
      id: "id1",
      text: "Feedback text",
      email: "a@b.com",
      createdAt: new Date("2026-05-16T10:00:00Z"),
      summary: "Summary",
      sentiment: "positive",
      tags: '["ux"]',
      priority: "P3",
      nextAction: "Review",
    } as Feedback;

    const record = toRecord(row);
    expect(record.id).toBe("id1");
    expect(record.analysis.tags).toEqual(["ux"]);
    expect(record.createdAt).toBe("2026-05-16T10:00:00.000Z");
  });
});
