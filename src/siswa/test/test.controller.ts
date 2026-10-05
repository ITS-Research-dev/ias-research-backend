import { Controller, Post, Body, Req, BadRequestException } from '@nestjs/common';
import { OllamaService } from './ollama.service';
import { AssessCodeDto } from './dto/assess-code.dto';
import { SiswaAuth } from '../../../common/decorators/siswa-auth.decorator';
import { ScoreRepository } from '../../general/score/score.repository';
import { Score } from '../../general/score/entities/score.entity';

@SiswaAuth()
@Controller('siswa/test')
export class SiswaTestController {
    constructor(
        private readonly ollamaService: OllamaService,
        private readonly scoreRepository: ScoreRepository,
    ) { }

    @Post('ai/assess')
    async assessAi(@Body() dto: AssessCodeDto, @Req() req: any) {
        const userId = req.user.userId;
        let isRetrying = false;
        let retryData: Score | null = null;

        if (dto.testId && userId) {
            const isTestUnfinished = await this.ollamaService.isTestUnifinish(dto.testId, userId);
            if (!isTestUnfinished) throw new BadRequestException('Soal ini sudah selesai dikerjakan, mohon hubungi guru untuk mengulang.');
            
            const alreadySubmitted = await this.scoreRepository.alreadyExisted(userId, dto.testId);
            if(alreadySubmitted){
                if (alreadySubmitted?.allowRetry === false) throw new BadRequestException('Soal ini tidak bisa dikerjakan lagi, mohon hubungi guru.');
                if (alreadySubmitted?.retryDeadline && new Date() > alreadySubmitted.retryDeadline) throw new BadRequestException('Soal ini tidak bisa dikerjakan lagi, mohon hubungi guru.');
                isRetrying = true;
                retryData = alreadySubmitted;
            }
        }

        return this.ollamaService.assessCode(
            dto.soal,
            dto.expectedOutput,
            dto.studentCode,
            dto.hintUsage,
            dto.testId,
            userId,
            isRetrying,
            retryData
        );
    }
}