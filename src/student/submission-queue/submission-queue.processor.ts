import { Process, Processor, OnQueueActive, OnQueueCompleted, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import * as Bull from 'bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as OllamaTypes from '../../siswa/test/ollama.service';
import { OllamaService } from '../../siswa/test/ollama.service';
import { Score } from '../../general/score/entities/score.entity';
import { SubmissionQueueService, SUBMISSION_QUEUE_NAME } from './submission-queue.service';
import type { SubmissionJobData } from './submission-queue.service';

@Processor(SUBMISSION_QUEUE_NAME)
export class SubmissionQueueProcessor {
    private readonly logger = new Logger(SubmissionQueueProcessor.name);

    constructor(
        private readonly ollamaService: OllamaService,
        private readonly queueService: SubmissionQueueService,
        @InjectRepository(Score) private readonly scoreRepo: Repository<Score>,
    ) {}

    /**
     * Process a submission job:
     * 1. Call OllamaService to assess the code
     * 2. Persist the result as a Score in the database
     * 3. Return the assessment result (stored as job.returnvalue)
     */
    @Process({ concurrency: 1 })
    async handleAssessment(job: Bull.Job<SubmissionJobData>): Promise<OllamaTypes.OllamaAssessmentResult & { scoreId: string }> {
        const { userId, testId, soal, expectedOutput, studentCode, hintUsage } = job.data;

        this.logger.log(`Processing job ${job.id} for user ${userId} (test: ${testId})`);

        // 1. Call AI assessment
        const result = await this.ollamaService.assessCode(
            soal,
            expectedOutput,
            studentCode,
            hintUsage,
        );

        // 2. Persist to Score table
        const score = this.scoreRepo.create({
            idTest: testId,
            idUser: userId,
            level: result.level,
            averageScore: Math.round(result.overallScore),
            flagOverride: false,
            hintUsage: result.hintUsage,
            aiScore: result.aiScore,
            aiSuggestion: result.aiSuggestion,
            aiFinishTime: result.aiFinishTime as unknown as Date,
            uCode: studentCode,
        });

        const savedScore = await this.scoreRepo.save(score);
        this.logger.log(`Job ${job.id} completed. Score saved: ${savedScore.id}`);

        return { ...result, scoreId: savedScore.id };
    }

    @OnQueueActive()
    onActive(job: Bull.Job<SubmissionJobData>) {
        this.logger.log(`Job ${job.id} is now active (user: ${job.data.userId})`);

        this.queueService.emitEvent({
            type: 'job:active',
            jobId: job.id,
            userId: job.data.userId,
            data: {
                questionTitle: job.data.questionTitle,
            },
            timestamp: Date.now(),
        });

        // Broadcast updated stats to all
        this.broadcastStats();
    }

    @OnQueueCompleted()
    onCompleted(job: Bull.Job<SubmissionJobData>, result: OllamaTypes.OllamaAssessmentResult & { scoreId: string }) {
        this.logger.log(`Job ${job.id} completed (user: ${job.data.userId})`);

        this.queueService.emitEvent({
            type: 'job:completed',
            jobId: job.id,
            userId: job.data.userId,
            data: {
                questionTitle: job.data.questionTitle,
                testId: job.data.testId,
                result,
            },
            timestamp: Date.now(),
        });

        // Broadcast updated stats to all
        this.broadcastStats();
    }

    @OnQueueFailed()
    onFailed(job: Bull.Job<SubmissionJobData>, error: Error) {
        this.logger.error(
            `Job ${job.id} failed (user: ${job.data.userId}): ${error.message}`,
            error.stack,
        );

        this.queueService.emitEvent({
            type: 'job:failed',
            jobId: job.id,
            userId: job.data.userId,
            data: {
                questionTitle: job.data.questionTitle,
                error: error.message,
                attemptsMade: job.attemptsMade,
            },
            timestamp: Date.now(),
        });

        // Broadcast updated stats to all
        this.broadcastStats();
    }

    private async broadcastStats() {
        try {
            const stats = await this.queueService.getQueueStats();
            this.queueService.emitEvent({
                type: 'queue:stats',
                jobId: 'global',
                data: stats,
                timestamp: Date.now(),
            });
        } catch (e) {
            this.logger.warn('Failed to broadcast queue stats', e);
        }
    }
}
