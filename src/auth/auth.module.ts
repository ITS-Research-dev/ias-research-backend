import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Role } from '../role/entities/role.entity';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    UsersModule,

    JwtModule.register({
      secret: 'secretKey',
      signOptions: {
        expiresIn: '1d',
      },
    }),

    TypeOrmModule.forFeature([User, Role]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}

