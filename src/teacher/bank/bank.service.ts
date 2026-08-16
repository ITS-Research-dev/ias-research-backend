import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Topic } from '../../general/topic/entities/topic.entity';
import { Test } from '../../general/test/entities/test.entity';
import { Hint } from '../../general/hint/entities/hint.entity';
import { RedisService } from '../../redis/redis.service';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { randomUUID } from 'crypto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryMaterialDto } from './dto/api-bank.dto';

@Injectable()
export class BankService {
  private readonly CACHE_TTL = 1800; // 30 menit
  private readonly CACHE_PREFIX = 'bank';

  constructor(
    @InjectRepository(Topic) private topicRepo: Repository<Topic>,
    @InjectRepository(Test) private testRepo: Repository<Test>,
    @InjectRepository(Hint) private hintRepo: Repository<Hint>,
    private readonly redisService: RedisService,
  ) {}

  async listMaterials(q: QueryMaterialDto) {
    const { idClass } = q;
    const cacheKey = `${this.CACHE_PREFIX}:materials:${idClass || 'all'}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) return cachedData;

    const where: any = {};
    if (idClass) where.idClass = idClass;

    const topics = await this.topicRepo.find({
      where,
      order: { startDate: 'DESC' },
    });

    const result = topics.map((t) => ({
      id: t.id,
      title: t.title,
      content: t.subject,
      description: t.description,
      startDate: t.startDate,
      status: t.isActive ? 'active' : 'inactive ',
    }));

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async listTopics(q: QueryMaterialDto) {
    const { idClass } = q;
    const cacheKey = `${this.CACHE_PREFIX}:topics:${idClass || 'all'}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) return cachedData;

    const where: any = {};
    if (idClass) where.idClass = idClass;

    const topics = await this.topicRepo.find({
      where,
      order: { startDate: 'DESC' },
    });

    const result = topics.map((t) => ({
      id: t.id,
      title: t.title,
    }));

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async createMaterial(dto: CreateMaterialDto) {
    const topic = this.topicRepo.create({
      id: randomUUID(),
      idClass: dto.idClass,
      title: dto.title,
      subject: dto.content,
      description: dto.description,
      startDate: dto.startDate,
      isActive: dto.status === 'active',
    });
    const saved = await this.topicRepo.save(topic);
    await this.invalidateMaterialsCache();

    return {
      id: saved.id,
      idClass: saved.idClass,
      judul: saved.title,
      subject: saved.subject,
      deskripsi: saved.description,
      status: saved.isActive ? 'active' : 'inactive',
      message: 'Materi berhasil dibuat.',
    };
  }

