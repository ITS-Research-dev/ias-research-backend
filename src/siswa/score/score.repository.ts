import { Injectable } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { ScoreEntity } from './entities/score.entity';

interface ScoreRaw {
    id_soal: number;
    kode_siswa: string;
    level_siswa: string;
    nilai: {
        fungsionalitas: number;
        logika: number;
        syntax: number;
        code_style: number;
        dokumentasi: number;
        konsep: number;
    };
    nilai_avg: number;
    feedback: string;
}

@Injectable()
export class ScoreRepository {
    private scores: ScoreEntity[] = [];

    constructor() {
        const filePath = path.join(process.cwd(), 'dataset', 'score.json');
        const rawData = fs.readFileSync(filePath, 'utf-8');
        const rawScores: ScoreRaw[] = JSON.parse(rawData);

        this.scores = rawScores.map((s, index) => ({
            id: `${s.id_soal}-${index}`,
            idTest: String(s.id_soal),
            idUser: 'uuid-1',
            level: s.level_siswa,
            averageScore: s.nilai_avg,
            flagOverride: false,
            aiScore: String(s.nilai_avg),
            aiSuggestion: s.feedback,
            aiFinishTime: new Date().toISOString(),
            uCode: s.kode_siswa,
            createdAt: new Date(),
            idSoal: s.id_soal,
            levelSiswa: s.level_siswa,
            fungsionalitas: s.nilai.fungsionalitas,
            logika: s.nilai.logika,
            syntax: s.nilai.syntax,
            codeStyle: s.nilai.code_style,
            dokumentasi: s.nilai.dokumentasi,
            konsep: s.nilai.konsep,
            feedback: s.feedback,
        }));
    }

    async findByUserId(idUser: string): Promise<ScoreEntity[]> {
        return this.scores.filter((s) => s.idUser === idUser);
    }

    async saveResult(data: ScoreEntity): Promise<void> {
        this.scores.push(data);
    }
}
