import { Module } from "@nestjs/common";
import { createPool } from "./infra/database";
import { redisConnection } from "./infra/redis";
import { DATABASE_POOL, REDIS_CLIENT } from "./infra/tokens";
import { HealthController } from "./health/health.controller";
import { HealthService } from "./health/health.service";

@Module({
  controllers: [HealthController],
  providers: [
    { provide: DATABASE_POOL, useFactory: () => createPool() },
    { provide: REDIS_CLIENT, useFactory: () => redisConnection() },
    HealthService,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class -- Nest modules hold no logic
export class AppModule {}
