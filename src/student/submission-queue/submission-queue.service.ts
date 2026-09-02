import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import * as Bull from 'bull';
import { Subject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';

export const SUBMISSION_QUEUE_NAME = 'submission-assessment';

export interface SubmissionJobData {
    userId: string;
    testId: string;
    soal: string;
    expectedOutput: string;
    studentCode: string;
    hintUsage: number;
    questionTitle?: string;
}

export interface QueueEvent {
    type:
        | 'job:queued'
        | 'job:active'
        | 'job:completed'
        | 'job:failed'
        | 'queue:stats';
    jobId: string | number;
    userId?: string;
    data?: any;
    timestamp: number;
}

@Injectable()
export class SubmissionQueueService {
    private readonly logger = new Logger(SubmissionQueueService.name);

    /**
     * RxJS Subject that broadcasts queue events to all SSE subscribers.
     * Each SSE connection subscribes and filters for their own userId.
     */
    private readonly eventBus = new Subject<QueueEvent>();

    constructor(
        @InjectQueue(SUBMISSION_QUEUE_NAME)
        private readonly queue: Bull.Queue<SubmissionJobData>,
    ) {}

    /**
     * Add a submission job to the queue.
     * Returns the job id and the student's position in the queue.
     */
    async enqueue(
        userId: string,
        payload: Omit<SubmissionJobData, 'userId'>,
    ): Promise<{ jobId: string | number; position: number; totalWaiting: number }> {
        const job = await this.queue.add(
            {
                userId,
                ...payload,
            },
            {
                removeOnComplete: 100, // Keep last 100 completed jobs for status lookup
                removeOnFail: 50,
                attempts: 2,
                backoff: { type: 'exponential', delay: 5000 },
            },
        );

        // Calculate position: count waiting jobs that were added before this one
        const waiting = await this.queue.getWaiting();
        const position = waiting.findIndex((w) => w.id === job.id) + 1;
        const totalWaiting = waiting.length;

        // Broadcast the new job event
        this.emitEvent({
            type: 'job:queued',
            jobId: job.id,
            userId,
            data: {
                questionTitle: payload.questionTitle,
                position,
                totalWaiting,
            },
            timestamp: Date.now(),
        });

        this.logger.log(
            `Job ${job.id} enqueued for user ${userId} (position ${position}/${totalWaiting})`,
        );

        return { jobId: job.id, position, totalWaiting };
    }

    /**
     * Get the status of a specific job.
     */
    async getJobStatus(jobId: string): Promise<{
        id: string | number;
        status: string;
        data: SubmissionJobData;
        result?: any;
        failedReason?: string;
        progress: number;
        position?: number;
    } | null> {
        const job = await this.queue.getJob(jobId);
        if (!job) return null;

        const state = await job.getState();

        let position: number | undefined;
        if (state === 'waiting') {
            const waiting = await this.queue.getWaiting();
            const idx = waiting.findIndex((w) => String(w.id) === String(job.id));
            position = idx >= 0 ? idx + 1 : undefined;
        }

        return {
            id: job.id,
            status: state,
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason,
            progress: typeof job.progress === 'function' ? await job.progress() : (job.progress as any),
            position,
        };
    }

    /**
     * Get all jobs for a given user (waiting + active + completed + failed).
     */
    async getUserJobs(userId: string): Promise<any[]> {
        const [waiting, active, completed, failed] = await Promise.all([
            this.queue.getWaiting(),
            this.queue.getActive(),
            this.queue.getCompleted(0, 20),
            this.queue.getFailed(0, 10),
        ]);

        const allJobs = [...waiting, ...active, ...completed, ...failed];
        const userJobs = allJobs.filter((job) => job.data.userId === userId);

        const results = await Promise.all(
            userJobs.map(async (job) => {
                const state = await job.getState();

                let position: number | undefined;
                if (state === 'waiting') {
                    const idx = waiting.findIndex(
                        (w) => String(w.id) === String(job.id),
                    );
                    position = idx >= 0 ? idx + 1 : undefined;
                }

                return {
                    id: String(job.id),
                    testId: job.data.testId,
                    questionTitle: job.data.questionTitle || 'Soal',
                    status: this.mapBullStateToQueueStatus(state),
                    result: job.returnvalue || undefined,
                    error: job.failedReason || undefined,
                    submittedAt: job.timestamp,
                    startedAt: job.processedOn || undefined,
                    completedAt: job.finishedOn || undefined,
                    position,
                };
            }),
        );

        // Sort: running first, then queued (by position), then completed/failed (by completedAt desc)
        return results.sort((a, b) => {
            const order: Record<string, number> = {
                running: 0,
                queued: 1,
                completed: 2,
                failed: 3,
            };
            const oa = order[a.status] ?? 4;
            const ob = order[b.status] ?? 4;
            if (oa !== ob) return oa - ob;
            return (a.submittedAt ?? 0) - (b.submittedAt ?? 0);
        });
    }

    /**
     * Get global queue statistics.
     */
    async getQueueStats(): Promise<{
        waiting: number;
        active: number;
        completed: number;
        failed: number;
    }> {
        const [waiting, active, completed, failed] = await Promise.all([
            this.queue.getWaitingCount(),
            this.queue.getActiveCount(),
            this.queue.getCompletedCount(),
            this.queue.getFailedCount(),
        ]);

        return { waiting, active, completed, failed };
    }

    /**
     * Emit an event to all SSE subscribers.
     */
    emitEvent(event: QueueEvent): void {
        this.eventBus.next(event);
    }

    /**
     * Subscribe to queue events for a specific user.
     * Returns an Observable that emits SSE-formatted events.
     * - Events targeted at the user are sent with full data
     * - Global queue stats are sent to everyone
     */
    subscribeForUser(userId: string): Observable<MessageEvent> {
        return this.eventBus.asObservable().pipe(
            filter((event) => {
                // Always send stats events to everyone
                if (event.type === 'queue:stats') return true;
                // Send user-specific events only to that user
                return event.userId === userId;
            }),
            map((event) => {
                return {
                    data: JSON.stringify(event),
                } as MessageEvent;
            }),
        );
    }

    private mapBullStateToQueueStatus(
        state: string,
    ): 'queued' | 'running' | 'completed' | 'failed' {
        switch (state) {
            case 'waiting':
            case 'delayed':
                return 'queued';
            case 'active':
                return 'running';
            case 'completed':
                return 'completed';
            case 'failed':
                return 'failed';
            default:
                return 'queued';
        }
    }
}
