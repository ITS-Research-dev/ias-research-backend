import { Controller, Get, Post, Body, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { BankService } from './bank.service';
import { TeacherGuard } from '../../../common/guards/teacher.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateQuestionDto } from './dto/create-question.dto';

@Controller('teacher/bank')
@UseGuards(TeacherGuard)
export class BankController {
    constructor(private readonly svc: BankService) {}

    @Get('materials')
    listMaterials(@Query('q') q?: string) { return this.svc.listMaterials(q); }

    @Post('materials')
    createMaterial(@Body() dto: CreateMaterialDto) { return this.svc.createMaterial(dto); }

    @Get('questions')
    listQuestions(@Query('q') q?: string) { return this.svc.listQuestions(q); }

    @Post('questions')
    createQuestion(@Body() dto: CreateQuestionDto) { return this.svc.createQuestion(dto); }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    uploadFile(@UploadedFile() file: Express.Multer.File) { return this.svc.uploadDocument(file); }

    @Post('generate')
    generate(@Body() body: { jobId?: string; kind: 'materi'|'soal'; topic: string }) {
        return this.svc.triggerGenerate(body);
    }
}