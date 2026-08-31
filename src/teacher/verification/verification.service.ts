import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from '../../general/score/entities/score.entity';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class VerificationService {
    private readonly CACHE_TTL = 600; // 10 menit (verification queue berubah sering)
    private readonly CACHE_PREFIX = 'verification';

    constructor(
        @InjectRepository(Score) private scoreRepo: Repository<Score>,
        private readonly redisService: RedisService,
    ) {}

    private parseJsonScores(raw: any): Record<string, number> {
        if (!raw) return {};
        if (typeof raw === 'object') return raw;
        if (typeof raw === 'string') {
            try {
                return JSON.parse(raw);
            } catch {
                return {};
            }
        }
        return {};
    }

    private formatScoreEntity(score: Score) {
        const aiScoresObj = this.parseJsonScores(score.aiScore);
        const teacherScoresObj = this.parseJsonScores(score.teacherScore);

        const dimsConfig = [
            { key: 'logika', altKey: 'Logika', label: 'Logika' },
            { key: 'fungsionalitas', altKey: 'fungsi', label: 'Fungsionalitas' },
            { key: 'syntax', altKey: 'sintaks', label: 'Sintaks' },
            { key: 'dokumentasi', altKey: 'dok', label: 'Dokumentasi' },
            { key: 'code_style', altKey: 'gaya', label: 'Gaya' },
            { key: 'konsep', altKey: 'konsep', label: 'Konsep' },
        ];

        let diffTotal = 0;
        let count = 0;

        const dimensions = dimsConfig.map((cfg) => {
            const aiVal = Number(aiScoresObj[cfg.key] ?? aiScoresObj[cfg.altKey] ?? aiScoresObj[cfg.label] ?? 0);
            let teacherVal = Number(
                teacherScoresObj[cfg.key] ?? teacherScoresObj[cfg.altKey] ?? teacherScoresObj[cfg.label] ?? aiVal,
            );
            if (!score.flagOverride && score.teacherScore === null) {
                teacherVal = aiVal;
            }
            diffTotal += Math.abs(aiVal - teacherVal);
            count++;

            return {
                name: cfg.label,
                aiScore: aiVal,
                teacherScore: teacherVal,
            };
        });

        const aiAccuracy = count > 0 ? Math.max(0, Math.round(100 - diffTotal / count)) : 100;
        const avgScore =
            score.averageScore ?? Math.round(dimensions.reduce((a, b) => a + b.aiScore, 0) / (count || 1));

        return {
            id: score.id,
            studentId: score.idUser,
            studentName: score.user?.fullName || 'Siswa',
            questionTitle: score.test?.title || 'Soal Asesmen',
            questionId: score.idTest,
            className: score.test?.topic?.class?.title || 'XI RPL 2',
            aiScore: avgScore,
            status: score.flagOverride ? 'Selesai' : 'Perlu Verifikasi',
            aiNote: score.aiSuggestion || '',
            teacherNote: score.teacherSuggestion || '',
            dimensions,
            finalScores: dimensions,
            aiAccuracy: score.flagOverride ? aiAccuracy : 100,
            code: score.uCode || '',
            createdAt: score.createdAt,
        };
    }

    async listQueue(className?: string, q?: string) {
        const cacheKey = `${this.CACHE_PREFIX}:queue:${className || 'all'}:${q || 'all'}`;

        // Check cache
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const qb = this.scoreRepo
                .createQueryBuilder('score')
                .leftJoinAndSelect('score.user', 'user')
                .leftJoinAndSelect('score.test', 'test')
                .leftJoinAndSelect('test.topic', 'topic')
                .leftJoinAndSelect('topic.class', 'class');

            if (className) {
                qb.andWhere('(class.title = :className OR class.id = :className)', { className });
            }

            if (q) {
                qb.andWhere(
                    '(LOWER(user.fullName) LIKE :q OR LOWER(test.title) LIKE :q OR LOWER(topic.title) LIKE :q)',
                    { q: `%${q.toLowerCase()}%` },
                );
            }

            qb.orderBy('score.createdAt', 'DESC');

            const scores = await qb.getMany();
            if (scores.length === 0) {
                return this.getFallbackItems(className);
            }
            
            const result = scores.map((score) => this.formatScoreEntity(score));

            // Store ke cache
            await this.redisService.set(cacheKey, result, this.CACHE_TTL);

            return result;
        } catch (e: any) {
            console.warn('VerificationService.listQueue error, using fallback:', e?.message || e);
            let items = this.getFallbackItems(className);
            if (q) {
                const keyword = q.toLowerCase();
                items = items.filter(
                    (i) =>
                        i.studentName.toLowerCase().includes(keyword) ||
                        i.questionTitle.toLowerCase().includes(keyword),
                );
            }
            return items;
        }
    }

    async getSubmissionDetail(id: string) {
        const cacheKey = `${this.CACHE_PREFIX}:detail:${id}`;

        // Check cache
        const cachedData = await this.redisService.get(cacheKey);
        if (cachedData) {
            return cachedData;
        }

        try {
            const score = await this.scoreRepo.findOne({
                where: { id },
                relations: ['user', 'test', 'test.topic', 'test.topic.class'],
            });

            if (!score) {
                const fallback = this.getFallbackItems().find((item) => item.id === id);
                return fallback || null;
            }

            const result = this.formatScoreEntity(score);

            // Store ke cache
            await this.redisService.set(cacheKey, result, this.CACHE_TTL);

            return result;
        } catch (e) {
            const fallback = this.getFallbackItems().find((item) => item.id === id);
            return fallback || null;
        }
    }

    async review(id: string, payload: any) {
        try {
            const score = await this.scoreRepo.findOne({
                where: { id },
                relations: ['user', 'test', 'test.topic', 'test.topic.class'],
            });

            if (!score) {
                return { ok: true };
            }

            const teacherNote =
                payload.teacherNote ||
                payload.catatan ||
                (payload.decision === 'terima' ? 'Sesuai, skor AI diterima langsung.' : '');

            score.flagOverride = true;
            score.teacherSuggestion = teacherNote;
            score.overrideBy = payload.reviewerId || null;

            if (payload.decision === 'terima') {
                score.teacherScore = score.aiScore;
            } else {
                const rawScores = payload.scores || payload.finalScore || score.aiScore;
                if (typeof rawScores === 'object' && rawScores !== null) {
                    score.teacherScore = {
                        logika: Number(rawScores.logika ?? rawScores.Logika ?? 0),
                        fungsionalitas: Number(rawScores.fungsionalitas ?? rawScores.fungsi ?? rawScores.Fungsionalitas ?? 0),
                        syntax: Number(rawScores.syntax ?? rawScores.sintaks ?? rawScores.Sintaks ?? 0),
                        dokumentasi: Number(rawScores.dokumentasi ?? rawScores.dok ?? rawScores.Dokumentasi ?? 0),
                        code_style: Number(rawScores.code_style ?? rawScores.gaya ?? rawScores.Gaya ?? 0),
                        konsep: Number(rawScores.konsep ?? rawScores.Konsep ?? 0),
                    };
                } else {
                    score.teacherScore = rawScores;
                }
            }

            // Recalculate averageScore from the final teacher scores
            const finalScores = score.teacherScore as unknown as Record<string, number>;
            const vals = Object.values(finalScores).filter((v) => typeof v === 'number');
            if (vals.length > 0) {
                score.averageScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
            }

            await this.scoreRepo.save(score);

            // Invalidate cache
            await this.invalidateVerificationCache(id, score.idUser);

            return { ok: true, submission: this.formatScoreEntity(score) };
        } catch (e: any) {
            console.warn('VerificationService.review error:', e?.message || e);
            return { ok: true };
        }
    }

    private async invalidateVerificationCache(submissionId?: string, studentId?: string) {
        const keysToDelete: string[] = [];
        
        // Invalidate queue cache
        const queueKeys = await this.redisService.getKeysByPattern(`${this.CACHE_PREFIX}:queue:*`);
        keysToDelete.push(...queueKeys);

        // Invalidate detail cache
        if (submissionId) {
            keysToDelete.push(`${this.CACHE_PREFIX}:detail:${submissionId}`);
        }

        // Invalidate monitoring cache
        const monitoringKeys = await this.redisService.getKeysByPattern(`monitoring:*`);
        keysToDelete.push(...monitoringKeys);

        // Invalidate dashboard cache
        const dashboardKeys = await this.redisService.getKeysByPattern(`dashboard:*`);
        keysToDelete.push(...dashboardKeys);

        // Invalidate profile cache
        if (studentId) {
            keysToDelete.push(`profile:${studentId}`);
        } else {
            const profileKeys = await this.redisService.getKeysByPattern(`profile:*`);
            keysToDelete.push(...profileKeys);
        }

        if (keysToDelete.length > 0) {
            await this.redisService.deleteMany(keysToDelete);
        }
    }

    private getFallbackItems(className?: string) {
        const allItems = [
            {
                id: '1',
                studentId: 'std-1',
                studentName: 'Dika Pratama',
                questionTitle: 'Rata-rata Tiga Nilai',
                className: 'XI RPL 2',
                classId: 'c1',
                aiScore: 57,
                status: 'Perlu Verifikasi',
                aiNote: 'Struktur fungsi masih perlu diperbaiki, hasil perhitungan kadang tidak sesuai output yang diharapkan.',
                teacherNote: '',
                dimensions: [
                    { name: 'Logika', aiScore: 58, teacherScore: 58 },
                    { name: 'Fungsionalitas', aiScore: 62, teacherScore: 62 },
                    { name: 'Sintaks', aiScore: 62, teacherScore: 62 },
                    { name: 'Dokumentasi', aiScore: 45, teacherScore: 45 },
                    { name: 'Gaya', aiScore: 55, teacherScore: 55 },
                    { name: 'Konsep', aiScore: 60, teacherScore: 60 },
                ],
                finalScores: [
                    { name: 'Logika', aiScore: 58, teacherScore: 58 },
                    { name: 'Fungsionalitas', aiScore: 62, teacherScore: 62 },
                    { name: 'Sintaks', aiScore: 62, teacherScore: 62 },
                    { name: 'Dokumentasi', aiScore: 45, teacherScore: 45 },
                    { name: 'Gaya', aiScore: 55, teacherScore: 55 },
                    { name: 'Konsep', aiScore: 60, teacherScore: 60 },
                ],
                aiAccuracy: 100,
                code: 'def hitung_rata_rata(a, b, c):\n    return (a + b + c) / 3',
                createdAt: new Date(),
            },
        ];

        if (className) {
            return allItems.filter(
                (item) => item.className === className || (item as any).classId === className,
            );
        }
        return allItems;
    }
}