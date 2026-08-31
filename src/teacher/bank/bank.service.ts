import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Topic } from '../../general/topic/entities/topic.entity';
import { Test } from '../../general/test/entities/test.entity';
import { Hint } from '../../general/hint/entities/hint.entity';
import { Class } from '../../general/class/entities/class.entity';
import { ClassAssign } from '../../general/class-assign/entities/class-assign.entity';
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
    @InjectRepository(Class) private classRepo: Repository<Class>,
    @InjectRepository(ClassAssign) private classAssignRepo: Repository<ClassAssign>,
    private readonly redisService: RedisService,
  ) { }

  private async resolveClassId(idClass?: string): Promise<string> {
    if (!idClass || typeof idClass !== 'string' || idClass.trim() === '') {
      const fallback = await this.classRepo.findOne({ where: {} });
      if (!fallback) throw new BadRequestException('Tidak ada data kelas terdaftar di sistem.');
      return fallback.id;
    }

    const trimmed = idClass.trim();

    // 1. Direct check in TABLE_CLASS by ID
    const directClass = await this.classRepo.findOne({ where: { id: trimmed } });
    if (directClass) return directClass.id;

    // 2. Check in TABLE_CLASS_ASSIGN by ID (in case assignment ID was passed)
    const assign = await this.classAssignRepo.findOne({ where: { id: trimmed } });
    if (assign && assign.idClass) return assign.idClass;

    // 3. Check in TABLE_CLASS by Title (in case class title was passed)
    const classByTitle = await this.classRepo.findOne({ where: { title: trimmed } });
    if (classByTitle) return classByTitle.id;

    // 4. Fallback to first class in DB
    const firstClass = await this.classRepo.findOne({ where: {} });
    if (firstClass) return firstClass.id;

    throw new BadRequestException(`Kelas dengan id '${idClass}' tidak valid atau tidak ditemukan.`);
  }

  async listMaterials(q: QueryMaterialDto) {
    const rawClassId = q.idClass;
    let validClassId: string | undefined = undefined;
    if (rawClassId) {
      validClassId = await this.resolveClassId(rawClassId);
    }
    const cacheKey = `${this.CACHE_PREFIX}:materials:${validClassId || 'all'}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) return cachedData;

    const where: any = {};
    if (validClassId) where.idClass = validClassId;

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
      status: t.isActive ? 'active' : 'inactive',
    }));

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async getMaterial(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}:material:${id}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) return cachedData;

    const topic = await this.topicRepo.findOne({
      where: { id },
    });

    if (!topic) {
      throw new NotFoundException(`Materi dengan id '${id}' tidak ditemukan.`);
    }

    const result = {
      id: topic.id,
      idClass: topic.idClass,
      title: topic.title,
      content: topic.subject,
      description: topic.description,
      startDate: topic.startDate,
      status: topic.isActive ? 'active' : 'inactive',
    };

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async listTopics(q: QueryMaterialDto) {
    const rawClassId = q.idClass;
    let validClassId: string | undefined = undefined;
    if (rawClassId) {
      validClassId = await this.resolveClassId(rawClassId);
    }
    const cacheKey = `${this.CACHE_PREFIX}:topics:${validClassId || 'all'}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) return cachedData;

    const where: any = {};
    if (validClassId) where.idClass = validClassId;

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
    const validClassId = await this.resolveClassId(dto.idClass);

    try {
      const topic = this.topicRepo.create({
        id: randomUUID(),
        idClass: validClassId,
        title: dto.title,
        subject: dto.content || '',
        description: dto.description || '',
        startDate: dto.startDate || new Date().toISOString().slice(0, 10),
        isActive: dto.status !== 'inactive',
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
    } catch (err: any) {
      throw new BadRequestException(
        `Gagal membuat materi: ${err?.message || err}`,
      );
    }
  }

  async listQuestions(q: QueryMaterialDto) {
    const rawClassId = q.idClass;
    let validClassId: string | undefined = undefined;
    if (rawClassId) {
      validClassId = await this.resolveClassId(rawClassId);
    }
    const cacheKey = `${this.CACHE_PREFIX}:questions:${validClassId || 'all'}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const where: any = {};
    if (validClassId) where.topic = { idClass: validClassId };

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

  async getQuestion(id: string) {
    const cacheKey = `${this.CACHE_PREFIX}:question:${id}`;

    // Check cache
    const cachedData = await this.redisService.get(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    const test = await this.testRepo.findOne({
      where: { id },
      relations: { topic: true, hints: true },
    });

    if (!test) {
      throw new NotFoundException(`Soal dengan id '${id}' tidak ditemukan.`);
    }

    const result = {
      id: test.id,
      title: test.title,
      materialId: test.idTopic,
      topic: test.topic ? { id: test.topic.id, title: test.topic.title } : null,
      description: test.question,
      expectedOutput: test.expOutput,
      maxTries: test.maxTries,
      status: test.isActive ? 'active' : 'inactive',
      hint1: test.hints?.[0]?.hint1 ?? '',
      hint2: test.hints?.[0]?.hint2 ?? '',
      hint3: test.hints?.[0]?.hint3 ?? '',
    };

    // Store ke cache
    await this.redisService.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Create question dan invalidate cache
   */
  async createQuestion(dto: CreateQuestionDto) {
    if (!dto.materialId || typeof dto.materialId !== 'string' || dto.materialId.trim() === '') {
      throw new BadRequestException('materialId wajib diisi dan harus berupa UUID valid.');
    }

    const topic = await this.topicRepo.findOne({ where: { id: dto.materialId } });
    if (!topic) {
      throw new NotFoundException(
        `Topik dengan id '${dto.materialId}' tidak ditemukan.`,
      );
    }

    try {
      const test = this.testRepo.create({
        id: randomUUID(),
        idTopic: dto.materialId,
        title: dto.title,
        question: dto.description,
        expOutput: dto.expectedOutput ?? '',
        maxTries: dto.maxTries ?? 3,
        isActive: dto.status !== 'inactive',
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
    } catch (err: any) {
      throw new BadRequestException(
        `Gagal membuat soal: ${err?.message || err}`,
      );
    }
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
      `${this.CACHE_PREFIX}:material*`,
    );
    if (keys.length > 0) {
      await this.redisService.deleteMany(keys);
    }
  }

  private async invalidateQuestionsCache() {
    const keys = await this.redisService.getKeysByPattern(
      `${this.CACHE_PREFIX}:question*`,
    );
    if (keys.length > 0) {
      await this.redisService.deleteMany(keys);
    }
  }
}
