import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

export interface ProfileUser {
    id: string;
    fullName: string;
    uCredentials: string;
    className: string;
}

@Injectable()
export class ProfileRepository {
    constructor(private readonly usersService: UsersService) {}

    async findById(id: string): Promise<ProfileUser> {
        const user = await this.usersService.findById(id);

        return {
            id: user.id,
            fullName: user.fullName,
            uCredentials: user.uCredentials,
            className: user.role?.description || 'Tidak ada kelas',
        };
    }
}