  async listQuestions(q: QueryMaterialDto) {
    const { idClass } = q;
    const cacheKey = `${this.CACHE_PREFIX}:questions:${idClass || 'all'}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const where: any = {};
    if (idClass) where.topic = { idClass };

    const tests = await this.testRepo.find({
      where,
      relations: { topic: true, hints: true },
      order: { title: "asc" },
    });

    const result = tests.map((t) => ({
      id: t.id,
      title: t.title,
      materialId: t.idTopic,
      topic: { id: t.topic.id, title: t.topic.title },
      description: t.question,
      expectedOutput: t.expOutput,
      status: t.isActive ? 'active' : 'inactive',
      hint1: t.hints?.[0]?.hint1 ?? '',
      hint2: t.hints?.[0]?.hint2 ?? '',
      hint3: t.hints?.[0]?.hint3 ?? '',
    }));

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Create question dan invalidate cache
   */
  async createQuestion(dto: CreateQuestionDto) {
    const topic = await this.topicRepo.findOne({ where: { id: dto.materialId } });
    if (!topic) {
      throw new NotFoundException(
        `Topik dengan id '${dto.materialId}' tidak ditemukan.`,
      );
    }

    const test = this.testRepo.create({
      id: randomUUID(),
      idTopic: dto.materialId,
      title: dto.title,
      question: dto.description,
      expOutput: dto.expectedOutput ?? '',
      maxTries: dto.maxTries ?? 3,
      isActive: dto.status == "active"
    });
    const saved = await this.testRepo.save(test);

    const hint = this.hintRepo.create({
      id: randomUUID(),
      idTest: saved.id,
      hint1: dto.hint1 ?? '',
      hint2: dto.hint2 ?? '',
      hint3: dto.hint3 ?? '',
    });
    await this.hintRepo.save(hint);

    // Invalidate cache
    await this.invalidateQuestionsCache();

    return {
      id: saved.id,
      idTopic: saved.idTopic,
      judul: saved.title,
      soal: saved.question,
      expectedOutput: saved.expOutput,
      maxTries: saved.maxTries,
      status: dto.status,
      message: 'Soal berhasil dibuat.',
    };
  }

  async updateMaterial(id: string, dto: UpdateMaterialDto) {
    const topic = await this.topicRepo.findOne({ where: { id } });
    if (!topic) {
      throw new NotFoundException(`Materi dengan id '${id}' tidak ditemukan.`);
    }

    if (dto.title !== undefined) topic.title = dto.title;
    if (dto.content !== undefined) topic.subject = dto.content;
    if (dto.description !== undefined) topic.description = dto.description;
    if (dto.startDate !== undefined) topic.startDate = dto.startDate;
    if (dto.status !== undefined) topic.isActive = dto.status === 'active';

    const saved = await this.topicRepo.save(topic);

    await this.invalidateMaterialsCache();
    await this.invalidateQuestionsCache();

    return {
      id: saved.id,
      title: saved.title,
      description: saved.description,
      content: saved.subject,
      startDate: saved.startDate,
      status: saved.isActive ? 'active' : 'inactive',
      message: 'Materi berhasil diperbarui.',
    };
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    const test = await this.testRepo.findOne({
      where: { id },
      relations: { topic: true, hints: true },
    });
    if (!test) {
      throw new NotFoundException(`Soal dengan id '${id}' tidak ditemukan.`);
    }

    if (dto.title !== undefined) test.title = dto.title;
    if (dto.description !== undefined) test.question = dto.description;
    if (dto.expectedOutput !== undefined) test.expOutput = dto.expectedOutput;
    if (dto.maxTries !== undefined) test.maxTries = dto.maxTries;
    if (dto.materialId !== undefined) test.idTopic = dto.materialId;
    if (dto.status !== undefined) test.isActive = dto.status === 'active';

    const saved = await this.testRepo.save(test);

    const hasHintChange =
      dto.hint1 !== undefined ||
      dto.hint2 !== undefined ||
      dto.hint3 !== undefined;

    let hint = test.hints?.[0];
    if (hasHintChange) {
      if (dto.hint1 !== undefined) hint.hint1 = dto.hint1;
      if (dto.hint2 !== undefined) hint.hint2 = dto.hint2;
      if (dto.hint3 !== undefined) hint.hint3 = dto.hint3;
      hint = await this.hintRepo.save(hint);
    }

    await this.invalidateQuestionsCache();

    return {
      id: saved.id,
      title: saved.title,
      description: saved.question,
      expectedOutput: saved.expOutput,
      maxTries: saved.maxTries,
      hint1: hint?.hint1 ?? '',
      hint2: hint?.hint2 ?? '',
      hint3: hint?.hint3 ?? '',
      materialId: saved.idTopic,
      topic: test.topic ? { id: test.topic.id, title: test.topic.title } : null,
      status: saved.isActive ? 'active' : 'inactive',
      message: 'Soal berhasil diperbarui.',
    };
  }

  async uploadDocument(file: Express.Multer.File) {
    const jobId = randomUUID();
    return { jobId, filename: file?.originalname || null, status: 'queued' };
  }

  async triggerGenerate(body: {
    jobId?: string;
    kind: 'materi' | 'soal';
    topic: string;
  }) {
    const jobId = randomUUID();
    return { jobId, kind: body.kind, topic: body.topic, status: 'queued' };
  }

  private async invalidateMaterialsCache() {
    const keys = await this.redisService.getKeysByPattern(
      `${this.CACHE_PREFIX}:materials:*`,
    );
    if (keys.length > 0) {
      await this.redisService.deleteMany(keys);
    }
  }

  private async invalidateQuestionsCache() {
    const keys = await this.redisService.getKeysByPattern(
      `${this.CACHE_PREFIX}:questions:*`,
    );
    if (keys.length > 0) {
      await this.redisService.deleteMany(keys);
    }
  }
}
