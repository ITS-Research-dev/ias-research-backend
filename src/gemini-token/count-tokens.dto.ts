import { IsOptional, IsString } from 'class-validator';

export class CountTokensDto {
  @IsOptional()
  @IsString()
  model?: string;
}
