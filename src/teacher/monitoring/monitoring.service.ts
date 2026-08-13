import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Class } from '../../general/class/entities/class.entity';
import { ClassAssign } from '../../general/class-assign/entities/class-assign.entity';
import { User } from '../../general/user/entities/user.entity';
import { Score } from '../../general/score/entities/score.entity';
import { RedisService } from '../../redis/redis.service';
import { RoleState } from '../../general/class-assign/entities/role-state.enum';

@Injectable()
export class MonitoringService {
    private readonly CACHE_TTL = 1200; // 20 menit
    private readonly CACHE_PREFIX = 'monitoring';

    constructor(
        @InjectRepository(Class) private classRepo: Repository<Class>,
        @InjectRepository(ClassAssign) private assignRepo: Repository<ClassAssign>,
        @InjectRepository(User) private userRepo: Repository<User>,
        @InjectRepository(Score) private scoreRepo: Repository<Score>,
        private readonly redisService: RedisService,
    ) {}

    async listClasses() {
        const cacheKey = `${this.CACHE_PREFIX}:classes:all`;

        // Check cache
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const classes = await this.classRepo.find();
        const result: { nama: string; wali: string; totalSiswa: number; countTotal: number }[] = [];
        
        for (const cls of classes) {
            const totalSiswa = await this.assignRepo.count({
                where: { idClass: cls.id, state: RoleState.ACTIVE },
            });
            result.push({
                nama: cls.title,
                wali: cls.waliKelas,
                totalSiswa,
                countTotal: cls.countTotal,
            });
        }

        // Store ke cache
        await this.redisService.set(cacheKey, result, this.CACHE_TTL);

        return result;
    }

    async getClassDetail(className: string) {
        const cacheKey = `${this.CACHE_PREFIX}:class:${className}`;

        // Check cache
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const cls = await this.classRepo.findOne({
            where: { title: className },
            relations: { assignments: { user: true } },
        });
        if (!cls) throw new NotFoundException(`Kelas ${className} tidak ditemukan`);

        const siswa = cls.assignments
            .filter((a) => a.state === RoleState.ACTIVE)
            .map((a) => ({ id: a.user.id, nama: a.user.fullName }));

        const userIds = siswa.map((s) => s.id);
        let rataNilai = 0;
        if (userIds.length > 0) {
            const scores = await this.scoreRepo
                .createQueryBuilder('s')
                .where('s.idUser IN (:...userIds)', { userIds })
                .getMany();
            const avg = scores.length
                ? scores.reduce((sum, sc) => sum + sc.averageScore, 0) / scores.length
                : 0;
            rataNilai = Math.round(avg);
        }

        const result = {
            nama: cls.title,
            wali: cls.waliKelas,
            totalSiswa: siswa.length,
            rataNilai,
            siswa,
        };

        // Store ke cache
        await this.redisService.set(cacheKey, result, this.CACHE_TTL);

        return result;
    }

    async getStudentDetail(className: string, studentId: string) {
        const cacheKey = `${this.CACHE_PREFIX}:student:${studentId}`;

        // Check cache
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        const user = await this.userRepo.findOne({
            where: { id: studentId },
            relations: { assignments: { class: true } },
        });
        if (!user) throw new NotFoundException(`Siswa ${studentId} tidak ditemukan`);

        const scores = await this.scoreRepo.find({
            where: { idUser: studentId },
            relations: { test: { topic: true } },
            order: { createdAt: 'DESC' },
            take: 20,
        });

        const avg = scores.length
            ? Math.round(scores.reduce((s, sc) => s + sc.averageScore, 0) / scores.length)
            : 0;

        const dims = { logika: 0, fungsi: 0, sintaks: 0, dok: 0, gaya: 0, konsep: 0 };
        const count = scores.length || 1;
        for (const sc of scores) {
            const a = sc.aiScore as any;
            dims.logika += a?.logika ?? 0;
            dims.fungsi += a?.fungsionalitas ?? a?.fungsi ?? 0;
            dims.sintaks += a?.syntax ?? a?.sintaks ?? 0;
            dims.dok += a?.dokumentasi ?? a?.dok ?? 0;
            dims.gaya += a?.code_style ?? a?.gaya ?? 0;
            dims.konsep += a?.konsep ?? 0;
        }
        const scoresAgg = {
            logika: Math.round(dims.logika / count),
            fungsi: Math.round(dims.fungsi / count),
            sintaks: Math.round(dims.sintaks / count),
            dok: Math.round(dims.dok / count),
            gaya: Math.round(dims.gaya / count),
            konsep: Math.round(dims.konsep / count),
        };

        const result = {
            nama: user.fullName,
            nilai: avg,
            hint: scores.reduce((s, sc) => s + ((sc as any).hintUsage ?? 0), 0),
            scores: scoresAgg,
            riwayat: scores.map((sc) => ({
                id: sc.id,
                soal: sc.test?.title ?? sc.idTest,
                topik: sc.test?.topic?.title ?? null,
                nilai: sc.averageScore,
                level: sc.level,
                createdAt: sc.createdAt,
            })),
        };

        // Store ke cache
        await this.redisService.set(cacheKey, result, this.CACHE_TTL);

        return result;
    }

    async invalidateClassCache(className?: string, studentId?: string) {
        const keysToDelete: string[] = [`${this.CACHE_PREFIX}:classes:all`];

        if (className) {
            keysToDelete.push(`${this.CACHE_PREFIX}:class:${className}`);
        }

        if (studentId) {
            keysToDelete.push(`${this.CACHE_PREFIX}:student:${studentId}`);
        }

        await this.redisService.deleteMany(keysToDelete);
    }
}