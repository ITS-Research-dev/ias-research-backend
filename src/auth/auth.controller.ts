import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import {LoginDto} from './dto/login.dto';
import {AuthService} from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.username, dto.password);
  }
}