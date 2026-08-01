import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ClassService } from './class.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';

@Controller('class')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Get()
  getAll() {
    return this.classService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.classService.findOne(id);
  }

  @Post()
  createOne(@Body() dto: CreateClassDto) {
    return this.classService.create(dto);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() dto: UpdateClassDto) {
    return this.classService.update(id, dto);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.classService.remove(id);
  }
}
