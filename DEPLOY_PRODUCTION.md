# Инструкция по развертыванию на продакшн сервере

Это подробная инструкция по развертыванию интернет-магазина JuyaShop на продакшн сервере с использованием Docker.

## Предварительные требования

- Сервер с установленным Docker и Docker Compose
- PostgreSQL база данных (уже настроена)
- Доступ к серверу по SSH
- Домен или IP-адрес сервера (опционально)

## Шаг 1: Подготовка сервера

### 1.1 Установка Docker (если еще не установлен)

```bash
# Обновляем пакеты
sudo apt update

# Устанавливаем Docker
sudo apt install -y docker.io docker-compose

# Запускаем Docker
sudo systemctl start docker
sudo systemctl enable docker

# Добавляем текущего пользователя в группу docker (чтобы не использовать sudo)
sudo usermod -aG docker $USER

# Выходим и входим заново, чтобы изменения вступили в силу
```

### 1.2 Проверка установки

```bash
docker --version
docker-compose --version
```

## Шаг 2: Подготовка проекта на локальной машине

### 2.1 Клонирование/копирование проекта

Если проект в Git:
```bash
git clone <your-repo-url>
cd juyaShop
```

Или скопируйте проект на сервер через SCP:
```bash
scp -r /path/to/juyaShop user@server:/opt/juyaShop
```

### 2.2 Проверка структуры проекта

Убедитесь, что у вас есть следующие файлы:
- `docker-compose.yml` (в корне проекта)
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `.env.example`

## Шаг 3: Настройка переменных окружения

### 3.1 Создание .env файла

На сервере создайте файл `.env` в корне проекта:

```bash
cd /opt/juyaShop  # или путь к вашему проекту
cp .env.example .env
nano .env  # или используйте другой редактор
```

### 3.2 Заполнение .env файла

Отредактируйте `.env` файл со следующими значениями:

```env
# Database - замените на ваши реальные данные
DATABASE_URL=postgresql://juyauser:your_password@192.168.3.124:5432/juyashop?schema=public

# JWT Secret - сгенерируйте случайную строку (минимум 32 символа)
JWT_SECRET=your-very-long-and-random-secret-key-minimum-32-characters-long

# Backend Port (обычно 3000)
PORT=3000

# Frontend URL - замените на ваш домен или IP
FRONTEND_URL=http://your-domain.com
# Или если используете IP:
# FRONTEND_URL=http://192.168.3.124
```

**Важно:**
- `DATABASE_URL` - используйте реальные данные подключения к вашей PostgreSQL базе
- `JWT_SECRET` - сгенерируйте безопасную случайную строку. Можно использовать:
  ```bash
  openssl rand -base64 32
  ```
- `FRONTEND_URL` - URL, по которому будет доступен ваш сайт

## Шаг 4: Настройка базы данных

### 4.1 Проверка подключения к базе данных

Убедитесь, что база данных доступна с сервера:

```bash
# Проверьте подключение (замените на ваши данные)
psql -h 192.168.3.124 -U juyauser -d juyashop
```

### 4.2 Выполнение миграций

Миграции будут выполнены автоматически при первом запуске, но можно выполнить вручную:

```bash
# Войдите в контейнер backend
docker exec -it juya-shop-backend sh

# Выполните миграции
npx prisma migrate deploy

# Выход из контейнера
exit
```

## Шаг 5: Сборка и запуск контейнеров

### 5.1 Сборка образов

```bash
cd /opt/juyaShop  # путь к вашему проекту
docker-compose build
```

Это может занять несколько минут при первом запуске.

### 5.2 Запуск контейнеров

```bash
docker-compose up -d
```

Флаг `-d` запускает контейнеры в фоновом режиме (detached mode).

### 5.3 Проверка статуса

```bash
docker-compose ps
```

Вы должны увидеть два контейнера:
- `juya-shop-backend` - статус `Up`
- `juya-shop-frontend` - статус `Up`

### 5.4 Просмотр логов

```bash
# Все логи
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend
```

## Шаг 6: Проверка работы приложения

### 6.1 Проверка backend

```bash
curl http://localhost:3000/api/health
```

Должен вернуть статус 200.

### 6.2 Проверка frontend

Откройте в браузере:
- `http://your-server-ip` или
- `http://your-domain.com`

### 6.3 Проверка API

```bash
curl http://localhost:3000/api/products
```

## Шаг 7: Настройка файрвола (если используется)

Если на сервере включен файрвол, откройте необходимые порты:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp  # если используете HTTPS
sudo ufw allow 3000/tcp  # если нужен прямой доступ к backend

