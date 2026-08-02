import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ScoreRepository } from '../../general/score/score.repository';
import { HintRepository } from '../../general/hint/hint.repository';
import { TestRepository } from '../../general/test/test.repository';

@Injectable()
export class StudyCaseService {
  constructor(
    private readonly testRepository: TestRepository,
    // @Inject('RedisService') private readonly redisService: any,
    // @Inject('ChromaService') private readonly chromaService: any,
    // @Inject('AIService') private readonly aiService: any,
    private readonly scoreRepository: ScoreRepository,
    private readonly hintRepository: HintRepository
  ) {}

  async getUserScores(currentUserId: string) {
    return this.scoreRepository.findByUserId(currentUserId);
  }

  async getTestsByTopic(topicId: string) {
    return this.testRepository.findByTopicId(topicId);
  }

  async getHint(testId: string, hintLevel: number) {
    if (hintLevel < 1 || hintLevel > 3) {
      throw new BadRequestException('Hint level tidak valid');
    }

    const hint = await this.hintRepository.findByTestNLevel(testId, hintLevel)
    return { level: hintLevel, content: hint };
  }


  //TODO: CODE INI GAK JALAN HARUS DIBENERIN LAGI, YANG SEKARANG INI SALAH BANGET CARA KERJANYA
//   async submitCode(dto: CreateSubmissionDto, idUser: string) {
//     const test = await this.testRepository.findById(dto.testId);

//     const execResult = await this.compileAndExecute(
//       dto.sourceCode,
//       dto.language,
//     );

//     const cacheKey = `submission:${dto.testId}:${dto.sourceCode}`;
//     const cachedResult = await this.redisService?.get(cacheKey);
//     if (cachedResult) {
//       return JSON.parse(cachedResult);
//     }

//     const relevantContext = await this.chromaService?.similaritySearch(
//       dto.sourceCode,
//     );

//     const aiAssessment = await this.aiService?.generateAssessment({
//       code: dto.sourceCode,
//       execution: execResult,
//       context: relevantContext,
//     });

//     const now = new Date();
//     const result = {
//       level: aiAssessment?.level || 'Intermediate',
//       averageScore: aiAssessment?.score || 95,
//       aiSuggestion:
//         aiAssessment?.suggestion || 'Gunakan variable naming yang lebih baik.',
//       aiScore: String(aiAssessment?.score || 95),
//     };

//     await this.redisService?.set(cacheKey, JSON.stringify(result));

//     const scoreEntity: ScoreEntity = {
//       id: crypto.randomUUID(),
//       idTest: dto.testId,
//       idUser,
//       level: result.level,
//       averageScore: result.averageScore,
//       flagOverride: false,
//       aiScore: result.aiScore,
//       aiSuggestion: result.aiSuggestion,
//       aiFinishTime: now.toISOString(),
//       uCode: dto.sourceCode,
//       createdAt: now,
//     };

//     await this.scoreRepository.saveResult(scoreEntity);

//     return result;
//   }

//   private async compileAndExecute(code: string, lang: string) {
//     return { status: 'SUCCESS', output: 'Hello World' };
//   }
}
