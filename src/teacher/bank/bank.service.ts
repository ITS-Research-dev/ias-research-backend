import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { Question } from './entities/question.entity';
import { Repository, ILike } from 'typeorm';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BankService {
    constructor(
        @InjectRepository(Material) private mRepo: Repository<Material>,
        @InjectRepository(Question) private qRepo: Repository<Question>,
    ) {}

    async listMaterials(q?: string) {
        if (!q) return this.mRepo.find({ order: { createdAt: 'DESC' } });
        return this.mRepo.find({
            where: {
                judul: ILike(`%${q}%`),
            },
        });
    }

    async createMaterial(dto: CreateMaterialDto) {
        const m = this.mRepo.create(dto);
        return this.mRepo.save(m);
    }

    async listQuestions(q?: string) {
        if (!q) return this.qRepo.find({ order: { createdAt: 'DESC' } });
        return this.qRepo.find({
            where: {
                judul: ILike(`%${q}%`),
            },
        });
    }

    async createQuestion(dto: CreateQuestionDto) {
        const q = this.qRepo.create(dto);
        return this.qRepo.save(q);
    }

    async uploadDocument(file: Express.Multer.File) {
        const jobId = randomUUID();
        return { jobId, filename: file?.originalname || null, status: 'queued' };
    }

    async triggerGenerate(body: { jobId?: string; kind: 'materi'|'soal'; topic: string }) {
        const jobId = randomUUID();
        return { jobId, kind: body.kind, topic: body.topic, status: 'queued' };
    }
}