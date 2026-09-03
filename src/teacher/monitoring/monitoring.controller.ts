import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { TeacherGuard } from '../../../common/guards/teacher.guard';
import { QueryDashboardDto } from '../dashboard/dto/dashboard.dto';
import { DashboardService } from '../dashboard/dashboard.service';

@Controller('teacher/monitoring')
@UseGuards(TeacherGuard)
export class MonitoringController {
    constructor(
        private readonly svc: MonitoringService,
        private readonly dashboardSvc: DashboardService
    ) {}

    @Get('classes')
    listClasses() { return this.svc.listClasses(); }

    @Get('classes/:className')
    getClass(@Param('className') className: string) { return this.svc.getClassDetail(className); }

    @Get('/trend')
      async getTrend(@Query() query: QueryDashboardDto) {
        return this.dashboardSvc.getTrend(query.classId);
      }

    @Get('classes/:className/students/:studentId')
    getStudent(@Param('className') className: string, @Param('studentId') studentId: string) {
        return this.svc.getStudentDetail(className, studentId);
    }
}