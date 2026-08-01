// progress.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  getAll() {
    return this.progressService.findAll();
  }

  @Get(':idUser/:idTopic')
  getOne(@Param('idUser') idUser: string, @Param('idTopic') idTopic: string) {
    return this.progressService.findOne(idUser, idTopic);
  }

  @Post()
  createOne(@Body() dto: CreateProgressDto) {
    return this.progressService.create(dto);
  }

  @Put(':idUser/:idTopic')
  updateOne(
    @Param('idUser') idUser: string,
    @Param('idTopic') idTopic: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.progressService.update(idUser, idTopic, dto);
  }

  @Delete(':idUser/:idTopic')
  deleteOne(@Param('idUser') idUser: string, @Param('idTopic') idTopic: string) {
    return this.progressService.remove(idUser, idTopic);
  }
}