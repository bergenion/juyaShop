# Многоэтапная сборка для оптимизации размера образа
FROM node:20-alpine AS builder

# Устанавливаем рабочую директорию
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
# Используем npm install для совместимости с npm workspaces
# npm ci требует валидный package-lock.json, который может отсутствовать
# в поддиректориях при использовании workspaces
RUN npm install

# Копируем исходный код
COPY . .

# Собираем приложение для продакшна
RUN npm run build

# Продакшн образ с nginx
FROM nginx:alpine AS production

# Копируем собранные файлы из builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Открываем порт
EXPOSE 80

# Запускаем nginx
CMD ["nginx", "-g", "daemon off;"]

