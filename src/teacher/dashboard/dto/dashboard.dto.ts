import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class QueryDashboardDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  classId: string;
}