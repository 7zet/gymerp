import { Redis } from "ioredis";

export function redisUrl(): string {
  return process.env.REDIS_URL ?? "redis://localhost:6379";
}

// BullMQ requires maxRetriesPerRequest = null for workers.
export function redisConnection(): Redis {
  return new Redis(redisUrl(), { maxRetriesPerRequest: null });
}
