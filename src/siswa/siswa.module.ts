import { Module } from '@nestjs/common';

// Controllers
import { MateriController } from './materi/materi.controller';
import { TestController } from './test/test.controller';
import { ScoreController } from './score/score.controller';
import { ProfileController } from './profile/profile.controller';

// Services
import { MateriService } from './materi/materi.service';
import { TestService } from './test/test.service';
import { ScoreService } from './score/score.service';
import { ProfileService } from './profile/profile.service';
import { OllamaService } from './test/ollama.service';

// Repositories
import { MateriRepository } from './materi/materi.repository';
import { TestRepository } from './test/test.repository';
import { ScoreRepository } from './score/score.repository';
import { ProfileRepository } from './profile/profile.repository';

@Module({
    controllers: [
        MateriController,
        TestController,
        ScoreController,
        ProfileController,
    ],
    providers: [
        MateriService,
        MateriRepository,
        TestService,
        TestRepository,
        OllamaService,
        ScoreService,
        ScoreRepository,
        ProfileService,
        ProfileRepository,
        // Inject Mock External Services (Redis, Chroma, AI)
        { provide: 'RedisService', useValue: {} },
        { provide: 'ChromaService', useValue: {} },
        { provide: 'AIService', useValue: {} },
    ],
})
export class SiswaModule {}