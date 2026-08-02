import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../general/user/user.repository';

@Injectable()
export class ProfileService {
    constructor(private readonly userRepository: UserRepository) {}

    async getProfile(userId: string) {
        return this.userRepository.findById(userId);
    }
}