import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Загружаем переменные окружения из .env файла
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Проверяем, загружена ли переменная DATABASE_URL
if (!process.env.DATABASE_URL) {
  console.error('❌ Ошибка: переменная DATABASE_URL не найдена!');
  console.error(`💡 Проверьте файл .env по пути: ${envPath}`);
  console.error('💡 Убедитесь, что в файле есть строка:');
  console.error('   DATABASE_URL="postgresql://user:password@localhost:5432/database_name"');
  process.exit(1);
}

const prisma = new PrismaClient();

async function testConnection() {
  console.log('🔍 Проверка подключения к базе данных...\n');

  try {
    // Простая проверка подключения
    await prisma.$connect();
    console.log('✅ Подключение установлено успешно!\n');

    // Проверка версии PostgreSQL
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version() as version
    `;
    console.log('📊 Версия PostgreSQL:');
    console.log(versionResult[0].version);
    console.log('');

    // Проверка текущей базы данных
    const dbResult = await prisma.$queryRaw<Array<{ database: string; user: string }>>`
      SELECT current_database() as database, current_user as user
    `;
    console.log('🗄️  Текущая база данных:', dbResult[0].database);
    console.log('👤 Пользователь:', dbResult[0].user);
    console.log('');

    // Проверка существования таблиц
    const tablesResult = await prisma.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    
    if (tablesResult.length > 0) {
      console.log('📋 Найденные таблицы:');
      tablesResult.forEach((table) => {
        console.log(`   - ${table.tablename}`);
      });
    } else {
      console.log('⚠️  Таблицы не найдены. Возможно, нужно запустить миграции:');
      console.log('   npx prisma migrate dev');
    }

    console.log('\n✅ Все проверки пройдены успешно!');
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:');
    console.error(error);
    console.log('\n💡 Проверьте:');
    console.log('   1. Запущен ли PostgreSQL сервер');
    console.log('   2. Правильно ли настроен DATABASE_URL в .env файле');
    console.log('   3. Существует ли база данных');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

