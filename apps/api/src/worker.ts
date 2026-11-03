import "reflect-metadata";
import { Worker } from "bullmq";
import { redisConnection } from "./infra/redis";

// Job handlers are added in step 5.1. Until then the worker only proves it can
// connect to Redis and pick up jobs from the default queue.
const worker = new Worker(
  "default",
  (job) => {
    console.log(`job ${job.name} received, no handler registered`);
    return Promise.resolve();
  },
  { connection: redisConnection() },
);

worker.on("failed", (job, err) => {
  console.error(`job ${job?.name ?? "unknown"} failed: ${err.message}`);
});

console.log("worker started");
