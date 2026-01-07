# Быстрый старт для продакшн деплоя

## Минимальные шаги для развертывания

### 1. Подготовка на сервере

```bash
# Убедитесь, что Docker установлен
docker --version
docker-compose --version
```

### 2. Копирование проекта на сервер

```bash
# Через Git
git clone <your-repo-url>
cd juyaShop

# Или через SCP
scp -r ./juyaShop user@server:/opt/
```

### 3. Создание .env файла

```bash
cd /opt/juyaShop  # или ваш путь
cp env.example .env
nano .env
```

Заполните `.env`:
```env
DATABASE_URL=postgresql://juyauser:password@192.168.3.124:5432/juyashop?schema=public
JWT_SECRET=$(openssl rand -base64 32)
PORT=3000
FRONTEND_URL=http://your-domain-or-ip
```

### 4. Сборка и запуск

```bash
# Сборка образов
docker-compose build

# Запуск контейнеров
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 5. Выполнение миграций

```bash
# Войдите в контейнер backend
docker exec -it juya-shop-backend sh

# Выполните миграции
npx prisma migrate deploy

# Выход
exit
```

### 6. Проверка

Откройте в браузере: `http://your-server-ip`

## Полезные команды

```bash
# Остановка
docker-compose down

# Перезапуск
docker-compose restart

# Обновление (после git pull)
docker-compose down
docker-compose build
docker-compose up -d

# Логи
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Решение проблем

**Контейнеры не запускаются:**
```bash
docker-compose logs
docker-compose ps
```

**Backend не подключается к БД:**
- Проверьте `DATABASE_URL` в `.env`
- Убедитесь, что БД доступна с сервера

**Изображения не загружаются:**
```bash
sudo chown -R 1001:1001 /opt/juyaShop/backend/uploads
sudo chmod -R 755 /opt/juyaShop/backend/uploads
```

Подробная инструкция: см. `DEPLOY_PRODUCTION.md`

