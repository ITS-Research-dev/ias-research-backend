import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../general/user/entities/user.entity';
import { ClassAssign } from '../general/class-assign/entities/class-assign.entity';
import { Class } from '../general/class/entities/class.entity';
import { Test } from '../general/test/entities/test.entity';
import { Score } from '../general/score/entities/score.entity';
import { Topic } from '../general/topic/entities/topic.entity';
import { Progress } from '../general/progress/entities/progress.entity';
import { QaController } from './qa.controller';
import { QaService } from './qa.service';

@Module({
    imports: [TypeOrmModule.forFeature([
      User, ClassAssign, Class, Test, Score, Topic, Progress,
    ])],
    controllers: [QaController],
    providers: [QaService],
    exports: [QaService],
})
export class BankModule {}