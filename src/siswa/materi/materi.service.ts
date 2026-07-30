import { Injectable, ForbiddenException } from '@nestjs/common';
import { MateriRepository } from './materi.repository';
import { QueryMateriDto } from './dto/query-materi.dto';

@Injectable()
export class MateriService {
    constructor(private readonly materiRepository: MateriRepository) {}

    async getMateriByClass(query: QueryMateriDto, userClassId: string) {
        // Validasi: Class wajib dimiliki siswa
        if (query.idClass !== userClassId) {
        throw new ForbiddenException('Class tidak valid untuk siswa ini');
        }
        return this.materiRepository.findByClassId(query.idClass);
    }

    async getMateriDetail(id: string) {
        return this.materiRepository.findById(id);
    }
}