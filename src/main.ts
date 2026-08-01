import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // Security headers
  app.use(helmet());
  app.use(compression());

  // Validasi input global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // buang field yang tidak ada di DTO
      forbidNonWhitelisted: true, // error kalau ada field asing (lebih strict)
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS - sebaiknya whitelist origin spesifik, bukan "*", terutama kalau credentials dipakai
  const corsOrigin = configService.get<string>('CORS_ORIGIN', '*');
  app.enableCors({
    origin: corsOrigin === '*' ? '*' : corsOrigin.split(','),
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // Graceful shutdown, penting untuk Docker/K8s
  app.enableShutdownHooks();

  await app.listen(port);
  Logger.log(`🚀 Aplikasi berjalan di: http://localhost:${port}/`, 'Bootstrap');
}
bootstrap();