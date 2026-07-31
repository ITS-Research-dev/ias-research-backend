import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('siswa/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    async getProfile(@Req() req: any) {
        const userId = req.user.id;
        return this.profileService.getProfile(userId);
    }
}
