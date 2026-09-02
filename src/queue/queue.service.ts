import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { GeminiTokenService } from '../gemini-token/gemini-token.service';
import { v4 as uuidv4 } from 'uuid';
import { IQueueRequest, IQueueResponse, IQueueStatusResponse } from './queue-request.model';

const QUEUE_PREFIX = 'queue';
const QUEUE_KEY = `${QUEUE_PREFIX}:requests`;
const QUEUE_PROCESSING_KEY = `${QUEUE_PREFIX}:processing`;
const QUEUE_COMPLETED_KEY = `${QUEUE_PREFIX}:completed`;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(QueueService.name);
    private isProcessing = false;
    private processInterval: NodeJS.Timeout | null = null;
    private readonly PROCESS_INTERVAL_MS = 1000; // Proses queue setiap 1 detik

    constructor(
        private readonly redisService: RedisService,
        private readonly geminiTokenService: GeminiTokenService,
    ) {}

    async onModuleInit() {
        this.logger.log('Initializing Queue Service');
        // Mulai proses queue otomatis
        this.startQueueProcessor();
    }

    async onModuleDestroy() {
        this.logger.log('Destroying Queue Service');
        this.stopQueueProcessor();
    }

    /**
     * Submit request untuk diproses
     * Request akan disimpan di queue dengan status 'pending'
     */
    async submitRequest(
        userId: string,
        testId: string,
        code: string,
        priority: number = 5,
    ): Promise<IQueueResponse> {
        try {
        const requestId = uuidv4();
        const request: IQueueRequest = {
            id: requestId,
            userId,
            testId,
            code,
            status: 'pending',
            createdAt: new Date(),
            priority: Math.min(Math.max(priority, 1), 10), // Clamp between 1-10
        };

        // Simpan request ke Redis dengan TTL 24 jam
        await this.redisService.set(
            `${QUEUE_PREFIX}:request:${requestId}`,
            request,
            86400,
        );

        // Tambah ke queue list (sorted by priority)
        await this.redisService.getClient().zadd(
            QUEUE_KEY,
            -priority, // Negative untuk sort descending (prioritas tinggi duluan)
            requestId,
        );

        this.logger.log(`Request ${requestId} submitted by user ${userId}`);

        return {
            id: requestId,
            status: 'pending',
            message: 'Request telah ditambahkan ke queue',
        };
        } catch (error) {
        this.logger.error('Error submitting request:', error);
        throw error;
        }
    }

    /**
     * Ambil status dari request
     */
    async getRequestStatus(requestId: string): Promise<IQueueStatusResponse> {
        try {
        const request = await this.redisService.get<IQueueRequest>(
            `${QUEUE_PREFIX}:request:${requestId}`,
        );

        if (!request) {
            throw new Error(`Request ${requestId} tidak ditemukan`);
        }

        const response: IQueueStatusResponse = {
            id: request.id,
            status: request.status,
            createdAt: request.createdAt,
        };

        // Jika status pending, hitung posisi dalam queue
        if (request.status === 'pending') {
            const position = await this.getQueuePosition(requestId);
            response.position = position;
        }

        if (request.processedAt) {
            response.processedAt = request.processedAt;
        }

        if (request.completedAt) {
            response.completedAt = request.completedAt;
        }

        if (request.result) {
            response.result = request.result;
        }

        if (request.error) {
            response.error = request.error;
        }

        return response;
        } catch (error) {
        this.logger.error(`Error getting request status ${requestId}:`, error);
        throw error;
        }
    }

    /**
     * Get posisi request dalam queue
     */
    private async getQueuePosition(requestId: string): Promise<number> {
        try {
        const position = await this.redisService
            .getClient()
            .zrank(QUEUE_KEY, requestId);
        return position !== null ? position + 1 : -1; // +1 karena index dimulai dari 0
        } catch (error) {
        this.logger.error(`Error getting queue position for ${requestId}:`, error);
        return -1;
        }
    }

    /**
     * Mulai proses queue secara otomatis
     */
    private startQueueProcessor() {
        this.processInterval = setInterval(async () => {
        if (!this.isProcessing) {
            await this.processNextRequest();
        }
        }, this.PROCESS_INTERVAL_MS);

        this.logger.log('Queue processor started');
    }

    /**
     * Hentikan proses queue
     */
    private stopQueueProcessor() {
        if (this.processInterval) {
        clearInterval(this.processInterval);
        this.processInterval = null;
        }
        this.logger.log('Queue processor stopped');
    }

    /**
     * Proses request berikutnya dari queue
     */
    private async processNextRequest() {
        try {
        // Ambil request dengan prioritas tertinggi (pertama dari zset)
        const client = this.redisService.getClient();
        const requestIds = await client.zrange(QUEUE_KEY, 0, 0);

        if (requestIds.length === 0) {
            return; // Queue kosong
        }

        const requestId = requestIds[0];

        // Pindah dari queue ke processing
        await client.zrem(QUEUE_KEY, requestId);
        await client.zadd(QUEUE_PROCESSING_KEY, Date.now(), requestId);

        // Ambil request data
        const request = await this.redisService.get<IQueueRequest>(
            `${QUEUE_PREFIX}:request:${requestId}`,
        );

        if (!request) {
            this.logger.warn(`Request ${requestId} not found during processing`);
            await client.zrem(QUEUE_PROCESSING_KEY, requestId);
            return;
        }

        // Update status menjadi processing
        request.status = 'processing';
        request.processedAt = new Date();
        await this.redisService.set(
            `${QUEUE_PREFIX}:request:${requestId}`,
            request,
            86400,
        );

        this.logger.log(`Processing request ${requestId}`);

        // Proses dengan Gemini AI
        await this.processWithGemini(requestId, request);
        } catch (error) {
        this.logger.error('Error in processNextRequest:', error);
        }
    }

    /**
     * Proses request dengan Gemini AI (scoring)
     */
    private async processWithGemini(
        requestId: string,
        request: IQueueRequest,
    ) {
        try {
        // TODO: Implementasi scoring dengan Gemini AI
        // Untuk sekarang, simulasi dengan timeout
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Simulasi hasil scoring
        const mockResult = {
            stdout: 'Code executed successfully',
            stderr: '',
            exitCode: 0,
        };

        // Update request dengan hasil
        request.status = 'completed';
        request.completedAt = new Date();
        request.result = mockResult;

        await this.redisService.set(
            `${QUEUE_PREFIX}:request:${requestId}`,
            request,
            86400,
        );

        // Pindah dari processing ke completed
        const client = this.redisService.getClient();
        await client.zrem(QUEUE_PROCESSING_KEY, requestId);
        await client.zadd(QUEUE_COMPLETED_KEY, Date.now(), requestId);

        this.logger.log(`Request ${requestId} completed successfully`);
        } catch (error) {
        this.logger.error(`Error processing request ${requestId}:`, error);

        // Update dengan error status
        request.status = 'failed';
        request.completedAt = new Date();
        request.error = (error as Error).message;

        await this.redisService.set(
            `${QUEUE_PREFIX}:request:${requestId}`,
            request,
            86400,
        );

        const client = this.redisService.getClient();
        await client.zrem(QUEUE_PROCESSING_KEY, requestId);
        await client.zadd(QUEUE_COMPLETED_KEY, Date.now(), requestId);
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats() {
        try {
        const client = this.redisService.getClient();
        const pendingCount = await client.zcard(QUEUE_KEY);
        const processingCount = await client.zcard(QUEUE_PROCESSING_KEY);
        const completedCount = await client.zcard(QUEUE_COMPLETED_KEY);

        return {
            pending: pendingCount,
            processing: processingCount,
            completed: completedCount,
            total: pendingCount + processingCount + completedCount,
        };
        } catch (error) {
        this.logger.error('Error getting queue stats:', error);
        throw error;
        }
    }

    /**
     * Clear completed requests (cleanup)
     */
    async clearCompletedRequests() {
        try {
        const client = this.redisService.getClient();
        const completedIds = await client.zrange(QUEUE_COMPLETED_KEY, 0, -1);

        for (const requestId of completedIds) {
            await this.redisService.delete(`${QUEUE_PREFIX}:request:${requestId}`);
        }

        await client.del(QUEUE_COMPLETED_KEY);
        this.logger.log(`Cleared ${completedIds.length} completed requests`);
        } catch (error) {
        this.logger.error('Error clearing completed requests:', error);
        throw error;
        }
    }
}