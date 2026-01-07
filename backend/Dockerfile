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

# Создаем entrypoint скрипт прямо в образе
# Это гарантирует, что файл всегда будет создан с правильными line endings
RUN cat > /app/entrypoint.sh << 'EOF' && \
    chmod +x /app/entrypoint.sh
#!/bin/sh

# Выполняем миграции (они будут повторяться безопасно, если уже выполнены)
echo "Выполнение миграций базы данных..."
npx prisma migrate deploy || {
  echo "Предупреждение: Миграции не выполнены, возможно база данных еще не готова"
  echo "Приложение запустится, но миграции нужно выполнить вручную"
}

# Запускаем приложение
echo "Запуск приложения..."
exec node dist/main.js
EOF

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Устанавливаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Устанавливаем права на файлы и убеждаемся, что entrypoint.sh существует
RUN chown -R nestjs:nodejs /app && \
    ls -la /app/entrypoint.sh && \
    file /app/entrypoint.sh

USER nestjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение через entrypoint
ENTRYPOINT ["/app/entrypoint.sh"]

