import { Controller, Post, Get, Param, Body, Req, Sse, Query } from '@nestjs/common';
import { Observable, interval, merge, map } from 'rxjs';
import { SiswaAuth } from '../../../common/decorators/siswa-auth.decorator';
import { SubmissionQueueService } from './submission-queue.service';
import { SubmitToQueueDto } from './dto/submit-to-queue.dto';

@SiswaAuth()
@Controller('siswa/submission')
export class SubmissionQueueController {
    constructor(private readonly queueService: SubmissionQueueService) {}

    /**
     * Submit code to the assessment queue.
     * Returns immediately with the job ID and queue position.
     */
    @Post('submit')
    async submit(@Body() dto: SubmitToQueueDto, @Req() req: any) {
        const userId = req.user?.id;

        const { jobId, position, totalWaiting } = await this.queueService.enqueue(
            userId,
            {
                testId: dto.testId,
                soal: dto.soal,
                expectedOutput: dto.expectedOutput,
                studentCode: dto.studentCode,
                hintUsage: dto.hintUsage,
                questionTitle: dto.questionTitle,
            },
        );

        return { jobId, position, totalWaiting };
    }

    /**
     * SSE endpoint: streams real-time queue updates to the connected student.
     *
     * The student's browser opens an EventSource to this endpoint.
     * They receive:
     * - Their own job lifecycle events (queued → active → completed/failed)
     * - Global queue stats (so they know their position)
     *
     * A heartbeat is sent every 30s to keep the connection alive.
     */
    @Sse('queue/events')
    streamQueueEvents(@Req() req: any): Observable<MessageEvent> {
        const userId = req.user?.userId || req.user?.id;

        // Heartbeat every 30s to prevent proxy/load-balancer timeouts
        const heartbeat$ = interval(30_000).pipe(
            map(
                () =>
                    ({
                        data: JSON.stringify({
                            type: 'heartbeat',
                            timestamp: Date.now(),
                        }),
                    }) as MessageEvent,
            ),
        );

        // User-specific queue events
        const events$ = this.queueService.subscribeForUser(userId);

        return merge(heartbeat$, events$);
    }

    /**
     * Get the status of a specific job (poll-based fallback).
     */
    @Get('status/:jobId')
    async getJobStatus(@Param('jobId') jobId: string) {
        const status = await this.queueService.getJobStatus(jobId);
        if (!status) {
            return { found: false };
        }
        return status;
    }

    /**
     * Get all queue items for the current user.
     * Useful for restoring queue state after page refresh.
     */
    @Get('my-queue')
    async getMyQueue(@Req() req: any) {
        const userId = req.user?.userId || req.user?.id;
        return this.queueService.getUserJobs(userId);
    }

    /**
     * Get global queue statistics (visible to all students).
     * Returns anonymous counts: waiting, active, completed, failed.
     */
    @Get('stats')
    async getQueueStats() {
        return this.queueService.getQueueStats();
    }
}
