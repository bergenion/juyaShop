#!/bin/bash

# Скрипт для быстрого деплоя на сервер
# Использование: ./deploy.sh user@46.146.18.19

set -e

SERVER=$1
if [ -z "$SERVER" ]; then
    echo "Использование: ./deploy.sh user@your-server-ip"
    exit 1
fi

echo "🚀 Начинаем деплой на $SERVER"

# Создание директорий на сервере
ssh $SERVER "mkdir -p /var/www/juyashop/{backend,frontend,logs}"

# Копирование backend
echo "📦 Копирование backend..."
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.env' \
    backend/ $SERVER:/var/www/juyashop/backend/

# Копирование frontend
echo "📦 Копирование frontend..."
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.env' \
    frontend/ $SERVER:/var/www/juyashop/frontend/

# Выполнение команд на сервере
echo "🔨 Установка зависимостей и сборка на сервере..."
ssh $SERVER << 'ENDSSH'
cd /var/www/juyashop

# Backend
echo "📦 Backend: установка зависимостей..."
cd backend
npm install --production

echo "🔨 Backend: генерация Prisma Client..."
npx prisma generate

echo "🔨 Backend: сборка..."
npm run build

# Frontend
echo "📦 Frontend: установка зависимостей..."
cd ../frontend
npm install

echo "🔨 Frontend: сборка..."
npm run build

# Перезапуск PM2
echo "🔄 Перезапуск backend..."
cd ../backend
pm2 restart juyashop-backend || pm2 start ecosystem.config.js

# Перезагрузка Nginx
echo "🔄 Перезагрузка Nginx..."
sudo systemctl reload nginx

echo "✅ Деплой завершен!"
ENDSSH

echo "🎉 Готово! Проект задеплоен на $SERVER"

