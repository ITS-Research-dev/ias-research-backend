import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    UnauthorizedException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtExpirationInterceptor implements NestInterceptor {
    constructor(private readonly jwtService: JwtService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            this.jwtService.verify(token);
        } catch (error) {
            if (error instanceof Error && error.name === 'TokenExpiredError') {
            return throwError(() => 
                new UnauthorizedException({
                message: 'Token sudah expired',
                code: 'TOKEN_EXPIRED',
                statusCode: 401,
                })
            );
            }
        }
        }

        return next.handle();
    }
}