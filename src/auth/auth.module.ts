import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Role } from '../role/entities/role.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
// JwtStrategy belum diimplementasikan di file jwt.strategy.ts di repo ini
// sehingga tidak diikutkan sebagai provider agar build tidak gagal.

@Module({
  imports: [
    UsersModule,

    // Untuk memastikan JwtService tersedia di AuthService
    JwtModule.register({
      secret: 'secretKey',
      signOptions: {
        expiresIn: '1d',
      },
    }),

    // Supaya relasi User#role punya metadata Role
    TypeOrmModule.forFeature([User, Role]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}

