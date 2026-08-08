import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../general/user/user.repository';
import { TopicRepository } from '../../general/topic/topic.repository';
import { ScoreRepository } from '../../general/score/score.repository';

@Injectable()
export class ProfileService {
    constructor(
        private readonly scoreRepository: ScoreRepository
    ) {}

    async getProfile(userId: string) {
        return this.scoreRepository.findProfile(userId)
    }
}