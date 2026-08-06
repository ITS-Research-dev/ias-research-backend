import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MonitoringService } from './monitoring.service';
import { TeacherGuard } from '../../../common/guards/teacher.guard';

@Controller('teacher/monitoring')
@UseGuards(TeacherGuard)
export class MonitoringController {
    constructor(private readonly svc: MonitoringService) {}

    @Get('classes')
    listClasses() { return this.svc.listClasses(); }

    @Get('classes/:className')
    getClass(@Param('className') className: string) { return this.svc.getClassDetail(className); }

    @Get('classes/:className/students/:studentId')
    getStudent(@Param('className') className: string, @Param('studentId') studentId: string) {
        return this.svc.getStudentDetail(className, studentId);
    }
}