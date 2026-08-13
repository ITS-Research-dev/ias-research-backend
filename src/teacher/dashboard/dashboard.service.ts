import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassRepository } from '../../general/class/class.repository';
import { ScoreRepository } from '../../general/score/score.repository';
import { RedisService } from '../../redis/redis.service';
import { formatIntoProfileSummary } from '../../../common/utils/mapper';

@Injectable()
export class DashboardService {
  private readonly CACHE_TTL = 900; // 15 menit (dashboard sering berubah)
  private readonly CACHE_PREFIX = 'dashboard';

  constructor(
    private readonly classRepository: ClassRepository,
    private readonly scoreRepository: ScoreRepository,
    private readonly redisService: RedisService,
  ) {}

  async getData(classId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:data:${classId}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const exist = await this.classRepository.findById(classId);
    if (!exist) throw new NotFoundException(`Kelas ${classId} tidak ditemukan`);
    
    const data = await this.classRepository.dashboardData(classId);

    // Store ke cache
    await this.redisService.set(cacheKey, data, this.CACHE_TTL);

    return data;
  }

  async getTrend(classId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:trend:${classId}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const exist = await this.classRepository.findById(classId);
    if (!exist) throw new NotFoundException(`Trend kosong karena tidak ada data`);
    
    const data = await this.scoreRepository.findDashboard(classId);
    const result = formatIntoProfileSummary(data);

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async invalidateDashboardCache(classId: string) {
    const keysToDelete: string[] = [
      `${this.CACHE_PREFIX}:data:${classId}`,
      `${this.CACHE_PREFIX}:trend:${classId}`,
    ];
    await this.redisService.deleteMany(keysToDelete);
  }
}