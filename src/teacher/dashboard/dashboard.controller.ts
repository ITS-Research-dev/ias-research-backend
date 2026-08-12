import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { GuruAuth } from '../../../common/decorators/teacher-auth.decorator';
import { QueryDashboardDto } from './dto/dashboard.dto';

@Controller('teacher/dashboard')
@GuruAuth()
export class DashboardController {
  constructor(private readonly svc: DashboardService) {}

  @Get('')
  async getData(@Query() query: QueryDashboardDto) {
    return this.svc.getData(query.classId);
  }

  @Get('/trend')
  async getTrend(@Query() query: QueryDashboardDto) {
    return this.svc.getTrend(query.classId);
  }
  
}
