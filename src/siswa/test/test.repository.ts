import { Injectable, NotFoundException } from '@nestjs/common';
import fs from 'node:fs';
import path from 'node:path';
import { TestEntity } from './entities/test.entity';

interface TestRaw {
    id: number;
    reference: string;
    source_valid: string;
    checked: boolean;
    level: string;
    'sub-theme': string;
    judul: string;
    soal: string;
    expected_output: string;
    hints?: string[];
}

interface HintDataset {
    [key: string]: {
        pertanyaan: string;
        hints: {
            '1': string;
            '2': string;
            '3': string;
        };
    };
}

@Injectable()
export class TestRepository {
    private tests: TestEntity[] = [];

    constructor() {
        const testPath = path.join(process.cwd(), 'dataset', 'test.json');
        const hintPath = path.join(process.cwd(), 'dataset', 'hint.json');

        const testRaw: TestRaw[] = JSON.parse(fs.readFileSync(testPath, 'utf-8'));
        const hintData: HintDataset = JSON.parse(fs.readFileSync(hintPath, 'utf-8'));

        this.tests = testRaw.map((t) => {
            const hintKey = `soal_${t.id}`;
            const hintEntry = hintData[hintKey];

            return {
                id: String(t.id),
                idTopic: 'default',
                title: t.judul,
                question: t.soal,
                expOutput: t.expected_output,
                level: t.level,
                subTheme: t['sub-theme'],
                reference: t.reference,
                maxTries: 3,
                hints: t.hints || [],
                hint1: hintEntry?.hints?.['1'] || '',
                hint2: hintEntry?.hints?.['2'] || '',
                hint3: hintEntry?.hints?.['3'] || '',
            };
        });
    }

    async findByTopicId(idTopic: string): Promise<Partial<TestEntity>[]> {
        return this.tests
        .filter((t) => t.idTopic === idTopic)
        .map(({ id, title, question, expOutput, level, subTheme }) => ({
            id,
            title,
            question,
            expOutput,
            level,
            subTheme,
        }));
    }

    async findById(id: string): Promise<TestEntity> {
        const test = this.tests.find((t) => t.id === id);
        if (!test) {
        throw new NotFoundException('Data Not Found');
        }
        return test;
    }
}
