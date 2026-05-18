import type { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";
import { AppError, ErrorCodes } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export async function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError | Error, request, reply) => {
    const requestId = request.id ?? "unknown";

    if (
      error instanceof AppError ||
      (error instanceof Error &&
        error.name === "AppError" &&
        "statusCode" in error &&
        "code" in error)
    ) {
      const appError = error as AppError;
      return reply.status(appError.statusCode).send({
        error: {
          code: appError.code,
          message: appError.message,
          requestId,
        },
      });
    }

    if (error instanceof ZodError || error.name === "ZodError") {
      const zodError = error as ZodError;
      return reply.status(400).send({
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: zodError.errors.map((e) => e.message).join("; "),
          requestId,
        },
      });
    }

    logger.error({
      requestId,
      err: error,
      message: error.message,
    });

    const statusCode =
      "statusCode" in error && typeof error.statusCode === "number"
        ? error.statusCode
        : 500;

    return reply.status(statusCode >= 400 && statusCode < 600 ? statusCode : 500).send({
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message:
          statusCode < 500 ? error.message : "An unexpected error occurred",
        requestId,
      },
    });
  });
}
