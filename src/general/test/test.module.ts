import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test } from './entities/test.entity';
import { TestController } from './test.controller';
import { TestService } from './test.service';
import { TestRepository } from './test.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Test])],
  controllers: [TestController],
  providers: [TestService, TestRepository],
  exports: [TestService, TestRepository],
})
export class TestModule {}
