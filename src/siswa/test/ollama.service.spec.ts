import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OllamaService } from './ollama.service';

import { ScoreRepository } from '../../general/score/score.repository';
import { RedisService } from '../../redis/redis.service';

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
        {
          provide: ScoreRepository,
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            getKeysByPattern: jest.fn().mockResolvedValue([]),
            deleteMany: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should correctly calculate levels with highest level at bottom (ascending)', () => {
    expect(service.checkLevel(95, 0)).toBe('Expert');
    expect(service.checkLevel(90, 0)).toBe('Expert');
    expect(service.checkLevel(85, 0)).toBe('Competent');
    expect(service.checkLevel(75, 0)).toBe('Advance');
    expect(service.checkLevel(65, 0)).toBe('Advance/Beginner');
    expect(service.checkLevel(55, 0)).toBe('Beginner');
    expect(service.checkLevel(40, 0)).toBe('Novice');
    // Hint usage overrides
    expect(service.checkLevel(95, 1)).toBe('Advance/Beginner');
    expect(service.checkLevel(95, 2)).toBe('Beginner');
    expect(service.checkLevel(95, 3)).toBe('Novice');
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
