import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  Patch,
  Param,
  Put,
} from '@nestjs/common';
import { BankService } from './bank.service';
import { TeacherGuard } from '../../../common/guards/teacher.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMaterialDto } from './dto/create-material.dto';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QueryMaterialDto } from './dto/api-bank.dto';

@Controller('teacher/bank')
@UseGuards(TeacherGuard)
export class BankController {
  constructor(private readonly svc: BankService) {}
  
  @Get('materials')
  listMaterials(@Query() q: QueryMaterialDto) {
    return this.svc.listMaterials(q);
  }

  @Post('materials')
  createMaterial(@Body() dto: CreateMaterialDto) {
    return this.svc.createMaterial(dto);
  }

  @Put('materials/:id')
  updateMaterial(@Param('id') id: string, @Body() dto: UpdateMaterialDto) {
    return this.svc.updateMaterial(id, dto);
  }

  @Get('questions')
  listQuestions(@Query() q: QueryMaterialDto) {
    return this.svc.listQuestions(q);
  }

  @Post('questions')
  createQuestion(@Body() dto: CreateQuestionDto) {
    return this.svc.createQuestion(dto);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id') id: string, @Body() dto: UpdateQuestionDto) {
    return this.svc.updateQuestion(id, dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.svc.uploadDocument(file);
  }

  @Post('generate')
  generate(
    @Body() body: { jobId?: string; kind: 'materi' | 'soal'; topic: string },
  ) {
    return this.svc.triggerGenerate(body);
  }
}
