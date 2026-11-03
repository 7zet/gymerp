import { Inject, Injectable } from "@nestjs/common";
import type { Pool } from "pg";
import type { Redis } from "ioredis";
import { DATABASE_POOL, REDIS_CLIENT } from "../infra/tokens";

export type CheckStatus = "ok" | "error";

export interface HealthReport {
  status: "ok" | "degraded";
  checks: { database: CheckStatus; redis: CheckStatus };
}

@Injectable()
export class HealthService {
  constructor(
    @Inject(DATABASE_POOL) private readonly pool: Pool,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async check(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const ok = database === "ok" && redis === "ok";
    return { status: ok ? "ok" : "degraded", checks: { database, redis } };
  }

  private async checkDatabase(): Promise<CheckStatus> {
    try {
      await this.pool.query("SELECT 1");
      return "ok";
    } catch {
      return "error";
    }
  }

  private async checkRedis(): Promise<CheckStatus> {
    try {
      const reply: string = await this.redis.ping();
      return reply === "PONG" ? "ok" : "error";
    } catch {
      return "error";
    }
  }
}
