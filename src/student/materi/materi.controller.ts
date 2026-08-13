import { Controller, Get, Query, Param, UseGuards, Req } from '@nestjs/common';
import { MateriService } from './materi.service';
import { SiswaAuth } from '../../../common/decorators/siswa-auth.decorator';

@SiswaAuth()
@Controller('siswa/materi')
export class MateriController {
  constructor(private readonly materiService: MateriService) {}

  @Get()
  async findAll(@Req() req: any) {
    return this.materiService.getMateriByClass(req.user.classId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.materiService.getMateriDetail(id);
  }
}