import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from '../../general/score/entities/score.entity';

@Injectable()
export class VerificationService {
    constructor(
        @InjectRepository(Score) private scoreRepo: Repository<Score>,
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
        try {
            const qb = this.scoreRepo
                .createQueryBuilder('score')
                .leftJoinAndSelect('score.user', 'user')
                .leftJoinAndSelect('score.test', 'test')
                .leftJoinAndSelect('test.topic', 'topic')
                .leftJoinAndSelect('topic.class', 'class');

            if (className) {
                qb.andWhere('class.title = :className', { className });
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
                return this.getFallbackItems();
            }
            return scores.map((score) => this.formatScoreEntity(score));
        } catch (e) {
            console.warn('VerificationService.listQueue error, using fallback:', e?.message || e);
            let items = this.getFallbackItems();
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
        try {
            const score = await this.scoreRepo.findOne({
                where: { id },
                relations: ['user', 'test', 'test.topic', 'test.topic.class'],
            });

            if (!score) {
                const fallback = this.getFallbackItems().find((item) => item.id === id);
                return fallback || null;
            }
            return this.formatScoreEntity(score);
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
                score.teacherScore = payload.scores || payload.finalScore || score.aiScore;
            }

            await this.scoreRepo.save(score);

            return { ok: true, submission: this.formatScoreEntity(score) };
        } catch (e) {
            console.warn('VerificationService.review error:', e?.message || e);
            return { ok: true };
        }
    }

    private getFallbackItems() {
        return [
            {
                id: '1',
                studentId: 'std-1',
                studentName: 'Dika Pratama',
                questionTitle: 'Rata-rata Tiga Nilai',
                className: 'XI RPL 2',
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
            {
                id: '2',
                studentId: 'std-2',
                studentName: 'Citra Ramadhani',
                questionTitle: 'Luas Lingkaran',
                className: 'XI RPL 2',
                aiScore: 72,
                status: 'Perlu Verifikasi',
                aiNote: 'Perhitungan sudah mendekati hasil yang diharapkan, namun terdapat beberapa bagian kode yang masih perlu diperiksa kembali.',
                teacherNote: '',
                dimensions: [
                    { name: 'Logika', aiScore: 70, teacherScore: 70 },
                    { name: 'Fungsionalitas', aiScore: 75, teacherScore: 75 },
                    { name: 'Sintaks', aiScore: 78, teacherScore: 78 },
                    { name: 'Dokumentasi', aiScore: 65, teacherScore: 65 },
                    { name: 'Gaya', aiScore: 70, teacherScore: 70 },
                    { name: 'Konsep', aiScore: 74, teacherScore: 74 },
                ],
                finalScores: [
                    { name: 'Logika', aiScore: 70, teacherScore: 70 },
                    { name: 'Fungsionalitas', aiScore: 75, teacherScore: 75 },
                    { name: 'Sintaks', aiScore: 78, teacherScore: 78 },
                    { name: 'Dokumentasi', aiScore: 65, teacherScore: 65 },
                    { name: 'Gaya', aiScore: 70, teacherScore: 70 },
                    { name: 'Konsep', aiScore: 74, teacherScore: 74 },
                ],
                aiAccuracy: 100,
                code: 'import math\ndef luas_lingkaran(r):\n    return math.pi * r * r',
                createdAt: new Date(),
            },
        ];
    }
}