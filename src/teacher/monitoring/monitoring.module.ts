import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Submission } from '../verification/entities/submission.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Submission])],
    controllers: [MonitoringController],
    providers: [MonitoringService],
    exports: [MonitoringService],
})
export class MonitoringModule {}