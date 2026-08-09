import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RunCodeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  code: string;
}
