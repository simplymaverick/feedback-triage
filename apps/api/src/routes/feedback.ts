import type { FastifyInstance } from "fastify";
import type { Env } from "../config.js";
import { ErrorCodes } from "../lib/errors.js";
import { createRequestLogger } from "../lib/logger.js";
import { FeedbackRepository } from "../repositories/feedback.js";
import {
  createFeedbackSchema,
  listFeedbackQuerySchema,
} from "../schemas/feedback.js";
import { AnalysisService } from "../services/analysis.js";

function requestLog(request: { id: string; appLog?: ReturnType<typeof createRequestLogger> }) {
  return request.appLog ?? createRequestLogger(request.id);
}

export async function feedbackRoutes(app: FastifyInstance, env: Env) {
  const repository = new FeedbackRepository();
  const analysisService = new AnalysisService({ env });

  app.post("/feedback", async (request, reply) => {
    const log = requestLog(request);
    const parsed = createFeedbackSchema.safeParse(request.body);
    if (!parsed.success) {
      log.warn({
        event: "validation_failed",
        route: "POST /api/feedback",
        errors: parsed.error.errors.map((e) => e.path.join(".")),
      });
      return reply.status(400).send({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: parsed.error.errors.map((e) => e.message).join("; "),
          requestId: request.id,
        },
      });
    }
    const body = parsed.data;
    const email = body.email && body.email.length > 0 ? body.email : undefined;

    const analysis = await analysisService.analyze(body.text, log);
    const record = await repository.create(
      {
        text: body.text,
        email,
        analysis,
      },
      log,
    );

    log.info({
      event: "feedback_created",
      feedbackId: record.id,
      textLength: body.text.length,
      hasEmail: Boolean(email),
    });

    return reply.status(201).send(record);
  });

  app.get("/feedback", async (request, reply) => {
    const log = requestLog(request);
    const parsed = listFeedbackQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      log.warn({
        event: "validation_failed",
        route: "GET /api/feedback",
        errors: parsed.error.errors.map((e) => e.path.join(".")),
      });
      return reply.status(400).send({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: parsed.error.errors.map((e) => e.message).join("; "),
          requestId: request.id,
        },
      });
    }
    return repository.list(parsed.data, log);
  });

  app.get<{ Params: { id: string } }>("/feedback/:id", async (request, reply) => {
    const log = requestLog(request);
    const record = await repository.findById(request.params.id, log);
    if (!record) {
      log.warn({
        event: "feedback_not_found",
        feedbackId: request.params.id,
      });
      return reply.status(404).send({
        error: {
          code: ErrorCodes.NOT_FOUND,
          message: "Feedback not found",
          requestId: request.id,
        },
      });
    }
    return record;
  });
}
