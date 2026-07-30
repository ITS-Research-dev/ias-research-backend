import { Injectable, NotFoundException } from '@nestjs/common';
import { MateriEntity } from './entities/materi.entity';

@Injectable()
export class MateriRepository {
    // Dummy database adapter/ORM implementation
    private materis: MateriEntity[] = [];

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