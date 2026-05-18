import type { FastifyInstance } from "fastify";
import { createRequestLogger } from "../lib/logger.js";

export async function registerRequestLogging(app: FastifyInstance) {
  app.addHook("onRequest", async (request) => {
    request.appLog = createRequestLogger(request.id);
    request.appLog.info({
      event: "request_start",
      method: request.method,
      path: request.url,
      contentLength: request.headers["content-length"] ?? null,
    });
  });

  app.addHook("onResponse", async (request, reply) => {
    const log = request.appLog ?? createRequestLogger(request.id);
    log.info({
      event: "request_complete",
      method: request.method,
      path: request.url,
      statusCode: reply.statusCode,
      durationMs: reply.elapsedTime,
    });
  });
}
