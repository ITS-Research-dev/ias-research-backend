// Placeholder worker using BullMQ (runs outside NestJS app or as provider)
import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const docQueue = new Queue('doc-processing', { connection });

new Worker('doc-processing', async job => {
    const { filepath, originalname } = job.data;
    console.log('Processing document', originalname, filepath);
    await new Promise(r => setTimeout(r, 1200));
    return { status: 'done', chunks: 48 };
}, { connection });