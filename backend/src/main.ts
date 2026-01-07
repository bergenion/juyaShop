import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  app.use(cookieParser());
  
  // Настройка статической раздачи файлов
  // В dev режиме __dirname = backend/src, в prod = backend/dist
  const uploadsPath = process.env.NODE_ENV === 'production' 
    ? join(__dirname, '..', 'uploads')
    : join(process.cwd(), 'uploads');
  
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  });

  app.setGlobalPrefix('api');
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Backend запущен на http://localhost:${port}`);
}

bootstrap();

