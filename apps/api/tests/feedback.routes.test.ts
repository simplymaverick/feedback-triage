import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { buildApp } from "../src/app.js";
import type { Env } from "../src/config.js";
import { prisma } from "../src/lib/prisma.js";
import { AnalysisService } from "../src/services/analysis.js";

const testEnv: Env = {
  PORT: 0,
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./prisma/test.db",
  AI_PROVIDER: "gemini",
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "gemini-2.0-flash",
  OPENAI_API_KEY: "",
  OPENAI_MODEL: "gpt-4o-mini",
  ANTHROPIC_API_KEY: "",
  ANTHROPIC_MODEL: "claude-3-5-haiku-latest",
  AI_MOCK_MODE: true,
  CORS_ORIGIN: "http://localhost:5173",
  LOG_LEVEL: "silent",
};

describe("Feedback routes", () => {
  let app: Awaited<ReturnType<typeof buildApp>>;

  beforeAll(async () => {
    app = await buildApp(testEnv);
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    AnalysisService.clearCache();
    await prisma.feedback.deleteMany();
  });

  it("POST /api/feedback creates a record with analysis", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/feedback",
      payload: { text: "Love the new dashboard!" },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.id).toBeDefined();
    expect(body.text).toBe("Love the new dashboard!");
    expect(body.analysis.summary).toBeDefined();
    expect(body.analysis.sentiment).toMatch(/positive|neutral|negative/);
    expect(body.createdAt).toBeDefined();
  });

  it("POST /api/feedback returns 400 for empty text", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/feedback",
      payload: { text: "" },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.requestId).toBeDefined();
  });

  it("GET /api/feedback returns paginated list", async () => {
    await app.inject({
      method: "POST",
      url: "/api/feedback",
      payload: { text: "First item" },
    });
    await app.inject({
      method: "POST",
      url: "/api/feedback",
      payload: { text: "Second item" },
    });

    const response = await app.inject({
      method: "GET",
      url: "/api/feedback?page=1&pageSize=10",
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.items).toHaveLength(2);
    expect(body.total).toBe(2);
    expect(body.page).toBe(1);
  });

  it("GET /api/feedback/:id returns 404 for unknown id", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/api/feedback/nonexistent",
    });

    expect(response.statusCode).toBe(404);
    expect(response.json().error.code).toBe("NOT_FOUND");
  });
});
