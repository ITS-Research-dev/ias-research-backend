import { Module } from '@nestjs/common';
import { SiswaTestController } from './test.controller';
import { OllamaService } from './ollama.service';
import { ScoreModule } from '../../general/score/score.module';
import { RedisModule } from '../../redis/redis.module';
import { ProgressModule } from '../../general/progress/progress.module';

@Module({
    imports: [ScoreModule, RedisModule, ProgressModule],
    controllers: [SiswaTestController],
    providers: [OllamaService],
    exports: [OllamaService],
})
export class SiswaTestModule { }

