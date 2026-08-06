import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dahsboard.module';
import { VerificationModule } from './verification/verification.module';
import { BankModule } from './bank/bank.module';
import { MonitoringModule } from './monitoring/monitoring.module';

@Module({
    imports: [DashboardModule, VerificationModule, BankModule, MonitoringModule],
    exports: [DashboardModule, VerificationModule, BankModule, MonitoringModule],
})
export class TeacherModule {}