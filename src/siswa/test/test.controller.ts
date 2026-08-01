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
import { OllamaService } from './ollama.service';
import { QueryTestDto } from './dto/query-test.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { OllamaChatDto } from './dto/ollama-chat.dto';
import { AssessCodeDto } from './dto/assess-code.dto';

@Controller('siswa/test')
export class TestController {
    constructor(
        private readonly testService: TestService,
        private readonly ollamaService: OllamaService,
    ) { }

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

    // POST /siswa/test/ai/chat
    @Post('ai/chat')
    async chat(@Body() dto: OllamaChatDto) {
        const response = await this.ollamaService.generate(
            dto.prompt,
            dto.systemContext,
        );
        return { model: 'codellama', response };
    }

    // POST /siswa/test/ai/assess
    @Post('ai/assess')
    async assess(@Body() dto: AssessCodeDto) {
        return this.ollamaService.assessCode(
            dto.soal,
            dto.expectedOutput,
            dto.studentCode,
        );
    }
}