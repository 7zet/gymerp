import { describe, expect, it } from "vitest";
import { HealthService } from "../src/health/health.service";

function fakePool(fail: boolean) {
  return {
    query: () => {
      if (fail) return Promise.reject(new Error("connection refused"));
      return Promise.resolve({ rows: [] });
    },
  };
}

function fakeRedis(reply: string | Error) {
  return {
    ping: () => (reply instanceof Error ? Promise.reject(reply) : Promise.resolve(reply)),
  };
}

describe("HealthService", () => {
  it("reports ok when database and redis respond", async () => {
    // Constructor arguments are structurally typed fakes for the test.
    const svc = new HealthService(fakePool(false) as never, fakeRedis("PONG") as never);
    await expect(svc.check()).resolves.toEqual({
      status: "ok",
      checks: { database: "ok", redis: "ok" },
    });
  });

  it("reports degraded when database is down", async () => {
    const svc = new HealthService(fakePool(true) as never, fakeRedis("PONG") as never);
    await expect(svc.check()).resolves.toEqual({
      status: "degraded",
      checks: { database: "error", redis: "ok" },
    });
  });

  it("reports degraded when redis is down", async () => {
    const svc = new HealthService(
      fakePool(false) as never,
      fakeRedis(new Error("ECONNREFUSED")) as never,
    );
    await expect(svc.check()).resolves.toEqual({
      status: "degraded",
      checks: { database: "ok", redis: "error" },
    });
  });
});
