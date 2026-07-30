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
}
