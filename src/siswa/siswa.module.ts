import { Module } from '@nestjs/common';
import { SiswaTestModule } from './test/test.module';

@Module({
  imports: [SiswaTestModule],
  exports: [SiswaTestModule],
})
export class SiswaModule {}
