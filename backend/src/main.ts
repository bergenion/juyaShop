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
  
  // CORS настройки: разрешаем запросы с фронтенда и отправку cookies
  const isProduction = process.env.NODE_ENV === 'production';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  app.enableCors({
    origin: (origin, callback) => {
      // В production разрешаем все origins (так как фронтенд может быть на любом домене/IP)
      if (isProduction) {
        callback(null, true);
        return;
      }
      
      // В dev режиме разрешаем только определенные origins
      // Разрешаем запросы без origin (например, из мобильных приложений) или с разрешенного origin
      if (!origin || origin === frontendUrl || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Важно: разрешаем отправку cookies
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
  });
  
  console.log(`🌐 CORS настроен: ${isProduction ? 'разрешены все origins (production)' : `разрешен ${frontendUrl} и localhost (dev)`}`);

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

