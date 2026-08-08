import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { SiswaAuth } from '../../../common/decorators/siswa-auth.decorator';

@SiswaAuth()
@Controller('siswa/profile')
export class ProfileController {
    constructor(private readonly profileService: ProfileService) {}

    @Get()
    async getProfile(@Req() req: any) {
        const userId = req.user.userId;
        return this.profileService.getProfile(userId);
    }

    @Get("/:id")
    async getProfileDetail(@Param('id') id: any) {
        return this.profileService.getProfileDetail(id);
    }
}
