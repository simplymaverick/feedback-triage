import { describe, it, expect } from "vitest";
import { hasAiCredentials, type Env } from "../src/config.js";

const base: Env = {
  PORT: 3001,
  DATABASE_URL: "file:./test.db",
  AI_PROVIDER: "gemini",
  GEMINI_API_KEY: "g-key",
  GEMINI_MODEL: "gemini-2.0-flash",
  OPENAI_API_KEY: "o-key",
  OPENAI_MODEL: "gpt-4o-mini",
  ANTHROPIC_API_KEY: "a-key",
  ANTHROPIC_MODEL: "claude-3-5-haiku-latest",
  AI_MOCK_MODE: false,
  CORS_ORIGIN: "http://localhost:5173",
  LOG_LEVEL: "info",
};

describe("hasAiCredentials", () => {
  it("checks gemini key when provider is gemini", () => {
    expect(hasAiCredentials({ ...base, AI_PROVIDER: "gemini" })).toBe(true);
    expect(
      hasAiCredentials({ ...base, AI_PROVIDER: "gemini", GEMINI_API_KEY: "" }),
    ).toBe(false);
  });

  it("checks openai key when provider is openai", () => {
    expect(hasAiCredentials({ ...base, AI_PROVIDER: "openai" })).toBe(true);
    expect(
      hasAiCredentials({ ...base, AI_PROVIDER: "openai", OPENAI_API_KEY: "" }),
    ).toBe(false);
  });

  it("checks anthropic key when provider is anthropic", () => {
    expect(hasAiCredentials({ ...base, AI_PROVIDER: "anthropic" })).toBe(true);
    expect(
      hasAiCredentials({
        ...base,
        AI_PROVIDER: "anthropic",
        ANTHROPIC_API_KEY: "",
      }),
    ).toBe(false);
  });
});
