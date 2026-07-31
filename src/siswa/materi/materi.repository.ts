import { Injectable, NotFoundException } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { MateriEntity } from './entities/materi.entity';

interface SubjectRaw {
    id: number;
    title: string;
    description: string;
    subjects: string;
}

@Injectable()
export class MateriRepository {
    private materis: MateriEntity[] = [];

    constructor() {
        const filePath = path.join(process.cwd(), 'dataset', 'subject.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const subjects: SubjectRaw[] = JSON.parse(rawData);
        this.materis = subjects.map((s) => ({
            id: String(s.id),
            idClass: 'default',
            title: s.title,
            subject: s.subjects,
            description: s.description,
            isActive: true,
        }));
    }

    async findByClassId(idClass: string): Promise<Partial<MateriEntity>[]> {
        return this.materis
        .filter((m) => m.idClass === idClass && m.isActive)
        .map(({ id, title, subject }) => ({ id, title, subject }));
    }

    async findById(id: string): Promise<MateriEntity> {
        const materi = this.materis.find((m) => m.id === id && m.isActive);
        if (!materi) {
        throw new NotFoundException('Data Not Found');
        }
        return materi;
    }
}
