import { Injectable } from '@nestjs/common';

@Injectable()
export class DashboardService {
    async getSummary(className?: string) {
        return {
        className: className || 'XI RPL 2',
        totalStudents: 32,
        avgScore: 83,
        aiAvgSeconds: 4,
        topicAverages: [
            { topik: 'Variabel', avg: 88 },
            { topik: 'Percabangan', avg: 82 },
            { topik: 'Perulangan', avg: 65 },
        ],
        };
    }

    async getTrend(className: string | undefined, period: 'minggu' | 'bulan') {
        const finalAvg = 85;
        const labels = period === 'bulan' ? ['Jan','Feb','Mar','Apr','Mei','Jun'] : ['M1','M2','M3','M4','M5','M6'];
        const start = Math.max(35, finalAvg - 28);
        const series = labels.map((label, i) => {
        const t = i / (labels.length - 1);
        const val = Math.round(start + (finalAvg - start) * t + ((i*7)%5 - 2));
        return { label, value: Math.max(0, Math.min(100, val)) };
        });
    return { series };
    }
}