# Или для firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --reload
```

## Шаг 8: Настройка домена (опционально)

### 8.1 Настройка DNS

Настройте A-запись в DNS вашего домена, указывающую на IP-адрес сервера.

### 8.2 Обновление FRONTEND_URL

Обновите `FRONTEND_URL` в `.env` файле:

```env
FRONTEND_URL=https://your-domain.com
```

Перезапустите контейнеры:

```bash
docker-compose restart
```

## Шаг 9: Настройка HTTPS (рекомендуется)

### 9.1 Установка Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### 9.2 Получение SSL сертификата

```bash
sudo certbot certonly --standalone -d your-domain.com
```

### 9.3 Настройка nginx для HTTPS

Создайте файл `frontend/nginx-ssl.conf`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # Остальная конфигурация как в nginx.conf
    # ...
}
```

## Шаг 10: Создание администратора

### 10.1 Вход в контейнер backend

```bash
docker exec -it juya-shop-backend sh
```

### 10.2 Запуск seed скрипта (если есть)

```bash
npm run prisma:seed
```

Или создайте администратора вручную через Prisma Studio:

```bash
npx prisma studio
```

Откройте в браузере `http://localhost:5555` и создайте пользователя с ролью `ADMIN`.

## Шаг 11: Мониторинг и обслуживание

### 11.1 Просмотр логов

```bash
# Все логи
docker-compose logs -f

# Последние 100 строк
docker-compose logs --tail=100

# Логи за последний час
docker-compose logs --since 1h
```

### 11.2 Перезапуск контейнеров

```bash
# Перезапуск всех контейнеров
docker-compose restart

# Перезапуск конкретного контейнера
docker-compose restart backend
docker-compose restart frontend
```

### 11.3 Обновление приложения

```bash
# Остановка контейнеров
docker-compose down

# Обновление кода (если из Git)
git pull

# Пересборка образов
docker-compose build

# Запуск контейнеров
docker-compose up -d
```

### 11.4 Очистка неиспользуемых образов

```bash
docker system prune -a
```

## Шаг 12: Резервное копирование

### 12.1 Резервное копирование базы данных

Создайте скрипт `backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/juyaShop"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Резервная копия базы данных
pg_dump -h 192.168.3.124 -U juyauser -d juyashop > $BACKUP_DIR/db_backup_$DATE.sql

# Резервная копия загруженных файлов
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /opt/juyaShop/backend/uploads

# Удаление старых backup (старше 7 дней)
find $BACKUP_DIR -type f -mtime +7 -delete
```

Сделайте скрипт исполняемым:

```bash
chmod +x backup-db.sh
```

Настройте cron для автоматического резервного копирования:

```bash
crontab -e
```

Добавьте строку (резервное копирование каждый день в 2:00):

```
0 2 * * * /opt/juyaShop/backup-db.sh
```

## Решение проблем

### Проблема: Контейнеры не запускаются

```bash
# Проверьте логи
docker-compose logs

# Проверьте статус
docker-compose ps

# Проверьте использование портов
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :3000
```

### Проблема: Backend не подключается к базе данных

1. Проверьте `DATABASE_URL` в `.env`
2. Убедитесь, что база данных доступна с сервера
3. Проверьте файрвол и сетевые настройки

### Проблема: Изображения не загружаются

1. Проверьте права доступа к папке `uploads`:
   ```bash
   sudo chown -R 1001:1001 /opt/juyaShop/backend/uploads
   sudo chmod -R 755 /opt/juyaShop/backend/uploads
   ```

2. Проверьте, что папка существует:
   ```bash
   ls -la /opt/juyaShop/backend/uploads
   ```

### Проблема: CORS ошибки

Убедитесь, что `FRONTEND_URL` в `.env` соответствует реальному URL сайта.

## Полезные команды

```bash
# Остановка всех контейнеров
docker-compose down

# Остановка и удаление всех данных (осторожно!)
docker-compose down -v

# Пересборка без кэша
docker-compose build --no-cache

# Просмотр использования ресурсов
docker stats

# Вход в контейнер
docker exec -it juya-shop-backend sh
docker exec -it juya-shop-frontend sh
```

## Безопасность

1. **Никогда не коммитьте `.env` файл в Git**
2. **Используйте сильный JWT_SECRET**
3. **Настройте HTTPS для продакшна**
4. **Регулярно обновляйте Docker образы**
5. **Настройте файрвол**
6. **Используйте сильные пароли для базы данных**

## Поддержка

При возникновении проблем проверьте:
1. Логи контейнеров: `docker-compose logs`
2. Статус контейнеров: `docker-compose ps`
3. Подключение к базе данных
4. Настройки файрвола
5. Переменные окружения в `.env`

