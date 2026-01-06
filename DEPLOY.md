# 🚀 Инструкция по деплою на домашний сервер

## Подготовка сервера

### 1. Установка необходимого ПО

```bash
# Обновление системы (Ubuntu/Debian)
sudo apt update && sudo apt upgrade -y

# Установка Node.js (версия 18 или выше)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Установка PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Установка PM2 для управления процессами
sudo npm install -g pm2

# Установка Nginx (для фронтенда)
sudo apt install -y nginx
```

### 2. Настройка PostgreSQL

```bash
# Переключение на пользователя postgres
sudo -u postgres psql

# В консоли PostgreSQL:
CREATE DATABASE juyashop;
CREATE USER juyashop_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE juyashop TO juyashop_user;
\q
```

---

## Деплой Backend

### 1. Клонирование/копирование проекта

```bash
# Создайте директорию для проекта
mkdir -p /var/www/juyashop
cd /var/www/juyashop

# Скопируйте проект (через git, scp, или rsync)
# Например, если у вас есть git репозиторий:
git clone <your-repo-url> .

# Или скопируйте файлы через scp с локальной машины:
# scp -r backend/ user@46.146.18.19:/var/www/juyashop/
```

### 2. Настройка Backend

```bash
cd /var/www/juyashop/backend

# Установка зависимостей
npm install

# Создание .env файла
nano .env
```

**Содержимое `.env` файла:**
```env
DATABASE_URL="postgresql://juyashop_user:your_secure_password@localhost:5432/juyashop"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production
FRONTEND_URL="http://46.146.18.19"
```

### 3. Настройка базы данных

```bash
cd /var/www/juyashop/backend

# Генерация Prisma Client
npx prisma generate

# Запуск миграций
npx prisma migrate deploy

# Заполнение тестовыми данными (опционально)
npm run prisma:seed
```

### 4. Сборка Backend

```bash
cd /var/www/juyashop/backend

# Сборка проекта
npm run build
```

### 5. Запуск Backend через PM2

```bash
cd /var/www/juyashop/backend

# Создание PM2 конфигурации
nano ecosystem.config.js
```

**Содержимое `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [{
    name: 'juyashop-backend',
    script: 'dist/main.js',
    cwd: '/var/www/juyashop/backend',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/juyashop/backend-error.log',
    out_file: '/var/log/juyashop/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G'
  }]
};
```

```bash
# Создание директории для логов
sudo mkdir -p /var/log/juyashop
sudo chown $USER:$USER /var/log/juyashop

# Запуск через PM2
pm2 start ecosystem.config.js

# Сохранение конфигурации PM2
pm2 save

# Настройка автозапуска при перезагрузке
pm2 startup
# Выполните команду, которую выведет PM2
```

---

## Деплой Frontend

### 1. Настройка Frontend

```bash
cd /var/www/juyashop/frontend

# Установка зависимостей
npm install

# Создание .env файла
nano .env
```

**Содержимое `.env` файла:**
```env
VITE_API_URL=http://46.146.18.19:3000/api
```

### 2. Сборка Frontend

```bash
cd /var/www/juyashop/frontend

# Сборка для production
npm run build
```

После сборки файлы будут в папке `dist/`

### 3. Настройка Nginx

```bash
# Создание конфигурации Nginx
sudo nano /etc/nginx/sites-available/juyashop
```

**Содержимое конфигурации:**
```nginx
server {
    listen 80;
    server_name 46.146.18.19;  # или ваш домен

    # Frontend (статичные файлы)
    root /var/www/juyashop/frontend/dist;
    index index.html;

    # Логирование
    access_log /var/log/nginx/juyashop-access.log;
    error_log /var/log/nginx/juyashop-error.log;

    # Основные файлы
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Проксирование API запросов на backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Важно для cookies
        proxy_cookie_path / /;
    }

    # Кеширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Активация конфигурации
sudo ln -s /etc/nginx/sites-available/juyashop /etc/nginx/sites-enabled/

# Удаление дефолтной конфигурации (опционально)
sudo rm /etc/nginx/sites-enabled/default

# Проверка конфигурации
sudo nginx -t

# Перезагрузка Nginx
sudo systemctl reload nginx
```

---

## Настройка Firewall

```bash
# Разрешение портов
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS (если будете использовать SSL)
sudo ufw enable
```

---

## Проверка работы

### Проверка Backend:
```bash
# Проверка статуса PM2
pm2 status

# Просмотр логов
pm2 logs juyashop-backend

# Проверка API
curl http://localhost:3000/api/health
```

### Проверка Frontend:
```bash
# Проверка Nginx
sudo systemctl status nginx

# Проверка в браузере
# Откройте: http://46.146.18.19
```

---

## Полезные команды

### PM2 команды:
```bash
pm2 status              # Статус процессов
pm2 logs                # Логи всех процессов
pm2 logs juyashop-backend  # Логи конкретного процесса
pm2 restart juyashop-backend  # Перезапуск
pm2 stop juyashop-backend     # Остановка
pm2 delete juyashop-backend   # Удаление из PM2
pm2 monit               # Мониторинг в реальном времени
```

### Обновление проекта:
```bash
# 1. Остановить backend
pm2 stop juyashop-backend

# 2. Обновить код (git pull или копирование файлов)
cd /var/www/juyashop
git pull  # или скопируйте новые файлы

# 3. Backend
cd backend
npm install
npm run build
npx prisma migrate deploy  # если были изменения в БД
npx prisma generate

# 4. Frontend
cd ../frontend
npm install
npm run build

# 5. Запустить backend
pm2 restart juyashop-backend

# 6. Перезагрузить Nginx
sudo systemctl reload nginx
```

---

## Настройка SSL (HTTPS) - опционально

### Через Let's Encrypt (Certbot):

```bash
# Установка Certbot
sudo apt install -y certbot python3-certbot-nginx

# Получение сертификата (замените на ваш домен или IP)
sudo certbot --nginx -d yourdomain.com

# Автоматическое обновление
sudo certbot renew --dry-run
```

---

## Резервное копирование базы данных

```bash
# Создание бэкапа
pg_dump -U juyashop_user -d juyashop > backup_$(date +%Y%m%d).sql

# Восстановление из бэкапа
psql -U juyashop_user -d juyashop < backup_20240101.sql
```

---

## Мониторинг

### Установка мониторинга PM2:
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Возможные проблемы

### Backend не запускается:
```bash
# Проверьте логи
pm2 logs juyashop-backend

# Проверьте, что порт 3000 свободен
sudo netstat -tulpn | grep 3000

# Проверьте .env файл
cat /var/www/juyashop/backend/.env
```

### Frontend не открывается:
```bash
# Проверьте Nginx
sudo nginx -t
sudo systemctl status nginx

# Проверьте права доступа
sudo chown -R www-data:www-data /var/www/juyashop/frontend/dist
```

### База данных не подключается:
```bash
# Проверьте подключение
psql -U juyashop_user -d juyashop -h localhost

# Проверьте, что PostgreSQL запущен
sudo systemctl status postgresql
```

---

## Структура файлов на сервере

```
/var/www/juyashop/
├── backend/
│   ├── dist/              # Собранный backend
│   ├── prisma/
│   ├── src/
│   ├── .env
│   ├── ecosystem.config.js
│   └── package.json
├── frontend/
│   ├── dist/              # Собранный frontend (отдается через Nginx)
│   ├── src/
│   └── package.json
└── logs/                  # Логи (опционально)
```

---

## Готово! 🎉

Ваш проект должен быть доступен по адресу:
- Frontend: http://46.146.18.19
- Backend API: http://46.146.18.19/api

