import { Module } from '@nestjs/common';
import { SiswaTestController } from './test.controller';
import { OllamaService } from './ollama.service';

@Module({
    controllers: [SiswaTestController],
    providers: [OllamaService],
    exports: [OllamaService],
})
export class SiswaTestModule { }
