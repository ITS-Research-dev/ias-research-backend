import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { StudyCaseService } from './study-case.service';
import { MateriService } from '../materi/materi.service';
import { SiswaAuth } from '../../../common/decorators/siswa-auth.decorator';
import { RunCodeDto } from './dto/run-code.dto';

@SiswaAuth()
@Controller('siswa/study-case')
export class StudyCaseController {
  constructor(
    private readonly studyCaseService: StudyCaseService,
    private readonly materiService: MateriService,
  ) { }

  @Get()
  async findAllMateri(@Req() req: any) {
    return this.materiService.getMateriByClass(req.user.classId);
  }

  @Get(':tId')
  async findByTopic(@Param('tId') topicId: string) {
    return this.studyCaseService.getCaseDetail(topicId);
  }

  @Get(':testId/:hintLevel')
  async getHint(@Param('testId') testId: string, @Param('hintLevel') hintLevel: number) {
    return this.studyCaseService.getHint(testId, hintLevel);
  }

  @Post('run')
  async runCode(@Body() dto: RunCodeDto) {
    return this.studyCaseService.runCode(dto.code);
  }

  // @Post('submission')
  // async submit(@Body() dto: CreateSubmissionDto, @Req() req: any) {
  //   return this.studyCaseService.submitCode(dto, req.user?.id);
  // }
}
