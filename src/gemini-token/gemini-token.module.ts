import { Module } from '@nestjs/common';
import { GeminiTokenController } from './gemini-token.controller';
import { GeminiTokenService } from './gemini-token.service';

@Module({
  controllers: [GeminiTokenController],
  providers: [GeminiTokenService],
})
export class GeminiTokenModule {}
