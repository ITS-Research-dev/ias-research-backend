import { Module } from '@nestjs/common';
import { MateriController } from './materi/materi.controller';
import { ProfileController } from './profil-riwayat/profile.controller';
import { StudyCaseController } from './studi-kasus/study-case.controller';
import { MateriService } from './materi/materi.service';
import { ProfileService } from './profil-riwayat/profile.service';
import { StudyCaseService } from './studi-kasus/study-case.service';
import { TopicModule } from '../general/topic/topic.module';
import { UserModule } from '../general/user/user.module';
import { TestModule } from '../general/test/test.module';
import { ScoreModule } from '../general/score/score.module';
import { HintModule } from '../general/hint/hint.module';
import { ClassModule } from '../general/class/class.module';
import { RedisModule } from '../../src/redis/redis.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [
    TopicModule,
    UserModule,
    ClassModule,
    TestModule,
    ScoreModule,
    HintModule,
    RedisModule,
    QueueModule, // ADD THIS
  ],
  controllers: [MateriController, ProfileController, StudyCaseController],
  providers: [MateriService, ProfileService, StudyCaseService],
  exports: [MateriService, ProfileService, StudyCaseService, RedisModule, QueueModule],
})
export class StudentModule {}