import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import type { Logger } from "pino";
import type { Env } from "../config.js";
import { hasAiCredentials } from "../config.js";
import { AppError, ErrorCodes } from "../lib/errors.js";
import { logger as rootLogger } from "../lib/logger.js";
import type { AnalysisResult } from "../types.js";
import {
  SYSTEM_PROMPT,
  hashText,
  mockAnalysis,
  parseAnalysisResponse,
} from "./analysis.utils.js";

const cache = new Map<string, AnalysisResult>();

export type GeminiGenerateContent = (request: {
  contents: Array<{ role: string; parts: Array<{ text: string }> }>;
}) => Promise<{ response: { text: () => string } }>;

export type AnthropicCreateMessage = (params: {
  model: string;
  max_tokens: number;
  system: string;
  messages: Array<{ role: "user"; content: string }>;
}) => Promise<{
  content: Array<{ type: string; text?: string }>;
}>;

export interface AnalysisServiceDeps {
  env: Env;
  openaiClient?: OpenAI;
  geminiGenerateContent?: GeminiGenerateContent;
  anthropicCreateMessage?: AnthropicCreateMessage;
}

export class AnalysisService {
  private readonly openai?: OpenAI;
  private readonly geminiGenerateContent?: GeminiGenerateContent;
  private readonly anthropicCreateMessage?: AnthropicCreateMessage;
  private readonly useMock: boolean;
  private readonly provider: Env["AI_PROVIDER"];

