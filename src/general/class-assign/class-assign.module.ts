import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassAssign } from './entities/class-assign.entity';
import { ClassAssignController } from './class-assign.controller';
import { ClassAssignService } from './class-assign.service';
import { ClassAssignRepository } from './class-assign.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ClassAssign])],
  controllers: [ClassAssignController],
  providers: [ClassAssignService, ClassAssignRepository],
  exports: [ClassAssignService],
})
export class ClassAssignModule {}
