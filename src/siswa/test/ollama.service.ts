import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaGenerateRequest {
    model: string;
    prompt: string;
    stream: false;
    system?: string;
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
    penilaian: OllamaAssessmentScores;
    rataRata: number;
    feedback: string;
    raw: string;
}

@Injectable()
export class OllamaService {
    private readonly logger = new Logger(OllamaService.name);
    private readonly ollamaUrl: string;
    private readonly ollamaModel: string;

    constructor(private readonly configService: ConfigService) {
        this.ollamaUrl = this.configService.get<string>('OLLAMA_URL', 'http://localhost:11434');
        this.ollamaModel = this.configService.get<string>('OLLAMA_MODEL', 'codellama');
    }

    async generate(prompt: string, systemContext?: string): Promise<string> {
        return this.callOllama(prompt, systemContext);
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

        const raw = await this.callOllama(prompt);

        return {
            ...this.parseAssessmentResponse(raw),
            raw,
        };
    }

    private parseAssessmentResponse(
        raw: string,
    ): Omit<OllamaAssessmentResult, 'raw'> {
        const scoreKeys: (keyof OllamaAssessmentScores)[] = [
            'fungsionalitas',
            'logika',
            'syntax',
            'code_style',
            'dokumentasi',
            'konsep',
        ];

        const penilaian = {} as OllamaAssessmentScores;

        for (const key of scoreKeys) {
            const match = raw.match(new RegExp(`${key}\\s*:\\s*(\\d+(?:\\.\\d+)?)`, 'i'));
            penilaian[key] = match ? parseFloat(match[1]) : 0;
        }

        const rataRataMatch = raw.match(/rata-rata\s*:\s*(\d+(?:\.\d+)?)/i);
        const rataRata = rataRataMatch ? parseFloat(rataRataMatch[1]) : 0;

        const feedbackMatch = raw.match(/feedback\s*:\s*([\s\S]+)/i);
        const feedback = feedbackMatch
            ? feedbackMatch[1].replace(/<\/s>/g, '').trim()
            : raw.trim();

        return { penilaian, rataRata, feedback };
    }

    private async callOllama(prompt: string, systemContext?: string): Promise<string> {
        const url = `${this.ollamaUrl}/api/generate`;

        const body: OllamaGenerateRequest = {
            model: this.ollamaModel,
            prompt,
            stream: false,
            ...(systemContext ? { system: systemContext } : {}),
        };

        this.logger.log(`Calling Ollama [${this.ollamaModel}] at ${url}`);

        let response: Response;
        try {
            response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
        } catch (err) {
            this.logger.error('Failed to connect to Ollama', err);
            throw new InternalServerErrorException(
                `Unable to reach Ollama at ${this.ollamaUrl}. Make sure Ollama is running.`,
            );
        }

        if (!response.ok) {
            const text = await response.text();
            this.logger.error(`Ollama returned ${response.status}: ${text}`);
            throw new InternalServerErrorException(
                `Ollama error (${response.status}): ${text}`,
            );
        }

        const data = (await response.json()) as OllamaGenerateResponse;
        return data.response;
    }
}
