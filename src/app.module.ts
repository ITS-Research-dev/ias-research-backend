import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { autoLoadModules } from '../common/utils/auto-load-modules.util';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'postgres'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'ias_db'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // BullMQ — server-side job queue (backed by Redis)
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const portRaw = configService.get<string | number>('REDIS_PORT', 6379);
        return {
          redis: {
            host: configService.get<string>('REDIS_HOST', 'localhost'),
            port: typeof portRaw === 'string' ? parseInt(portRaw, 10) : portRaw,
            password: configService.get<string>('REDIS_PASSWORD') || undefined,
            db: configService.get<number>('REDIS_DB', 0),
          },
        };
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 detik
        limit: 100, // max 100 request per menit per IP
      },
    ]),

    ...autoLoadModules(join(__dirname)),

  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // aktifkan rate limit secara global
    }
  ],
})
export class AppModule {}