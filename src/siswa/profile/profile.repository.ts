import { Injectable, NotFoundException } from '@nestjs/common';

export interface ProfileUser {
    id: string;
    fullName: string;
    uCredentials: string;
    className: string;
}

@Injectable()
export class ProfileRepository {
    private users: ProfileUser[] = [
        {
        id: 'uuid-1',
        fullName: 'Budi',
        uCredentials: 'budi@email.com',
        className: 'RPL A',
        },
    ];

    async findById(id: string): Promise<ProfileUser> {
        const user = this.users.find((u) => u.id === id);
        if (!user) {
        throw new NotFoundException('Data Not Found');
        }
        return user;
    }
}
