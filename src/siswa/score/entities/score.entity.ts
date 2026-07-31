export class ScoreEntity {
    id!: string;
    idTest!: string;
    idUser!: string;
    level!: string;
    averageScore!: number;
    flagOverride!: boolean;
    aiScore!: string;
    aiSuggestion!: string;
    aiFinishTime!: string;
    uCode!: string;
    overrideBy?: string;
    teacherScore?: string;
    teacherSuggestion?: string;
    createdAt!: Date;

    idSoal?: number;
    levelSiswa?: string;
    fungsionalitas?: number;
    logika?: number;
    syntax?: number;
    codeStyle?: number;
    dokumentasi?: number;
    konsep?: number;
    feedback?: string;
}
