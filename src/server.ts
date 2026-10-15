import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./config/data-source";
import { env } from "./config/env";
async function bootstrap() {
  try {
    // await AppDataSource.initialize();
    // console.log("PostgreSQL connected");
    const server = app.listen(env.PORT, () =>
      console.log(`API listening on port ${env.PORT}`),
    );
    const shutdown = async (signal: string) => {
      console.log(`${signal} received; shutting down`);
      server.close(async () => {
        if (AppDataSource.isInitialized) await AppDataSource.destroy();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10000).unref();
    };
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
  } catch (error) {
    console.error(
      "Application startup failed:",
      error instanceof Error ? error.name : "UnknownError",
    );
    process.exit(1);
  }
}
void bootstrap();
