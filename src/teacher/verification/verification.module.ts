import { Module } from '@nestjs/common';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Score } from '../../general/score/entities/score.entity';
import { User } from '../../general/user/entities/user.entity';
import { Test } from '../../general/test/entities/test.entity';
import { RedisModule } from '../../redis/redis.module';

@Module({
    imports: [TypeOrmModule.forFeature([Score, User, Test]), RedisModule],
    controllers: [VerificationController],
    providers: [VerificationService],
    exports: [VerificationService],
})
export class VerificationModule {}