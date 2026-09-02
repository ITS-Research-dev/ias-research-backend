import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { SubmitTestDto } from './dto/submit-test.dto';
import { SiswaAuth } from '../../common/decorators/siswa-auth.decorator';

@SiswaAuth()
@Controller('queue')
export class QueueController {
    constructor(private readonly queueService: QueueService) {}

    /**
     * Submit test untuk diproses
     * POST /queue/submit
     */
    @Post('submit')
    @HttpCode(HttpStatus.ACCEPTED)
    async submitTest(@Body() dto: SubmitTestDto, @Req() req: any) {
        const userId = req.user?.id;
        if (!userId) {
        throw new Error('User ID not found');
        }

        return this.queueService.submitRequest(
        userId,
        dto.testId,
        dto.code,
        5, // Default priority
        );
    }

    /**
     * Check status dari request
     * GET /queue/status/:requestId
     */
    @Get('status/:requestId')
    async getStatus(@Param('requestId') requestId: string) {
        return this.queueService.getRequestStatus(requestId);
    }

    /**
     * Get queue statistics
     * GET /queue/stats
     */
    @Get('stats')
    async getStats() {
        return this.queueService.getQueueStats();
    }

    /**
     * Clear completed requests
     * POST /queue/cleanup
     */
    @Post('cleanup')
    @HttpCode(HttpStatus.OK)
    async cleanup() {
        await this.queueService.clearCompletedRequests();
        return { message: 'Cleanup completed' };
  }
}