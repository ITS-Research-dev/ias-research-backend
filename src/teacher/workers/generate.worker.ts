import { Worker, Queue } from 'bullmq';
import IORedis from 'ioredis';
const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const genQueue = new Queue('generate', { connection });

new Worker('generate', async job => {
    const { kind, topic, jobId } = job.data;
    console.log('Generating', kind, 'for', topic, jobId);
    await new Promise(r => setTimeout(r, 1600));
    return { status: 'done', draftId: `draft-${jobId}` };
}, { connection });