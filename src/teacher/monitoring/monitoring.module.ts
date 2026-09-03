import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from '../../general/class/entities/class.entity';
import { ClassAssign } from '../../general/class-assign/entities/class-assign.entity';
import { User } from '../../general/user/entities/user.entity';
import { Score } from '../../general/score/entities/score.entity';
import { RedisModule } from '../../redis/redis.module';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardModule } from '../dashboard/dahsboard.module';

@Module({
    imports: [TypeOrmModule.forFeature([Class, ClassAssign, User, Score]), RedisModule, DashboardModule],
    controllers: [MonitoringController],
    providers: [MonitoringService],
    exports: [MonitoringService],
})
export class MonitoringModule {}