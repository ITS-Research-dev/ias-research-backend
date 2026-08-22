import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ScoreRepository } from '../../general/score/score.repository';
import { HintRepository } from '../../general/hint/hint.repository';
import { TestRepository } from '../../general/test/test.repository';
import { TopicRepository } from '../../general/topic/topic.repository';
import { RedisService } from '../../redis/redis.service';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class StudyCaseService {
  private readonly CACHE_TTL = 3600; // 1 jam
  private readonly CACHE_PREFIX = 'studycase';
  private readonly HINT_CACHE_TTL = 7200; // 2 jam

  constructor(
    private readonly testRepository: TestRepository,
    private readonly topicRepository: TopicRepository,
    private readonly scoreRepository: ScoreRepository,
    private readonly hintRepository: HintRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Get user scores dengan caching
   */
  async getUserScores(currentUserId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:scores:${currentUserId}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dari database
    const data = await this.scoreRepository.findByUserId(currentUserId);

    // Store ke cache
    await this.redisService.set(cacheKey, data, this.CACHE_TTL);

    return data;
  }

  /**
   * Get tests by topic dengan caching
   */
  async getTestsByTopic(topicId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:tests:${topicId}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dari database
    const data = await this.testRepository.findByTopicId(topicId);

    // Store ke cache
    await this.redisService.set(cacheKey, data, this.CACHE_TTL);

    return data;
  }

  /**
   * Get case detail dengan caching
   */
  async getCaseDetail(topicId: string) {
    const cacheKey = `${this.CACHE_PREFIX}:case:${topicId}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch dari database
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new NotFoundException(
        `Studi kasus dengan id ${topicId} tidak ditemukan`,
      );
    }

    const tests = await this.testRepository.findByTopicId(topicId);

    const questions = tests.map((test, index) => {
      const hintRecord = test.hints?.[0];
      const hints = [
        hintRecord?.hint1,
        hintRecord?.hint2,
        hintRecord?.hint3,
      ].filter((h): h is string => Boolean(h && h.trim()));

      return {
        id: test.id,
        order: index + 1,
        title: test.title,
        description: test.question,
        expectedOutput: test.expOutput,
        starterCode: '# Tulis kode kamu di sini\n',
        hints,
      };
    });

    const result = {
      id: topic.id,
      title: topic.title,
      topic: topic.subject,
      description: topic.description,
      status: 'learning',
      questions,
    };

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get hint dengan caching
   */
  async getHint(testId: string, hintLevel: number) {
    if (hintLevel < 1 || hintLevel > 3) {
      throw new BadRequestException('Hint level tidak valid');
    }

    const cacheKey = `${this.CACHE_PREFIX}:hint:${testId}:${hintLevel}`;

    // Check cache
    const cachedHint = await this.redisService.get(cacheKey);
    if (cachedHint) {
      return cachedHint;
    }

    // Fetch dari database
    const hint = await this.hintRepository.findByTestNLevel(testId, hintLevel);
    const result = { level: hintLevel, content: hint };

    // Store ke cache dengan TTL lebih panjang karena hint jarang berubah
    await this.redisService.set(cacheKey, result, this.HINT_CACHE_TTL);

    return result;
  }

  /**
   * Run code dengan caching submission result
   */
  async runCode(
    code: string,
  ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    // Generate cache key dari code hash
    const codeHash = this.hashCode(code);
    const cacheKey = `${this.CACHE_PREFIX}:run:${codeHash}`;

    // Check cache
    const cachedResult = await this.redisService.get<{
      stdout: string;
      stderr: string;
      exitCode: number;
    }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // Execute code
    const result = await this.executeCode(code);

    // Store ke cache (hanya store successful execution)
    if (result.exitCode === 0) {
      await this.redisService.set(cacheKey, result, 1800); // 30 menit untuk result yang success
    }

    return result;
  }

  /**
   * Execute code sandbox
   */
  private async executeCode(code: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> {
    const tmpDir = os.tmpdir();
    const fileName = `its_sandbox_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}.py`;
    const filePath = path.join(tmpDir, fileName);

    try {
      fs.writeFileSync(filePath, code, 'utf8');

      return await new Promise((resolve) => {
        let stdout = '';
        let stderr = '';

        // windows use python, linux/mac/others use python3
        const cmd = process.platform === 'win32' ? 'python' : 'python3';
        const proc = spawn(cmd, [filePath], {
          timeout: 10000, // sandbox timeout to 10 sec
          env: {
            PATH: process.env.PATH,
            PYTHONDONTWRITEBYTECODE: '1',
            PYTHONIOENCODING: 'utf-8',
          },
        });

        proc.stdout.on('data', (chunk: Buffer) => {
          stdout += chunk.toString();
        });
        proc.stderr.on('data', (chunk: Buffer) => {
          stderr += chunk.toString();
        });

        proc.on('close', (code, signal) => {
          const exitCode = signal ? 1 : code ?? 1;
          if (signal === 'SIGTERM') {
            stderr =
              'TimeoutError: Execution exceeded 10 seconds and was terminated.';
          }
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode });
        });

        proc.on('error', (err) => {
          resolve({ stdout: '', stderr: err.message, exitCode: 1 });
        });
      });
    } finally {
      // Always clean up the temp file
      try {
        fs.unlinkSync(filePath);
      } catch (_) {}
    }
  }

  /**
   * Generate simple hash dari code
   */
  private hashCode(code: string): string {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Invalidate cache untuk study case
   */
  async invalidateStudyCaseCache(topicId?: string, testId?: string) {
    const keysToDelete: string[] = [];

    if (topicId) {
      keysToDelete.push(`${this.CACHE_PREFIX}:case:${topicId}`);
      keysToDelete.push(`${this.CACHE_PREFIX}:tests:${topicId}`);
    }

    if (testId) {
      // Delete all hint levels for this test
      for (let level = 1; level <= 3; level++) {
        keysToDelete.push(`${this.CACHE_PREFIX}:hint:${testId}:${level}`);
      }
    }

    if (keysToDelete.length > 0) {
      await this.redisService.deleteMany(keysToDelete);
    }
  }
}
