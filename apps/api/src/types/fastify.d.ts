import type { Logger } from "pino";

declare module "fastify" {
  interface FastifyRequest {
    appLog: Logger;
  }
}
