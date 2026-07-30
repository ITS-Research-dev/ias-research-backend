import { IsUUID, IsNotEmpty } from 'class-validator';

export class QueryScoreDto {
    @IsUUID()
    @IsNotEmpty()
    userId!: string;
}
