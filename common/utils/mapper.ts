import { Score } from '../../src/general/score/entities/score.entity';
import { checkMonth, checkWeek } from './general';

// scoring.constants.ts
export const SCORING_KEYS = [
  'fungsionalitas',
  'logika',
  'syntax',
  'code_style',
  'dokumentasi',
  'konsep',
] as const;

export type ScoringKey = (typeof SCORING_KEYS)[number];
export type Scoring = Record<ScoringKey, number>;

export const TEMPLATE: RawGraphProfile = { avg: 0, count: 0 };

export interface RawGraphProfile {
  avg: number;
  count: number;
}

export interface CompetencySummary {
  name: string;
  score: number;
}

export interface ProfileSummary {
  nameMaterials: string[];
  competencyTrend: Record<string, Record<string, RawGraphProfile>>;
  levelTrend: Record<string, Record<string, RawGraphProfile>>;
}

export function formatIntoProfileSummary(datas: Score[]): ProfileSummary {
  const topicName: { [key: string]: number } = {};
  const competencyTrend: { [key: string]: { [key: string]: RawGraphProfile } } = {};

  for (const data of datas) {
    const topicTitle = data.test.topic.title;
    topicName[topicTitle] = 0

    const week = checkWeek(data.createdAt);
    const month = checkMonth(data.createdAt);

    if (!competencyTrend[week]) competencyTrend[week] = { total: { ...TEMPLATE } };
    if (!competencyTrend[month]) competencyTrend[month] = { total: { ...TEMPLATE } };
    if (!competencyTrend[week][topicTitle]) competencyTrend[week][topicTitle] = { ...TEMPLATE };
    if (!competencyTrend[month][topicTitle]) competencyTrend[month][topicTitle] = { ...TEMPLATE };

    // Week
    competencyTrend[week].total.avg += data.averageScore;
    competencyTrend[week].total.count += 1;
    competencyTrend[week][topicTitle].avg += data.averageScore;
    competencyTrend[week][topicTitle].count += 1;

    // Month
    competencyTrend[month].total.avg += data.averageScore;
    competencyTrend[month].total.count += 1;
    competencyTrend[month][topicTitle].avg += data.averageScore;
    competencyTrend[month][topicTitle].count += 1;
  }

  const nameMaterials = Object.keys(topicName);

  return {
    nameMaterials,
    competencyTrend,
    levelTrend: competencyTrend
  };
}
