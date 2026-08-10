import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Topic } from '../../general/topic/entities/topic.entity';
import { Test } from '../../general/test/entities/test.entity';
import { Hint } from '../../general/hint/entities/hint.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BankService {
    constructor(
        @InjectRepository(Topic) private topicRepo: Repository<Topic>,
        @InjectRepository(Test) private testRepo: Repository<Test>,
        @InjectRepository(Hint) private hintRepo: Repository<Hint>,
    ) {}

    async listMaterials(q?: string) {
        const where: any = { isActive: true };
        if (q) where.title = ILike(`%${q}%`);
        const topics = await this.topicRepo.find({
            where,
            order: { startDate: 'DESC' },
        });
        return topics.map((t) => ({
            id: t.id,
            idClass: t.idClass,
            judul: t.title,
            subject: t.subject,
            deskripsi: t.description,
            isActive: t.isActive,
            startDate: t.startDate,
        }));
    }

    async createMaterial(dto: CreateMaterialDto) {
        const topic = this.topicRepo.create({
            id: randomUUID(),
            idClass: dto.idClass,
            title: dto.judul,
            subject: dto.subject,
            description: dto.deskripsi ?? 'ini deskripsi',
            startDate: new Date().toISOString().slice(0, 10),
            isActive: dto.isActive ?? true,
        });
        const saved = await this.topicRepo.save(topic);
        return {
            id: saved.id,
            idClass: saved.idClass,
            judul: saved.title,
            subject: saved.subject,
            deskripsi: saved.description,
            isActive: saved.isActive,
            message: 'Materi berhasil dibuat.',
        };
    }

    async listQuestions(q?: string) {
        const where: any = {};
        if (q) where.title = ILike(`%${q}%`);
        const tests = await this.testRepo.find({
            where,
            relations: { topic: true, hints: true },
            order: { idTopic: 'ASC' },
        });
        return tests.map((t) => ({
            id: t.id,
            idTopic: t.idTopic,
            topik: t.topic?.title ?? t.idTopic,
            judul: t.title,
            soal: t.question,
            expectedOutput: t.expOutput,
            maxTries: t.maxTries,
            hint1: t.hints?.[0]?.hint1 ?? '',
            hint2: t.hints?.[0]?.hint2 ?? '',
            hint3: t.hints?.[0]?.hint3 ?? '',
        }));
    }

    async createQuestion(dto: CreateQuestionDto) {
        const topic = await this.topicRepo.findOne({ where: { id: dto.idTopic } });
        if (!topic) {
            throw new NotFoundException(`Topik dengan id '${dto.idTopic}' tidak ditemukan.`);
        }

        const test = this.testRepo.create({
            id: randomUUID(),
            idTopic: dto.idTopic,
            title: dto.judul,
            question: dto.soal,
            expOutput: dto.expectedOutput ?? '',
            maxTries: dto.maxTries ?? 3,
        });
        const saved = await this.testRepo.save(test);

        if (dto.hint1 || dto.hint2 || dto.hint3) {
            const hint = this.hintRepo.create({
                idTest: saved.id,
                hint1: dto.hint1 ?? '',
                hint2: dto.hint2 ?? '',
                hint3: dto.hint3 ?? '',
            });
            await this.hintRepo.save(hint);
        }

        return {
            id: saved.id,
            idTopic: saved.idTopic,
            judul: saved.title,
            soal: saved.question,
            expectedOutput: saved.expOutput,
            maxTries: saved.maxTries,
            message: 'Soal berhasil dibuat.',
        };
    }

    async uploadDocument(file: Express.Multer.File) {
        const jobId = randomUUID();
        return { jobId, filename: file?.originalname || null, status: 'queued' };
    }

    async triggerGenerate(body: { jobId?: string; kind: 'materi' | 'soal'; topic: string }) {
        const jobId = randomUUID();
        return { jobId, kind: body.kind, topic: body.topic, status: 'queued' };
    }
}
