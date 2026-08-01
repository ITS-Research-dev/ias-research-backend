import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ClassAssignService } from './class-assign.service';
import { CreateClassAssignDto } from './dto/create-class-assign.dto';
import { UpdateClassAssignDto } from './dto/update-class-assign.dto';

@Controller('class-assign')
export class ClassAssignController {
  constructor(private readonly classAssignService: ClassAssignService) {}

  @Get()
  getAll() {
    return this.classAssignService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.classAssignService.findOne(id);
  }

  @Post()
  createOne(@Body() dto: CreateClassAssignDto) {
    return this.classAssignService.create(dto);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() dto: UpdateClassAssignDto) {
    return this.classAssignService.update(id, dto);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.classAssignService.remove(id);
  }
}
