import { Controller, Get, Query, Param, Post, Body, UseGuards, NotFoundException } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { TeacherGuard } from '../../../common/guards/teacher.guard';
import { ReviewRequestDto } from './dto/review-request.dto';
import { ReviewRetryDto } from './dto/review-retry.dto';

@Controller('teacher/verifications')
@UseGuards(TeacherGuard)
export class VerificationController {
    constructor(private readonly svc: VerificationService) {}

    @Get()
    async list(@Query('class') classId: string) {
        return this.svc.listQueue(classId);
    }

    @Get(':id')
    async get(@Param('id') id: string) {
        const s = await this.svc.getSubmissionDetail(id);
        if (!s) throw new NotFoundException();
        return s;
    }

    @Post(':id/review')
    async review(@Param('id') id: string, @Body() body: ReviewRequestDto) {
        return this.svc.review(id, body);
    }

    @Post(':id/retry')
    async retry(@Param('id') id: string, @Body() body: ReviewRetryDto) {
        return this.svc.retry(id, body);
    }
}