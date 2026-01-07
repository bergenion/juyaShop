# Многоэтапная сборка для оптимизации размера образа
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
# Используем npm ci для более быстрой и надежной установки
# Если package-lock.json отсутствует, используем npm install
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Копируем исходный код
COPY . .

# Генерируем Prisma Client
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Продакшн образ
FROM node:20-alpine AS production

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем только production зависимости
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production && npx prisma generate

# Устанавливаем wget для healthcheck
RUN apk add --no-cache wget

# Создаем директорию для загруженных файлов
RUN mkdir -p uploads/products

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Устанавливаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Создаем entrypoint скрипт прямо в образе ПОСЛЕ всех копирований
# Это гарантирует, что файл всегда будет создан с правильными line endings
RUN cat > /app/entrypoint.sh << 'ENDOFFILE'
#!/bin/sh
set -e

echo "Запуск приложения..."
exec node dist/main.js
ENDOFFILE

# Устанавливаем права на все файлы, включая entrypoint
# Проверяем, что dist/main.js существует
RUN chmod +x /app/entrypoint.sh && \
    chown -R nestjs:nodejs /app && \
    ls -la /app/entrypoint.sh && \
    ls -la /app/dist/ && \
    test -f /app/dist/main.js && \
    echo "Entrypoint и main.js найдены успешно"

USER nestjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение через entrypoint
# Используем sh для запуска, чтобы избежать проблем с интерпретатором
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]

