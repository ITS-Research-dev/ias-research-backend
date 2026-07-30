import { Controller, Get, Query, Param, UseGuards, Req } from '@nestjs/common';
import { MateriService } from './materi.service';
import { QueryMateriDto } from './dto/query-materi.dto';

@Controller('siswa/materi')
export class MateriController {
    constructor(private readonly materiService: MateriService) {}

    @Get()
    async findAll(@Query() query: QueryMateriDto, @Req() req: any) {
        const userClassId = req.user?.classId;
        return this.materiService.getMateriByClass(query, userClassId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.materiService.getMateriDetail(id);
    }
}