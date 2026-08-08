import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../general/user/user.repository';
import { TopicRepository } from '../../general/topic/topic.repository';
import { ScoreRepository } from '../../general/score/score.repository';

@Injectable()
export class ProfileService {
  constructor(private readonly scoreRepository: ScoreRepository) {}

  async getProfile(userId: string) {
    return this.scoreRepository.findProfile(userId);
  }

  async getProfileDetail(id: string) {
    const score = await this.scoreRepository.findDetail(id);
    if (!score) throw new NotFoundException(`Score with id ${id} not found`);
    return score
  }
}
