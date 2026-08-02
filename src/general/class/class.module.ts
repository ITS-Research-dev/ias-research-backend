import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Class } from './entities/class.entity';
import { ClassController } from './class.controller';
import { ClassService } from './class.service';
import { ClassRepository } from './class.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Class])],
  controllers: [ClassController],
  providers: [ClassService, ClassRepository],
  exports: [ClassService, ClassRepository],
})
export class ClassModule {}
