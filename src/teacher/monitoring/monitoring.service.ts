import { Injectable } from '@nestjs/common';

@Injectable()
export class MonitoringService {
    async listClasses() {
        return [
        { nama: 'XI RPL 1', wali: 'Bu Yulia', totalSiswa: 32, rataNilai: 79 },
        { nama: 'XI RPL 2', wali: 'Bu Agus', totalSiswa: 35, rataNilai: 83 },
        ];
    }

    async getClassDetail(className: string) {
        return { nama: className, wali: 'Bu Agus', totalSiswa: 35, rataNilai: 83, siswa: [] };
    }

    async getStudentDetail(className: string, studentId: string) {
        return { nama: studentId, nilai: 88, hint: 1, scores: { logika: 88, fungsi: 90, sintaks: 92, dok: 58, gaya: 80, konsep: 85 } };
    }
}