import { Controller, Get, Query, Req } from '@nestjs/common';
import { ScoreService } from './score.service';
import { QueryScoreDto } from './dto/query-score.dto';

@Controller('siswa/score')
export class ScoreController {
    constructor(private readonly scoreService: ScoreService) {}

    @Get()
    async getScore(@Query() query: QueryScoreDto, @Req() req: any) {
        const currentUserId = req.user?.id;
        return this.scoreService.getUserScores(query, currentUserId);
    }
}