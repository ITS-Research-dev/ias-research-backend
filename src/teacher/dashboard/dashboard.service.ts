import { Injectable, NotFoundException } from '@nestjs/common';
import { ClassRepository } from '../../general/class/class.repository';
import { ScoreRepository } from '../../general/score/score.repository';
import { formatIntoProfileSummary } from '../../../common/utils/mapper';

@Injectable()
export class DashboardService {
  constructor(
    private readonly classRepository: ClassRepository,
    private readonly scoreRepository: ScoreRepository,
  ) {}

  async getData(classId: string) {
    const exist = await this.classRepository.findById(classId);
    if (!exist) throw new NotFoundException(`Kelas ${classId} tidak ditemukan`);
    return this.classRepository.dashboardData(classId);
  }
  
  async getTrend(classId: string) {
    const exist = await this.classRepository.findById(classId);
    if (!exist) throw new NotFoundException(`Trend kosong karena tidak ada data`);
    const data = await this.scoreRepository.findDashboard(classId)
    return formatIntoProfileSummary(data);
  }
}
