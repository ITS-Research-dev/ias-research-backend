import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ScoreRepository } from '../../general/score/score.repository';
import { HintRepository } from '../../general/hint/hint.repository';
import { TestRepository } from '../../general/test/test.repository';
import { TopicRepository } from '../../general/topic/topic.repository';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class StudyCaseService {
  constructor(
    private readonly testRepository: TestRepository,
    private readonly topicRepository: TopicRepository,
    private readonly scoreRepository: ScoreRepository,
    private readonly hintRepository: HintRepository
  ) { }

  async getUserScores(currentUserId: string) {
    return this.scoreRepository.findByUserId(currentUserId);
  }

  async getTestsByTopic(topicId: string) {
    return this.testRepository.findByTopicId(topicId);
  }

  async getCaseDetail(topicId: string) {
    const topic = await this.topicRepository.findById(topicId);
    if (!topic) {
      throw new NotFoundException(`Studi kasus dengan id ${topicId} tidak ditemukan`);
    }

    const tests = await this.testRepository.findByTopicId(topicId);

    const questions = tests.map((test, index) => ({
      id: test.id,
      order: index + 1,
      title: test.title,
      description: test.question,
      expectedOutput: test.expOutput,
      starterCode: '# Tulis kode kamu di sini\n',
      hints: [],
    }));

    return {
      id: topic.id,
      title: topic.title,
      topic: topic.subject,
      description: topic.description,
      status: 'learning',
      questions,
    };
  }

  async getHint(testId: string, hintLevel: number) {
    if (hintLevel < 1 || hintLevel > 3) {
      throw new BadRequestException('Hint level tidak valid');
    }

    const hint = await this.hintRepository.findByTestNLevel(testId, hintLevel)
    return { level: hintLevel, content: hint };
  }

  async runCode(code: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
    const tmpDir = os.tmpdir();
    const fileName = `its_sandbox_${Date.now()}_${Math.random().toString(36).slice(2)}.py`;
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

        proc.stdout.on('data', (chunk: Buffer) => { stdout += chunk.toString(); });
        proc.stderr.on('data', (chunk: Buffer) => { stderr += chunk.toString(); });

        proc.on('close', (code, signal) => {
          const exitCode = signal ? 1 : (code ?? 1);
          if (signal === 'SIGTERM') {
            stderr = 'TimeoutError: Execution exceeded 10 seconds and was terminated.';
          }
          resolve({ stdout: stdout.trim(), stderr: stderr.trim(), exitCode });
        });

        proc.on('error', (err) => {
          resolve({ stdout: '', stderr: err.message, exitCode: 1 });
        });
      });
    } finally {
      // Always clean up the temp file
      try { fs.unlinkSync(filePath); } catch (_) { }
    }
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
