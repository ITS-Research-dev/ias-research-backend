import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaGenerateRequest {
  model: string;
  prompt: string;
  stream: false;
  system?: string;
  options?: {
    num_predict?: number;
    temperature?: number;
  };
}

interface OllamaGenerateResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
  done_reason?: string;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
  eval_duration?: number;
}

export interface OllamaAssessmentScores {
  fungsionalitas: number;
  logika: number;
  syntax: number;
  code_style: number;
  dokumentasi: number;
  konsep: number;
}

export interface OllamaAssessmentResult {
  aiScore: OllamaAssessmentScores;
  overallScore: number;
  flagOverride: boolean;
  aiSuggestion: string;
  aiFinishTime: string;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollamaUrl: string;
  private readonly ollamaModel: string;

  constructor(private readonly configService: ConfigService) {
    this.ollamaUrl = this.configService.get<string>(
      'OLLAMA_URL',
      'http://localhost:11434',
    );
    this.ollamaModel = this.configService.get<string>(
      'OLLAMA_MODEL',
      'codellama',
    );
  }

  async generate(prompt: string, systemContext?: string): Promise<string> {
    const { response } = await this.callOllama(prompt, systemContext);
    return response;
  }

  async assessCode(
    soal: string,
    expectedOutput: string,
    studentCode: string,
  ): Promise<OllamaAssessmentResult> {
    const prompt =
      `<s>[INST] Soal: ${soal}\n` +
      `Output yang diharapkan: ${expectedOutput}\n\n` +
      `Kode siswa:\n\`\`\`python\n${studentCode}\n\`\`\`\n\n` +
      `Nilai kode siswa ini dan berikan feedback. [/INST]`;

    const { response: raw, duration } = await this.callOllama(prompt);
    const parsed = this.parseAssessmentResponse(raw);

    return {
      aiScore: parsed.aiScore,
      overallScore: parsed.overallScore,
      flagOverride: false,
      aiSuggestion: parsed.aiSuggestion,
      aiFinishTime: duration,
    };
  }

  private parseAssessmentResponse(raw: string): {
    aiScore: OllamaAssessmentScores;
    overallScore: number;
    aiSuggestion: string;
  } {
    const scoreKeys: (keyof OllamaAssessmentScores)[] = [
      'fungsionalitas',
      'logika',
      'syntax',
      'code_style',
      'dokumentasi',
      'konsep',
    ];

    const aiScore = {} as OllamaAssessmentScores;

    for (const key of scoreKeys) {
      const match = raw.match(
        new RegExp(`${key}\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i'),
      );
      aiScore[key] = match ? parseFloat(match[1]) : 0;
    }

    const overallMatch = raw.match(
      /(?:rata-rata|overallScore|overall\s*score)\s*:\s*(\d+(?:\.\d+)?)/i,
    );
    let overallScore = overallMatch ? parseFloat(overallMatch[1]) : 0;

    if (!overallScore) {
      const scores = Object.values(aiScore);
      const sum = scores.reduce((acc, val) => acc + val, 0);
      overallScore =
        scores.length > 0 ? Math.round((sum / scores.length) * 100) / 100 : 0;
    }

    const feedbackMatch = raw.match(
      /(?:feedback|aiSuggestion|suggestion)\s*:\s*([\s\S]+)/i,
    );
    const aiSuggestion = feedbackMatch
      ? feedbackMatch[1].replace(/<\/s>/g, '').trim()
      : raw.trim();

    return { aiScore, overallScore, aiSuggestion };
  }

  private async callOllama(
    prompt: string,
    systemContext?: string,
  ): Promise<{ response: string; duration: string }> {
    const startTime = Date.now();
    const url = `${this.ollamaUrl}/api/generate`;
    const body: OllamaGenerateRequest = {
      model: this.ollamaModel,
      prompt,
      stream: false,
      ...(systemContext ? { system: systemContext } : {}),
      options: {
        num_predict: 512, // Limit response token count to speed up response time
        temperature: 0.2, // Lower temperature for structured & predictable outputs
      },
    };
    this.logger.log(`Calling Ollama [${this.ollamaModel}] at ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 300 second timeout
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') {
        this.logger.error('Ollama request timed out after 120s');
        throw new InternalServerErrorException(
          'Ollama response timed out. The model is taking too long to generate.',
        );
      }
      this.logger.error('Failed to connect to Ollama', err);
      throw new InternalServerErrorException(
        `Unable to reach Ollama at ${this.ollamaUrl}. Make sure Ollama is running.`,
      );
    } finally {
      clearTimeout(timeoutId);
    }
    if (!response.ok) {
      const text = await response.text();
      this.logger.error(`Ollama returned ${response.status}: ${text}`);
      throw new InternalServerErrorException(
        `Ollama error (${response.status}): ${text}`,
      );
    }
    const data = (await response.json()) as OllamaGenerateResponse;
    const durationSec = data.total_duration
      ? (data.total_duration / 1e9).toFixed(2)
      : ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      response: data.response,
      duration: `${durationSec}s`,
    };
  }
}
