import { IsUUID, IsNotEmpty } from 'class-validator';

export class QueryMateriDto {
    @IsUUID()
    @IsNotEmpty()
    idClass!: string;
}
