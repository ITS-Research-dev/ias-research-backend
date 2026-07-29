import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>
    ) {}

    async findByUsername(username: string): Promise<User | null> {
        console.log("Username dicari:", username);

        const user = await this.usersRepository.findOne({
            where: {
                uCredentials: username,
            },
            relations: ['role'],
        });

        console.log("User ditemukan:", user);

        return user;
    }
}
