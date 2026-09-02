import { Module } from '@nestjs/common';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { RedisModule } from '../redis/redis.module';
import { GeminiTokenModule } from '../gemini-token/gemini-token.module';

@Module({
    imports: [RedisModule, GeminiTokenModule],
    providers: [QueueService],
    controllers: [QueueController],
    exports: [QueueService],
})
export class QueueModule {}