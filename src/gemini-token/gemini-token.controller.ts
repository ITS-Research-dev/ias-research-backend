import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { GeminiTokenService } from './gemini-token.service';
import { CountTokensDto } from './count-tokens.dto';

@Controller('api')
export class GeminiTokenController {
  constructor(private readonly geminiTokenService: GeminiTokenService) {}

  @Post('count-tokens')
  @UseInterceptors(FileInterceptor('document', { storage: memoryStorage() }))
  async countTokens(
    @UploadedFile() document: Express.Multer.File,
    @Body() body: CountTokensDto,
  ) {
    return this.geminiTokenService.countTokens(document, body.markdown);
  }
}
