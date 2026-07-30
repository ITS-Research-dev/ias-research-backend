import { Injectable } from '@nestjs/common';
import { ProfileRepository } from './profile.repository';

@Injectable()
export class ProfileService {
    constructor(private readonly profileRepository: ProfileRepository) {}

    async getProfile(userId: string) {
        return this.profileRepository.findById(userId);
    }
}