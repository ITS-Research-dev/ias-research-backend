import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../general/user/user.repository';
import { TopicRepository } from '../../general/topic/topic.repository';
import { ScoreRepository } from '../../general/score/score.repository';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ProfileService {
  private readonly CACHE_TTL = 1800; // 30 menit
  private readonly CACHE_PREFIX = 'profile';

  constructor(
    private readonly scoreRepository: ScoreRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get profile dengan caching
   */
  async getProfile(userId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:${userId}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dari database
    const data = await this.scoreRepository.findProfile(userId);

    // Store ke cache
    await this.redisService.set(cacheKey, data, this.CACHE_TTL);

    return data;
  }

  /**
   * Get profile detail dengan caching
   */
  async getProfileDetail(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}:detail:${id}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dari database
    const score = await this.scoreRepository.findDetail(id);
    if (!score) throw new NotFoundException(`Score with id ${id} not found`);

    // Store ke cache
    await this.redisService.set(cacheKey, score, this.CACHE_TTL);

    return score;
  }

  /**
   * Invalidate cache ketika profile diupdate
   */
  async invalidateProfileCache(userId: string, scoreId?: string) {
    const keysToDelete: string[] = [`${this.CACHE_PREFIX}:${userId}`];

    if (scoreId) {
      keysToDelete.push(`${this.CACHE_PREFIX}:detail:${scoreId}`);
    }

    await this.redisService.deleteMany(keysToDelete);
  }
}
