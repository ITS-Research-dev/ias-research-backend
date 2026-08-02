import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from './entities/score.entity';
import { ScoreController } from './score.controller';
import { ScoreService } from './score.service';
import { ScoreRepository } from './score.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Score])],
  controllers: [ScoreController],
  providers: [ScoreService, ScoreRepository],
  exports: [ScoreService, ScoreRepository],
})
export class ScoreModule {}
