# Быстрый старт

## Шаг 1: Установка зависимостей

```bash
npm run install:all
```

## Шаг 2: Настройка базы данных

1. Установите PostgreSQL и создайте базу данных
2. Скопируйте `.env.example` в `.env` в папке `backend`:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. Отредактируйте `.env` и укажите правильный `DATABASE_URL`
4. Запустите миграции:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```
5. Заполните базу тестовыми данными:
   ```bash
   npm run prisma:seed
   ```

## Шаг 3: Настройка Frontend

```bash
cd ../frontend
cp .env.example .env
```

Файл `.env` уже настроен правильно для локальной разработки.

## Шаг 4: Запуск

Из корневой директории:
```bash
npm run dev
```

Или отдельно:
- Backend: `cd backend && npm run start:dev`
- Frontend: `cd frontend && npm run dev`

## Тестовые аккаунты

После выполнения seed:
- **Админ**: `admin@example.com` / `admin123`
- **Пользователь**: `user@example.com` / `user123`

## Полезные команды

```bash
# Prisma Studio (визуальный редактор БД)
cd backend
npm run prisma:studio

# Создать новую миграцию
cd backend
npx prisma migrate dev --name migration_name
```

