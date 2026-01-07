# Многоэтапная сборка для оптимизации размера образа
# Используем Debian вместо Alpine для совместимости с Prisma и OpenSSL 1.1
FROM node:20-slim AS builder

# Устанавливаем зависимости для сборки Prisma
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

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
FROM node:20-slim AS production

# Устанавливаем рабочую директорию
WORKDIR /app

# Устанавливаем только production зависимости
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install --only=production && npx prisma generate

# Устанавливаем wget для healthcheck и openssl для Prisma
# В Debian OpenSSL 1.1 доступен по умолчанию
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget ca-certificates openssl && \
    rm -rf /var/lib/apt/lists/*

# Создаем директорию для загруженных файлов
RUN mkdir -p uploads/products

# Копируем собранное приложение из builder
COPY --from=builder /app/dist ./dist

# Устанавливаем пользователя для безопасности
RUN groupadd -r nodejs -g 1001 && \
    useradd -r -u 1001 -g nodejs nestjs

# Создаем entrypoint скрипт прямо в образе ПОСЛЕ всех копирований
# Это гарантирует, что файл всегда будет создан с правильными line endings
RUN printf '#!/bin/sh\necho "Запуск приложения..."\nexec node dist/src/main.js\n' > /app/entrypoint.sh

# Устанавливаем права на все файлы, включая entrypoint
# Проверяем, что dist/src/main.js существует (из-за rootDir: "src" в package.json)
RUN chmod +x /app/entrypoint.sh && \
    chown -R nestjs:nodejs /app && \
    ls -la /app/entrypoint.sh && \
    ls -la /app/dist/src/ && \
    test -f /app/dist/src/main.js && \
    echo "Entrypoint и main.js найдены успешно"

USER nestjs

# Открываем порт
EXPOSE 3000

# Запускаем приложение через entrypoint
# Используем sh для запуска, чтобы избежать проблем с интерпретатором
ENTRYPOINT ["/bin/sh", "/app/entrypoint.sh"]

