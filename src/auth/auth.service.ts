// auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRepository } from '../general/user/user.repository'; // sesuaikan path

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string) {
    const user = await this.userRepository.findByUsername(username); // tambahkan method ini di repository kalau belum ada
    if (!user) {
      throw new UnauthorizedException('Username atau password salah');
    }
    if (user.assignments.length < 1)
      throw new UnauthorizedException('Siswa/Guru belum masuk ke kelas apapun');

    const isMatch = await bcrypt.compare(password, user.uPassword);
    if (!isMatch) {
      throw new UnauthorizedException('Username atau password salah');
    }

    const { uPassword: _, ...result } = user;
    return result;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);
    return {
      message: 'Login berhasil',
      ...this.createTokenPair(user),
      user: {
        name: user.fullName,
        role: user.role.description,
        ...(user.role.description === 'Guru' && {
          classId: user.assignments,
        }),
      },
    };
  }

  async refresh(refreshToken: string) {
    let payload: { username: string; tokenType?: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token tidak valid atau sudah expired',
      });
    }

    if (payload.tokenType !== 'refresh' || !payload.username) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Refresh token tidak valid',
      });
    }

    const user = await this.userRepository.findByUsername(payload.username);
    if (!user || user.assignments.length < 1) {
      throw new UnauthorizedException({
        code: 'REFRESH_TOKEN_INVALID',
        message: 'Akun tidak valid atau tidak memiliki kelas',
      });
    }

    return this.createTokenPair(user);
  }

  private get refreshSecret() {
    return (
      process.env.JWT_REFRESH_SECRET ||
      `${process.env.JWT_SECRET || 'ubah_ini_di_env'}_refresh`
    );
  }

  private createTokenPair(user: Awaited<ReturnType<AuthService['validateUser']>>) {
    const payload = {
      sub: user.id,
      username: user.uCredentials,
      role: user.role.description,
      ...(user.role.description === 'Siswa' && {
        classId: user.assignments?.[0]?.idClass,
      }),
    };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(
        { ...payload, tokenType: 'refresh' },
        { secret: this.refreshSecret, expiresIn: '1d' },
      ),
    };
  }

  verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException({ 
          code: 'TOKEN_EXPIRED',
          message: 'Token sudah expired'
        });
      }
      throw new UnauthorizedException({ 
        code: 'TOKEN_INVALID',
        message: 'Token tidak valid'
      });
    }
  }
}
