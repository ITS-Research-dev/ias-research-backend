import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ClassModule } from '../../general/class/class.module';
import { ScoreModule } from '../../general/score/score.module';
import { RedisModule } from '../../redis/redis.module';

@Module({
    imports: [ClassModule, ScoreModule, RedisModule],
    controllers: [DashboardController],
    providers: [DashboardService],
    exports: [DashboardService],
})
export class DashboardModule {}