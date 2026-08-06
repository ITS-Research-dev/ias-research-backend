import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class TeacherGuard implements CanActivate {
    canActivate(ctx: ExecutionContext): boolean {
        const req = ctx.switchToHttp().getRequest();
        const role = req.headers['x-user-role'] || req.user?.role;
        if (!role) return true; // dev mode
        return role === 'teacher';
    }
}