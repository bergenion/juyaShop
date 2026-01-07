# Решение проблем при деплое

## Проблема: Долгая сборка (5+ минут)

### Причина
При первой сборке Docker загружает базовые образы и устанавливает все зависимости. Это нормально и занимает время:
- Загрузка базовых образов (node:20-alpine, nginx:alpine) - ~50-100 МБ
- Установка npm зависимостей для backend - ~2-3 минуты
- Установка npm зависимостей для frontend - ~2-3 минуты
- Сборка приложения - ~30 секунд

**Итого: 5-7 минут для первой сборки - это нормально!**

### Решение
1. **Последующие сборки будут быстрее** благодаря кэшированию Docker слоев
2. **Используйте `--no-cache` только при необходимости** (например, при изменении зависимостей)
3. **Проверьте интернет-соединение** - медленный интернет замедляет загрузку образов

### Ускорение сборки
```powershell
# Используйте кэш при сборке (по умолчанию)
docker-compose build

# Используйте --no-cache только если нужно пересобрать всё заново
docker-compose build --no-cache
```

---

## Проблема: "The DATABASE_URL variable is not set"

### Причина
Переменные окружения не передаются в docker-compose во время сборки. Это **не критично** - предупреждения появляются, но сборка продолжается.

### Решение

**Вариант 1: Использовать GitHub Secrets (рекомендуется)**

1. Перейдите в GitHub → Settings → Secrets and variables → Actions
2. Добавьте секреты:
   - `DATABASE_URL` - строка подключения к PostgreSQL
   - `JWT_SECRET` - секретный ключ для JWT
   - `FRONTEND_URL` - URL фронтенда (например, `http://your-domain.com`)

3. Workflow автоматически создаст `.env` файл из секретов

**Вариант 2: Создать .env файл вручную на сервере**

```powershell
# На Windows сервере
cd C:\juyaShop
Copy-Item env.example .env
notepad .env  # Заполните переменные
```

**Важно:** `.env` файл должен быть в корне проекта (там, где `docker-compose.yml`)

---

## Проблема: "the attribute `version` is obsolete"

### Решение
Уже исправлено! Атрибут `version` удален из `docker-compose.yml`. Это предупреждение больше не появится.

---

## Проблема: Контейнеры не запускаются после сборки

### Проверка

```powershell
# Проверьте статус контейнеров
docker ps -a

# Проверьте логи
docker-compose logs backend
docker-compose logs frontend

# Проверьте, что .env файл существует и заполнен
Get-Content .env
```

### Возможные причины

1. **Переменные окружения не установлены**
   ```powershell
   # Проверьте .env файл
   Get-Content .env
   ```

2. **База данных недоступна**
   ```powershell
   # Проверьте подключение к базе данных
   # Убедитесь, что DATABASE_URL правильный
   ```

3. **Порты заняты**
   ```powershell
   # Проверьте, не заняты ли порты 3000 и 80
   netstat -ano | findstr ":3000"
   netstat -ano | findstr ":80"
   ```

---

## Проблема: GitHub Actions не запускается

### Проверка

1. **Проверьте, что runner запущен**
   ```powershell
   # На Windows сервере
   cd C:\actions-runner
   .\svc.cmd status
   ```

2. **Проверьте логи runner**
   ```powershell
   Get-Content C:\actions-runner\_diag\Runner_*.log -Tail 50
   ```

3. **Проверьте, что вы пушите в правильную ветку**
   - Workflow настроен на ветку `main`
   - Если ваша основная ветка другая, измените в `.github/workflows/deploy.yml`

---

## Проблема: Миграции не выполняются

### Решение

```powershell
# Выполните миграции вручную
docker exec juya-shop-backend npx prisma migrate deploy

# Или через docker-compose
docker-compose exec backend npx prisma migrate deploy
```

---

## Проблема: Health check не проходит

### Проверка

```powershell
# Проверьте health endpoint вручную
Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing

# Проверьте логи backend
docker-compose logs backend -f
```

### Возможные причины

1. **Backend еще не запустился** - подождите 30-40 секунд
2. **База данных недоступна** - проверьте DATABASE_URL
3. **Порты не открыты** - проверьте файрвол

---

## Мониторинг деплоя

### Полезные команды

```powershell
# Просмотр логов в реальном времени
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f backend
docker-compose logs -f frontend

# Проверка использования ресурсов
docker stats

# Проверка статуса контейнеров
docker ps

# Проверка образов
docker images

# Очистка неиспользуемых образов
docker image prune -a -f
```

---

## Откат к предыдущей версии

### Если деплой прошел неудачно

```powershell
# Остановите контейнеры
docker-compose down

# Откатите код в Git
git reset --hard HEAD~1
git pull origin main

# Пересоберите и запустите
docker-compose build
docker-compose up -d
```

---

## Контакты и поддержка

Если проблема не решена:
1. Проверьте логи (см. раздел "Мониторинг деплоя")
2. Убедитесь, что все зависимости установлены
3. Проверьте права доступа
4. Проверьте настройки файрвола

