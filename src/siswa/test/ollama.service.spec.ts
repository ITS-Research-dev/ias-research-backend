import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from './ollama.service';

describe('OllamaService', () => {
  let service: OllamaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultVal: string) => defaultVal),
          },
        },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should limit AI feedback to 100 words when raw response exceeds 100 words', () => {
    const longFeedback = Array.from(
      { length: 150 },
      (_, i) => `kata${i + 1}`,
    ).join(' ');
    const rawResponse = `
fungsionalitas: 90
logika: 85
syntax: 95
code_style: 80
dokumentasi: 70
konsep: 85
overallScore: 84
feedback: ${longFeedback}
    `;

    const parsed = (service as any).parseAssessmentResponse(rawResponse);
    const wordCount = parsed.aiSuggestion.trim().split(/\s+/).length;

    expect(wordCount).toBe(100);
    expect(parsed.aiSuggestion.startsWith('kata1')).toBe(true);
    expect(parsed.aiSuggestion.endsWith('kata100')).toBe(true);
  });

  it('should not truncate AI feedback if it is within 100 words', () => {
    const shortFeedback = 'Kode siswa sudah sangat bagus dan efisien.';
    const rawResponse = `
fungsionalitas: 100
logika: 100
syntax: 100
code_style: 100
dokumentasi: 100
konsep: 100
overallScore: 100
feedback: ${shortFeedback}
    `;

    const parsed = (service as any).parseAssessmentResponse(rawResponse);
    expect(parsed.aiSuggestion).toBe(shortFeedback);
  });
});
