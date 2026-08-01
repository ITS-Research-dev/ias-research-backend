import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'ubah_ini_di_env',
    });
  }

  async validate(payload: { sub: string; username: string; role: string, classId?: string }) {
    return {
      userId: payload.sub,
      username: payload.username,
      role: payload.role, 
      ...(payload.classId && { classId: payload.classId })
    };
  }
}
