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
  // В dev режиме и prod: рабочая директория должна содержать uploads
  // В Docker рабочая директория = /app, uploads монтируется в /app/uploads
  const uploadsPath = join(process.cwd(), 'uploads');
  
  console.log(`📁 Путь к загруженным файлам: ${uploadsPath}`);
  console.log(`📁 NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`📁 process.cwd(): ${process.cwd()}`);
  
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  
  console.log(`✅ Статические файлы настроены на: /uploads`);
  
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

