import { Module } from '@nestjs/common';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Material } from './entities/material.entity';
import { Question } from './entities/question.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Material, Question])],
    controllers: [BankController],
    providers: [BankService],
    exports: [BankService],
})
export class BankModule {}