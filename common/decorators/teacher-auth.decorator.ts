// common/decorators/siswa-auth.decorator.ts
import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { JwtAuthGuard } from '../../src/auth/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';

export function GuruAuth() {
    return applyDecorators(
    UseGuards(JwtAuthGuard, RolesGuard),
    Roles("Guru")
  );
}