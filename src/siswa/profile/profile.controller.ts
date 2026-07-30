import { Controller, Get, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';

@Controller('siswa/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    async getProfile(@Req() req: any) {
        const userId = req.user?.id || 'uuid-1'; // Mock Auth Context
        return this.profileService.getProfile(userId);
    }
}