import {
    Controller,
    Get,
    Post,
    Body,
    Query,
    Param,
    ParseIntPipe,
    Req,
} from '@nestjs/common';
import { TestService } from './test.service';
import { QueryTestDto } from './dto/query-test.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@Controller('siswa/test')
export class TestController {
    constructor(private readonly testService: TestService) {}

    @Get()
    async findByTopic(@Query() query: QueryTestDto) {
        return this.testService.getTestsByTopic(query);
    }

    @Get(':id/hint/:hintLevel')
    async getHint(
        @Param('id') id: string,
        @Param('hintLevel', ParseIntPipe) hintLevel: number,
    ) {
        return this.testService.getHint(id, hintLevel);
    }

    @Post('submission')
    async submit(@Body() dto: CreateSubmissionDto, @Req() req: any) {
        const userId = req.user?.id;
        return this.testService.submitCode(dto, userId);
    }
}