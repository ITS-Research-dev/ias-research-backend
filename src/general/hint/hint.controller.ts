import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { HintService } from './hint.service';
import { CreateHintDto } from './dto/create-hint.dto';
import { UpdateHintDto } from './dto/update-hint.dto';

@Controller('hint')
export class HintController {
  constructor(private readonly hintService: HintService) {}

  @Get()
  getAll() {
    return this.hintService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.hintService.findOne(id);
  }

  @Post()
  createOne(@Body() dto: CreateHintDto) {
    return this.hintService.create(dto);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() dto: UpdateHintDto) {
    return this.hintService.update(id, dto);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.hintService.remove(id);
  }
}
