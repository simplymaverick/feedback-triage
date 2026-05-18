import { loadConfig } from "./config.js";
import { buildApp } from "./app.js";
import { logger } from "./lib/logger.js";

async function main() {
  const env = loadConfig();
  const app = await buildApp(env);

  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info({ port: env.PORT }, "API server listening");
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
}

main();
