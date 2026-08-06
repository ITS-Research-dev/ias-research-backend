import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TeacherGuard } from '../../../common/guards/teacher.guard';

@Controller('teacher/dashboard')
@UseGuards(TeacherGuard)
export class DashboardController {
    constructor(private readonly svc: DashboardService) {}

    @Get('summary')
    async summary(@Query('class') className?: string) {
        return this.svc.getSummary(className);
    }

    @Get('trend')
    async trend(@Query('class') className?: string, @Query('period') period = 'minggu') {
        return this.svc.getTrend(className, period as 'minggu' | 'bulan');
    }
}