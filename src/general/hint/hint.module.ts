import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hint } from './entities/hint.entity';
import { HintController } from './hint.controller';
import { HintService } from './hint.service';
import { HintRepository } from './hint.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Hint])],
  controllers: [HintController],
  providers: [HintService, HintRepository],
  exports: [HintService, HintRepository],
})
export class HintModule {}
