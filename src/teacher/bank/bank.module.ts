import { Module } from '@nestjs/common';
import { BankController } from './bank.controller';
import { BankService } from './bank.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Topic } from '../../general/topic/entities/topic.entity';
import { Test } from '../../general/test/entities/test.entity';
import { Hint } from '../../general/hint/entities/hint.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Topic, Test, Hint])],
    controllers: [BankController],
    providers: [BankService],
    exports: [BankService],
})
export class BankModule {}
