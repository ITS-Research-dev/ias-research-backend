import { Injectable } from '@nestjs/common';
import { ScoreEntity } from './entities/score.entity';

@Injectable()
export class ScoreRepository {
    private scores: ScoreEntity[] = [];

    async findByUserId(idUser: string): Promise<ScoreEntity[]> {
        return this.scores.filter((s) => s.idUser === idUser);
    }

    async saveResult(data: ScoreEntity): Promise<void> {
        this.scores.push(data);
    }
}