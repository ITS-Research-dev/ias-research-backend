import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { TestService } from './test.service';
import { CreateTestDto } from './dto/create-test.dto';
import { UpdateTestDto } from './dto/update-test.dto';

@Controller('test')
export class TestController {
  constructor(private readonly testService: TestService) {}

  @Get()
  getAll() {
    return this.testService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.testService.findOne(id);
  }

  @Post()
  createOne(@Body() dto: CreateTestDto) {
    return this.testService.create(dto);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() dto: UpdateTestDto) {
    return this.testService.update(id, dto);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.testService.remove(id);
  }
}
