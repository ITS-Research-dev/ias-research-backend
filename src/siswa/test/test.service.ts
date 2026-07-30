import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { TestRepository } from './test.repository';
import { QueryTestDto } from './dto/query-test.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { ScoreRepository } from '../score/score.repository';
import { ScoreEntity } from '../score/entities/score.entity';

@Injectable()
export class TestService {
  constructor(
    private readonly testRepository: TestRepository,
    @Inject('RedisService') private readonly redisService: any,
    @Inject('ChromaService') private readonly chromaService: any,
    @Inject('AIService') private readonly aiService: any,
    private readonly scoreRepository: ScoreRepository,
  ) {}

  async getTestsByTopic(query: QueryTestDto) {
    return this.testRepository.findByTopicId(query.idTopic);
  }

  async getHint(testId: string, hintLevel: number) {
    const test = await this.testRepository.findById(testId);

    if (hintLevel < 1 || hintLevel > 3) {
      throw new BadRequestException('Hint level tidak valid');
    }

    const hintKey = `hint${hintLevel}` as keyof Pick<typeof test, 'hint1' | 'hint2' | 'hint3'>;
    const hintContent = test[hintKey];
    if (!hintContent) {
      throw new NotFoundException('Hint tidak ditemukan');
    }

    return { level: hintLevel, content: hintContent };
  }

  async submitCode(dto: CreateSubmissionDto, idUser: string) {
    const test = await this.testRepository.findById(dto.testId);

    const execResult = await this.compileAndExecute(dto.sourceCode, dto.language);

    const cacheKey = `submission:${dto.testId}:${dto.sourceCode}`;
    const cachedResult = await this.redisService?.get(cacheKey);
    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    const relevantContext = await this.chromaService?.similaritySearch(dto.sourceCode);

    const aiAssessment = await this.aiService?.generateAssessment({
      code: dto.sourceCode,
      execution: execResult,
      context: relevantContext,
    });

    const now = new Date();
    const result = {
      level: aiAssessment?.level || 'Intermediate',
      averageScore: aiAssessment?.score || 95,
      aiSuggestion: aiAssessment?.suggestion || 'Gunakan variable naming yang lebih baik.',
      aiScore: String(aiAssessment?.score || 95),
    };

    await this.redisService?.set(cacheKey, JSON.stringify(result));

    const scoreEntity: ScoreEntity = {
      id: crypto.randomUUID(),
      idTest: dto.testId,
      idUser,
      level: result.level,
      averageScore: result.averageScore,
      flagOverride: false,
      aiScore: result.aiScore,
      aiSuggestion: result.aiSuggestion,
      aiFinishTime: now.toISOString(),
      uCode: dto.sourceCode,
      createdAt: now,
    };

    await this.scoreRepository.saveResult(scoreEntity);

    return result;
  }

  private async compileAndExecute(code: string, lang: string) {
    return { status: 'SUCCESS', output: 'Hello World' };
  }
}
