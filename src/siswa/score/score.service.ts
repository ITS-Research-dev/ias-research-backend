import { Injectable, ForbiddenException } from '@nestjs/common';
import { ScoreRepository } from './score.repository';
import { QueryScoreDto } from './dto/query-score.dto';

@Injectable()
export class ScoreService {
    constructor(private readonly scoreRepository: ScoreRepository) {}

    async getUserScores(query: QueryScoreDto, currentUserId: string) {
        // Validasi kepemilikan userId
        if (query.userId !== currentUserId) {
        throw new ForbiddenException('Akses riwayat nilai dilarang');
        }
        return this.scoreRepository.findByUserId(query.userId);
    }
}