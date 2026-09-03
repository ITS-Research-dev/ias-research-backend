import { Body, Controller, Get, Param, Post, Query, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { StudyCaseService } from './study-case.service';
import { MateriService } from '../materi/materi.service';
import { QueueService } from '../../queue/queue.service';
import { SiswaAuth } from '../../../common/decorators/siswa-auth.decorator';
import { RunCodeDto } from './dto/run-code.dto';
import { SubmitTestDto } from '../../queue/dto/submit-test.dto';

@SiswaAuth()
@Controller('siswa/study-case')
export class StudyCaseController {
  constructor(
    private readonly studyCaseService: StudyCaseService,
    private readonly materiService: MateriService,
    private readonly queueService: QueueService,
  ) {}

  @Get()
  async findAllMateri(@Req() req: any) {
    return this.materiService.getMateriByClass(req.user.classId);
  }

  @Get(':tId')
  async findByTopic(@Param('tId') topicId: string, @Req() req: any) {
    return this.studyCaseService.getCaseDetail(topicId, req.user?.id);
  }


  @Get(':testId/:hintLevel')
  async getHint(@Param('testId') testId: string, @Param('hintLevel') hintLevel: number) {
    return this.studyCaseService.getHint(testId, hintLevel);
  }

  @Post('run')
  async runCode(@Body() dto: RunCodeDto) {
    return this.studyCaseService.runCode(dto.code, dto.stdin);
  }

  /**
   * Submit code untuk diproses dengan queue system
   * POST /siswa/study-case/submit
   */
  @Post('submit')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitCode(@Body() dto: SubmitTestDto, @Req() req: any) {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('User ID not found');
    }

    return this.queueService.submitRequest(
      userId,
      dto.testId,
      dto.code,
      5, // Default priority
    );
  }

  /**
   * Check status submission
   * GET /siswa/study-case/submission/:requestId
   */
  @Get('submission/:requestId')
  async checkSubmissionStatus(@Param('requestId') requestId: string) {
    return this.queueService.getRequestStatus(requestId);
  }
}