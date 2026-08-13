import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TopicRepository } from '../../general/topic/topic.repository';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class MateriService {
  private readonly CACHE_TTL = 3600; // 1 jam
  private readonly CACHE_PREFIX = 'materi';

  constructor(
    private readonly topicRepository: TopicRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get materi by class ID dengan caching
   */
  async getMateriByClass(userClassId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:class:${userClassId}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dari database
    const data = await this.topicRepository.findByClassId(userClassId);

    // Store ke cache
    await this.redisService.set(cacheKey, data, this.CACHE_TTL);

    return data;
  }

  /**
   * Get materi detail dengan caching
   */
  async getMateriDetail(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}:detail:${id}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dari database
    const topic = await this.topicRepository.findById(id);
    if (!topic) throw new NotFoundException(`Topic with id ${id} not found`);

    const result = {
      title: topic.title,
      description: topic.description,
      subject: topic.subject,
    };

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Invalidate cache ketika ada perubahan materi
   */
  async invalidateMateriCache(classId?: string, topicId?: string) {
    const keysToDelete: string[] = [];

    if (classId) {
      keysToDelete.push(`${this.CACHE_PREFIX}:class:${classId}`);
    }

    if (topicId) {
      keysToDelete.push(`${this.CACHE_PREFIX}:detail:${topicId}`);
    }

    if (keysToDelete.length > 0) {
      await this.redisService.deleteMany(keysToDelete);
    }
  }
}