import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Progress } from './entities/progress.entity';
import { ProgressController } from './progress.controller';
import { ProgressService } from './progress.service';
import { ProgressRepository } from './progress.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Progress])],
  controllers: [ProgressController],
  providers: [ProgressService, ProgressRepository],
  exports: [ProgressService],
})
export class ProgressModule {}
