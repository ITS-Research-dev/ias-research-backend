import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  verify(@Body('token') token: string) {
    try {
      const decoded = this.authService.verifyToken(token);
      return { valid: true, user: decoded };
    } catch (error) {
      throw new UnauthorizedException({ 
        message: 'Token invalid atau expired',
        code: 'TOKEN_INVALID'
      });
    }
  }
}