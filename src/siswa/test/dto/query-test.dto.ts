import { IsUUID, IsNotEmpty } from 'class-validator';

export class QueryTestDto {
    @IsUUID()
    @IsNotEmpty()
    idTopic!: string;
}
