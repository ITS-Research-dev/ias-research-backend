/**
 * Model untuk request yang ada di dalam queue
 */
export interface IQueueRequest {
    id: string; // UUID
    userId: string;
    testId: string;
    code: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    createdAt: Date;
    processedAt?: Date;
    completedAt?: Date;
    result?: {
        stdout: string;
        stderr: string;
        exitCode: number;
    };
    error?: string;
    priority: number; // 1-10, dimana 10 adalah prioritas tertinggi
}

/**
 * Response untuk client ketika submit request
 */
export interface IQueueResponse {
    id: string;
    status: string;
    position?: number; // Posisi dalam queue (jika pending)
    message: string;
    }

/**
 * Response untuk check status
 */
export interface IQueueStatusResponse {
    id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    position?: number; // Posisi dalam queue (jika pending)
    result?: {
        stdout: string;
        stderr: string;
        exitCode: number;
    };
    error?: string;
    createdAt: Date;
    processedAt?: Date;
    completedAt?: Date;
}