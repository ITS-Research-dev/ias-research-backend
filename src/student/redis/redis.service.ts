import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);
  private readonly ttl = 3600; // Default TTL 1 jam

  constructor(private configService: ConfigService) {
    this.initializeRedis();
  }

  private initializeRedis() {
    try {
      const host = this.configService.get<string>('REDIS_HOST', 'localhost');
      const port = this.configService.get<number>('REDIS_PORT', 6379);
      const password = this.configService.get<string>('REDIS_PASSWORD', undefined);
      const db = this.configService.get<number>('REDIS_DB', 0);

      this.client = new Redis({
        host,
        port,
        password,
        db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        },
      });

      this.client.on('connect', () => {
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });
    } catch (error) {
      this.logger.error('Failed to initialize Redis:', error);
    }
  }

  /**
   * Set data ke Redis
   * @param key - Kunci Redis
   * @param value - Nilai (akan di-stringify jika object)
   * @param ttl - Time to live dalam detik (opsional)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);
      const expiryTime = ttl || this.ttl;
      
      await this.client.setex(key, expiryTime, serializedValue);
      this.logger.debug(`Redis SET: ${key} (TTL: ${expiryTime}s)`);
    } catch (error) {
      this.logger.error(`Failed to set Redis key ${key}:`, error);
    }
  }

  /**
   * Get data dari Redis
   * @param key - Kunci Redis
   * @returns Data dari Redis atau null
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (!value) return null;

      try {
        this.logger.debug(`Redis GET: ${key}`);
        return JSON.parse(value) as T;
      } catch {
        // Jika parsing gagal, return string value
        return value as T;
      }
    } catch (error) {
      this.logger.error(`Failed to get Redis key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete data dari Redis
   * @param key - Kunci Redis
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
      this.logger.debug(`Redis DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete Redis key ${key}:`, error);
    }
  }

  /**
   * Delete multiple keys dari Redis
   * @param keys - Array kunci Redis
   */
  async deleteMany(keys: string[]): Promise<void> {
    try {
      if (keys.length > 0) {
        await this.client.del(...keys);
        this.logger.debug(`Redis DELETE MANY: ${keys.join(', ')}`);
      }
    } catch (error) {
      this.logger.error(`Failed to delete multiple Redis keys:`, error);
    }
  }

  /**
   * Check jika key ada di Redis
   * @param key - Kunci Redis
   */
  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.client.exists(key);
      return exists === 1;
    } catch (error) {
      this.logger.error(`Failed to check Redis key existence ${key}:`, error);
      return false;
    }
  }

  /**
   * Increment nilai (untuk counter)
   * @param key - Kunci Redis
   * @param increment - Jumlah increment (default 1)
   */
  async increment(key: string, increment: number = 1): Promise<number> {
    try {
      const result = await this.client.incrby(key, increment);
      this.logger.debug(`Redis INCRBY: ${key} += ${increment}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to increment Redis key ${key}:`, error);
      return 0;
    }
  }

  /**
   * Set expiration untuk key yang sudah ada
   * @param key - Kunci Redis
   * @param ttl - Time to live dalam detik
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.client.expire(key, ttl);
      this.logger.debug(`Redis EXPIRE: ${key} (TTL: ${ttl}s)`);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to expire Redis key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get semua keys yang match pattern
   * @param pattern - Pattern untuk pencarian (contoh: "materi:*")
   */
  async getKeysByPattern(pattern: string): Promise<string[]> {
    try {
      const keys = await this.client.keys(pattern);
      this.logger.debug(`Redis KEYS: ${pattern} (found: ${keys.length})`);
      return keys;
    } catch (error) {
      this.logger.error(`Failed to get Redis keys by pattern ${pattern}:`, error);
      return [];
    }
  }

  /**
   * Flush database (gunakan dengan hati-hati!)
   */
  async flushDb(): Promise<void> {
    try {
      await this.client.flushdb();
      this.logger.warn('Redis database flushed!');
    } catch (error) {
      this.logger.error('Failed to flush Redis database:', error);
    }
  }

  /**
   * Get Redis client
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    try {
      await this.client.quit();
      this.logger.log('Redis connection closed');
    } catch (error) {
      this.logger.error('Failed to close Redis connection:', error);
    }
  }
}
