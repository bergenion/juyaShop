# ⚡ Быстрый деплой на домашний сервер

## Краткая инструкция

### 1. Подготовка сервера (один раз)

```bash
# На сервере выполните:
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs postgresql postgresql-contrib nginx
sudo npm install -g pm2

# Настройка PostgreSQL
sudo -u postgres psql
CREATE DATABASE juyashop;
CREATE USER juyashop_user WITH PASSWORD 'ваш_пароль';
GRANT ALL PRIVILEGES ON DATABASE juyashop TO juyashop_user;
\q
```

### 2. Копирование проекта на сервер

```bash
# С вашего компьютера:
scp -r backend/ user@46.146.18.19:/var/www/juyashop/
scp -r frontend/ user@46.146.18.19:/var/www/juyashop/
```

### 3. Настройка Backend на сервере

```bash
ssh user@46.146.18.19
cd /var/www/juyashop/backend

# Создайте .env файл
nano .env
```

**Содержимое `.env`:**
```env
DATABASE_URL="postgresql://juyashop_user:ваш_пароль@localhost:5432/juyashop"
JWT_SECRET="ваш-секретный-ключ-минимум-32-символа"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production
FRONTEND_URL="http://46.146.18.19"
```

```bash
# Установка и сборка
npm install
npx prisma generate
npx prisma migrate deploy
npm run build

# Запуск через PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Выполните команду, которую выведет PM2
```

### 4. Настройка Frontend на сервере

```bash
cd /var/www/juyashop/frontend

# Создайте .env файл
nano .env
```

**Содержимое `.env`:**
```env
VITE_API_URL=http://46.146.18.19:3000/api
```

```bash
# Установка и сборка
npm install
npm run build
```

### 5. Настройка Nginx

```bash
sudo nano /etc/nginx/sites-available/juyashop
```

**Вставьте:**
```nginx
server {
    listen 80;
    server_name 46.146.18.19;

    root /var/www/juyashop/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cookie_path / /;
    }
}
```

```bash
# Активация
sudo ln -s /etc/nginx/sites-available/juyashop /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# Firewall
sudo ufw allow 80/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### 6. Готово! 🎉

Откройте в браузере: **http://46.146.18.19**

---

## Обновление проекта

```bash
# На сервере:
cd /var/www/juyashop

# Обновите файлы (git pull или scp)

# Backend
cd backend
npm install
npm run build
npx prisma migrate deploy
pm2 restart juyashop-backend

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

---

## Полезные команды

```bash
# PM2
pm2 status
pm2 logs juyashop-backend
pm2 restart juyashop-backend

# Nginx
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -d juyashop
```

---

Подробная инструкция в файле `DEPLOY.md`

