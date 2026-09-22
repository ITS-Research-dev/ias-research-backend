import { Controller, Post, Body, Req } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { AssessCodeDto } from './dto/assess-code.dto';
import { SiswaAuth } from '../../../common/decorators/siswa-auth.decorator';
import { ScoreRepository } from '../../general/score/score.repository';

@SiswaAuth()
@Controller('siswa/test')
export class SiswaTestController {
    constructor(
        private readonly ollamaService: OllamaService,
        private readonly scoreRepository: ScoreRepository,
    ) { }

    @Post('ai/assess')
    async assessAi(@Body() dto: AssessCodeDto, @Req() req: any) {
        const userId = req.user?.id;

        return this.ollamaService.assessCode(
            dto.soal,
            dto.expectedOutput,
            dto.studentCode,
            dto.hintUsage,
            dto.testId,
            userId,
        );
    }
}

