import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  private normalizeDatabaseUrl(url: string): string {
    try {
      // Проверяем, нет ли дублирования порта (например, :5432:5432)
      if (url.match(/:\d+:\d+/)) {
        this.logger.warn('⚠️ Обнаружено дублирование порта в DATABASE_URL, исправляю...');
        // Удаляем дублирующиеся порты
        url = url.replace(/:(\d+):\1/g, ':$1');
      }
      
      // Парсим URL для проверки формата
      const urlObj = new URL(url);
      
      // Проверяем, что порт указан только один раз
      if (urlObj.port && urlObj.hostname.includes(':')) {
        this.logger.warn('⚠️ Порт указан в hostname, исправляю...');
        // Извлекаем правильный хост и порт
        const parts = urlObj.hostname.split(':');
        urlObj.hostname = parts[0];
        if (parts[1] && !urlObj.port) {
          urlObj.port = parts[1];
        }
        url = urlObj.toString();
      }
      
      return url;
    } catch (error) {
      this.logger.warn('⚠️ Не удалось нормализовать DATABASE_URL, используем исходную');
      return url;
    }
  }

  async onModuleInit() {
    // Проверяем наличие DATABASE_URL
    let databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      this.logger.error('❌ DATABASE_URL не установлена в переменных окружения');
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Нормализуем URL (исправляем дублирование порта и другие проблемы)
    databaseUrl = this.normalizeDatabaseUrl(databaseUrl);
    
    // Устанавливаем нормализованный URL обратно в переменную окружения
    // для использования Prisma Client
    process.env.DATABASE_URL = databaseUrl;
    
    // Маскируем пароль в логах для безопасности
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ':****@');
    this.logger.log(`Подключение к базе данных: ${maskedUrl.split('@')[1] || 'URL скрыт'}`);
    
    try {
      await this.$connect();
      this.logger.log('✅ Подключение к базе данных установлено успешно');
    } catch (error) {
      this.logger.error('❌ Ошибка подключения к базе данных:', error);
      if (error instanceof Error && error.message.includes('invalid port number')) {
        this.logger.error('Проверьте формат DATABASE_URL. Пример: postgresql://user:password@host:5432/dbname?schema=public');
        this.logger.error(`Текущий DATABASE_URL (маскированный): ${maskedUrl}`);
      }
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Отключение от базы данных');
  }

  async checkConnection(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Ошибка проверки подключения:', error);
      return false;
    }
  }
}

