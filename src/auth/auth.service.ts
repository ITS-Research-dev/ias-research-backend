import {LoginDto} from './dto/login.dto';
import {UsersService} from '../users/users.service';
import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

@Injectable()
export class AuthService{

    constructor(
        private usersService:UsersService,
        private jwtService:JwtService
    ){}

    async login(dto:LoginDto){

        const user = await this.usersService.findByUsername(dto.username);

        if(!user){
            throw new UnauthorizedException(
                "Username salah"
            );
        }

        if(user.uPassword!==dto.password){
            throw new UnauthorizedException(
                "Password salah"
            );
        }

        const roleName = user.role?.description || 'Tidak ada role';

        const payload={
            sub:user.id,
            username:user.uCredentials,
            role: roleName,
        };

        const token=this.jwtService.sign(payload);
        return token;
    }
    logout(user: any) {
    return {
        message: `${user.username} berhasil logout`,
    };
    }
}