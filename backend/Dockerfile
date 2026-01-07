# Многоэтапная сборка для оптимизации размера образа
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости
RUN npm ci

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

RUN npm ci --only=production && npx prisma generate

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Копируем entrypoint скрипт
COPY entrypoint.sh ./

# Устанавливаем wget для healthcheck и prisma для миграций
RUN apk add --no-cache wget

# Создаем директорию для загруженных файлов
RUN mkdir -p uploads/products

# Устанавливаем пользователя для безопасности
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app && \
    chmod +x entrypoint.sh

USER nestjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение через entrypoint
ENTRYPOINT ["./entrypoint.sh"]

