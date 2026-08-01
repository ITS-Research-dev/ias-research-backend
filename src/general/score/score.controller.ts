import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ScoreService } from './score.service';

@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get()
  getAll() {
    return this.scoreService.findAll();
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.scoreService.findOne(id);
  }

  @Post()
  createOne(@Body() dto: CreateScoreDto) {
    return this.scoreService.create(dto);
  }

  @Put(':id')
  updateOne(@Param('id') id: string, @Body() dto: UpdateScoreDto) {
    return this.scoreService.update(id, dto);
  }

  @Delete(':id')
  deleteOne(@Param('id') id: string) {
    return this.scoreService.remove(id);
  }
}
