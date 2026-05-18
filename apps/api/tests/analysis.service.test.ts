import pino from "pino";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { AnalysisService } from "../src/services/analysis.js";
import type { Env } from "../src/config.js";

const log = pino({ level: "silent" });

const baseEnv: Env = {
  PORT: 3001,
  DATABASE_URL: "file:./test.db",
  AI_PROVIDER: "gemini",
  GEMINI_API_KEY: "test-gemini-key",
  GEMINI_MODEL: "gemini-2.0-flash",
  OPENAI_API_KEY: "test-openai-key",
  OPENAI_MODEL: "gpt-4o-mini",
  ANTHROPIC_API_KEY: "test-anthropic-key",
  ANTHROPIC_MODEL: "claude-3-5-haiku-latest",
  AI_MOCK_MODE: false,
  CORS_ORIGIN: "http://localhost:5173",
  LOG_LEVEL: "info",
};

const validAnalysis = {
  summary: "User reports login issue",
  sentiment: "negative",
  tags: ["bug", "auth"],
  priority: "P1",
  nextAction: "Investigate auth service logs",
};

describe("AnalysisService", () => {
  beforeEach(() => {
    AnalysisService.clearCache();
  });

  it("returns deterministic mock analysis when mock mode is enabled", async () => {
    const service = new AnalysisService({
      env: { ...baseEnv, AI_MOCK_MODE: true },
    });

    const result = await service.analyze("The checkout is broken", log);

    expect(result.sentiment).toMatch(/positive|neutral|negative/);
    expect(result.tags.length).toBeGreaterThan(0);
    expect(result.priority).toMatch(/^P[0-3]$/);
    expect(result.summary).toContain("Mock analysis");
  });

  it("uses mock when no API key is configured", async () => {
    const service = new AnalysisService({
      env: { ...baseEnv, GEMINI_API_KEY: "", AI_MOCK_MODE: false },
    });

    const result = await service.analyze("Great product", log);
    expect(result.summary).toContain("Mock analysis");
  });

  it("parses valid Gemini JSON response", async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      response: { text: () => JSON.stringify(validAnalysis) },
    });

    const service = new AnalysisService({
      env: baseEnv,
      geminiGenerateContent: mockGenerate,
    });

    const result = await service.analyze("Cannot log in", log);

    expect(result.summary).toBe("User reports login issue");
    expect(result.sentiment).toBe("negative");
    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });

  it("parses valid OpenAI JSON response", async () => {
    const mockCreate = vi.fn().mockResolvedValue({
      choices: [{ message: { content: JSON.stringify(validAnalysis) } }],
    });

    const service = new AnalysisService({
      env: { ...baseEnv, AI_PROVIDER: "openai" },
      openaiClient: { chat: { completions: { create: mockCreate } } } as never,
    });

    const result = await service.analyze("Cannot log in", log);
    expect(result.sentiment).toBe("negative");
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("parses valid Anthropic JSON response", async () => {
    const mockAnthropic = vi.fn().mockResolvedValue({
      content: [{ type: "text", text: JSON.stringify(validAnalysis) }],
    });

    const service = new AnalysisService({
      env: { ...baseEnv, AI_PROVIDER: "anthropic" },
      anthropicCreateMessage: mockAnthropic,
    });

    const result = await service.analyze("Cannot log in", log);
    expect(result.priority).toBe("P1");
    expect(mockAnthropic).toHaveBeenCalledTimes(1);
  });

  it("throws on malformed JSON from AI", async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      response: { text: () => "not json" },
    });

    const service = new AnalysisService({
      env: baseEnv,
      geminiGenerateContent: mockGenerate,
    });

    await expect(service.analyze("Some text", log)).rejects.toMatchObject({
      code: "AI_ANALYSIS_FAILED",
      statusCode: 502,
    });
  });

  it("returns cached result for identical text", async () => {
    const mockGenerate = vi.fn().mockResolvedValue({
      response: {
        text: () =>
          JSON.stringify({
            summary: "Cached",
            sentiment: "neutral",
            tags: ["ux"],
            priority: "P3",
            nextAction: "Review",
          }),
      },
    });

    const service = new AnalysisService({
      env: baseEnv,
      geminiGenerateContent: mockGenerate,
    });

    await service.analyze("Same text", log);
    await service.analyze("Same text", log);

    expect(mockGenerate).toHaveBeenCalledTimes(1);
  });
});
