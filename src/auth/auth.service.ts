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

    // const isMatch = await bcrypt.compare(password, user.uPassword);
    // if (!isMatch) {
    //   throw new UnauthorizedException('Username atau password salah');
    // }

    const { uPassword: _, ...result } = user;
    return result;
  }

  async login(username: string, password: string) {
    const user = await this.validateUser(username, password);

    const payload = {
      sub: user.id,
      username: user.uCredentials,
      role: user.role.description,
      ...(user.role.description === 'Siswa' && {
        classId: user.assignments?.[0]?.idClass,
      }),
    };
    return {
      message: 'Login berhasil',
      access_token: this.jwtService.sign(payload),
      user: {
        name: user.fullName,
        role: user.role.description,
        ...(user.role.description === 'Guru' && {
          classId: user.assignments,
        }),
      },
    };
  }
}
