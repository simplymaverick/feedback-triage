import { describe, it, expect } from "vitest";
import {
  extractJson,
  hashText,
  mockAnalysis,
  parseAnalysisResponse,
} from "../src/services/analysis.utils.js";

describe("analysis.utils", () => {
  it("hashText returns stable sha256 hex", () => {
    const a = hashText("hello");
    const b = hashText("hello");
    const c = hashText("world");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(64);
  });

  it("mockAnalysis returns valid shape", () => {
    const result = mockAnalysis("Great product!");
    expect(result.summary).toContain("Mock analysis");
    expect(["positive", "neutral", "negative"]).toContain(result.sentiment);
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.priority).toMatch(/^P[0-3]$/);
  });

  it("extractJson parses plain and fenced JSON", () => {
    expect(extractJson('{"a":1}')).toEqual({ a: 1 });
    expect(extractJson("```json\n{\"b\":2}\n```")).toEqual({ b: 2 });
  });

  it("parseAnalysisResponse validates and maps fields", () => {
    const raw = JSON.stringify({
      summary: "User loves the app",
      sentiment: "positive",
      tags: ["ux"],
      priority: "P3",
      nextAction: "Share with team",
    });
    const result = parseAnalysisResponse(raw);
    expect(result.sentiment).toBe("positive");
    expect(result.tags).toEqual(["ux"]);
  });

  it("parseAnalysisResponse throws on invalid JSON", () => {
    expect(() => parseAnalysisResponse("not json")).toThrow(/invalid JSON/i);
  });

  it("parseAnalysisResponse throws on schema mismatch", () => {
    expect(() =>
      parseAnalysisResponse(JSON.stringify({ summary: "x" })),
    ).toThrow(/failed validation/i);
  });
});
