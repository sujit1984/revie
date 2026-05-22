import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis(process.env.REDIS_URL ?? "redis://localhost:6379", {
  maxRetriesPerRequest: null
});

const queueName = "revie-risk-scan";
export const riskQueue = new Queue(queueName, { connection });

new Worker(
  queueName,
  async (job) => {
    console.log(`Running fraud/risk job ${job.id}`, job.data);
    return { done: true };
  },
  { connection }
);

console.log("Revie worker started and listening for jobs");
