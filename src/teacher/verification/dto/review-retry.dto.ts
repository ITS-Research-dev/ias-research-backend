import {  IsDate, IsObject } from 'class-validator';

export class ReviewRetryDto {
    @IsObject()
    @IsDate()
    retryDeadline: Date;
}