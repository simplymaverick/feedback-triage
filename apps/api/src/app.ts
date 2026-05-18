import { randomUUID } from "node:crypto";
import cors from "@fastify/cors";
import Fastify from "fastify";
import type { Env } from "./config.js";
import { registerErrorHandler } from "./middleware/errorHandler.js";
import { registerRequestLogging } from "./middleware/logging.js";
import { registerRequestId } from "./middleware/requestId.js";
import { feedbackRoutes } from "./routes/feedback.js";

export async function buildApp(env: Env) {
  const app = Fastify({
    logger: false,
    requestIdHeader: "x-request-id",
    genReqId: (request) => {
      const incoming = request.headers["x-request-id"];
      if (typeof incoming === "string" && incoming.length > 0) {
        return incoming;
      }
      return randomUUID();
    },
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
  });

  // Register hooks on the root instance so they apply to all routes (including /api).
  // Using app.register() for these would encapsulate hooks and skip prefixed routes.
  await registerRequestId(app);
  await registerRequestLogging(app);
  await registerErrorHandler(app);

  await app.register(
    async (api) => {
      await feedbackRoutes(api, env);
    },
    { prefix: "/api" },
  );

  app.get("/health", async () => ({ status: "ok" }));

  return app;
}
