import { Controller, Post, Body } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { AssessCodeDto } from './dto/assess-code.dto';

@Controller('siswa/test')
export class SiswaTestController {
    constructor(private readonly ollamaService: OllamaService) { }

    @Post('ai/assess')
    async assessAi(@Body() dto: AssessCodeDto) {
        return this.ollamaService.assessCode(
            dto.soal,
            dto.expectedOutput,
            dto.studentCode,
            dto.hintUsage
        );
    }
}
