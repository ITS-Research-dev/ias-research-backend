import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SubmissionQueueController } from './submission-queue.controller';
import { SubmissionQueueService, SUBMISSION_QUEUE_NAME } from './submission-queue.service';
import { SubmissionQueueProcessor } from './submission-queue.processor';
import { Score } from '../../general/score/entities/score.entity';
import { SiswaTestModule } from '../../siswa/test/test.module';

@Module({
    imports: [
        BullModule.registerQueue({
            name: SUBMISSION_QUEUE_NAME,
        }),
        TypeOrmModule.forFeature([Score]),
        SiswaTestModule, // exports OllamaService
    ],
    controllers: [SubmissionQueueController],
    providers: [SubmissionQueueService, SubmissionQueueProcessor],
    exports: [SubmissionQueueService],
})
export class SubmissionQueueModule {}