  constructor(private readonly deps: AnalysisServiceDeps) {
    this.provider = deps.env.AI_PROVIDER;
    this.useMock = deps.env.AI_MOCK_MODE || !hasAiCredentials(deps.env);

    if (!this.useMock && this.provider === "openai") {
      this.openai =
        deps.openaiClient ?? new OpenAI({ apiKey: deps.env.OPENAI_API_KEY });
    }

    if (!this.useMock && this.provider === "gemini") {
      if (deps.geminiGenerateContent) {
        this.geminiGenerateContent = deps.geminiGenerateContent;
      } else {
        const genAI = new GoogleGenerativeAI(deps.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: deps.env.GEMINI_MODEL,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 400,
          },
        });
        this.geminiGenerateContent = (request) => model.generateContent(request);
      }
    }

    if (!this.useMock && this.provider === "anthropic") {
      if (deps.anthropicCreateMessage) {
        this.anthropicCreateMessage = deps.anthropicCreateMessage;
      } else {
        const client = new Anthropic({ apiKey: deps.env.ANTHROPIC_API_KEY });
        this.anthropicCreateMessage = (params) => client.messages.create(params);
      }
    }
  }

  async analyze(text: string, log: Logger): Promise<AnalysisResult> {
    const cacheKey = hashText(text);
    const cached = cache.get(cacheKey);
    if (cached) {
      log.info({
        event: "analysis_cache_hit",
        provider: this.provider,
        cacheHit: true,
        cacheKey,
      });
      return cached;
    }

    const started = Date.now();
    log.info({
      event: "analysis_start",
      provider: this.provider,
      useMock: this.useMock,
      textLength: text.length,
    });

    let result: AnalysisResult;

    if (this.useMock) {
      log.info({
        event: "analysis_mock",
        provider: this.provider,
        durationMs: 0,
        cacheHit: false,
      });
      result = mockAnalysis(text);
    } else if (this.provider === "gemini") {
      result = await this.callGemini(text, log, started);
    } else if (this.provider === "anthropic") {
      result = await this.callAnthropic(text, log, started);
    } else {
      result = await this.callOpenAI(text, log, started);
    }

    cache.set(cacheKey, result);
    return result;
  }

  private async callGemini(
    text: string,
    log: Logger,
    started: number,
  ): Promise<AnalysisResult> {
    if (!this.geminiGenerateContent) {
      throw new AppError(
        ErrorCodes.AI_ANALYSIS_FAILED,
        "Gemini client not configured",
        502,
      );
    }

    try {
      const response = await this.geminiGenerateContent({
        contents: [
          {
            role: "user",
            parts: [{ text: `Analyze this product feedback:\n\n${text}` }],
          },
        ],
      });

      const durationMs = Date.now() - started;
      const raw = response.response.text();
      if (!raw) {
        throw new AppError(
          ErrorCodes.AI_ANALYSIS_FAILED,
          "Empty response from AI provider",
          502,
        );
      }

      const result = parseAnalysisResponse(raw);
      log.info({
        event: "analysis_complete",
        provider: "gemini",
        model: this.deps.env.GEMINI_MODEL,
        durationMs,
        cacheHit: false,
        sentiment: result.sentiment,
        priority: result.priority,
      });
      return result;
    } catch (error) {
      this.logFailure(log, "gemini", this.deps.env.GEMINI_MODEL, started, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCodes.AI_ANALYSIS_FAILED,
        "Failed to analyze feedback",
        502,
      );
    }
  }

  private async callOpenAI(
    text: string,
    log: Logger,
    started: number,
  ): Promise<AnalysisResult> {
    if (!this.openai) {
      throw new AppError(
        ErrorCodes.AI_ANALYSIS_FAILED,
        "OpenAI client not configured",
        502,
      );
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: this.deps.env.OPENAI_MODEL,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analyze this product feedback:\n\n${text}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 400,
      });

      const durationMs = Date.now() - started;
      const raw = response.choices[0]?.message?.content;
      if (!raw) {
        throw new AppError(
          ErrorCodes.AI_ANALYSIS_FAILED,
          "Empty response from AI provider",
          502,
        );
      }

      const result = parseAnalysisResponse(raw);
      log.info({
        event: "analysis_complete",
        provider: "openai",
        model: this.deps.env.OPENAI_MODEL,
        durationMs,
        cacheHit: false,
        sentiment: result.sentiment,
        priority: result.priority,
      });
      return result;
    } catch (error) {
      this.logFailure(log, "openai", this.deps.env.OPENAI_MODEL, started, error);
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCodes.AI_ANALYSIS_FAILED,
        "Failed to analyze feedback",
        502,
      );
    }
  }

  private async callAnthropic(
    text: string,
    log: Logger,
    started: number,
  ): Promise<AnalysisResult> {
    if (!this.anthropicCreateMessage) {
      throw new AppError(
        ErrorCodes.AI_ANALYSIS_FAILED,
        "Anthropic client not configured",
        502,
      );
    }

    try {
      const response = await this.anthropicCreateMessage({
        model: this.deps.env.ANTHROPIC_MODEL,
        max_tokens: 400,
        system: `${SYSTEM_PROMPT}\n\nRespond with JSON only, no markdown.`,
        messages: [
          {
            role: "user",
            content: `Analyze this product feedback:\n\n${text}`,
          },
        ],
      });

      const durationMs = Date.now() - started;
      const block = response.content.find((c) => c.type === "text");
      const raw = block?.text;
      if (!raw) {
        throw new AppError(
          ErrorCodes.AI_ANALYSIS_FAILED,
          "Empty response from AI provider",
          502,
        );
      }

      const result = parseAnalysisResponse(raw);
      log.info({
        event: "analysis_complete",
        provider: "anthropic",
        model: this.deps.env.ANTHROPIC_MODEL,
        durationMs,
        cacheHit: false,
        sentiment: result.sentiment,
        priority: result.priority,
      });
      return result;
    } catch (error) {
      this.logFailure(
        log,
        "anthropic",
        this.deps.env.ANTHROPIC_MODEL,
        started,
        error,
      );
      if (error instanceof AppError) throw error;
      throw new AppError(
        ErrorCodes.AI_ANALYSIS_FAILED,
        "Failed to analyze feedback",
        502,
      );
    }
  }

  private logFailure(
    log: Logger,
    provider: string,
    model: string,
    started: number,
    error: unknown,
  ): void {
    log.error({
      event: "analysis_failed",
      provider,
      model,
      durationMs: Date.now() - started,
      cacheHit: false,
      err: error instanceof Error ? error.message : "unknown",
    });
  }

  static clearCache(): void {
    cache.clear();
  }
}

export { rootLogger };
