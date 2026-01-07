# Настройка автоматического деплоя с GitHub на Windows сервер

Это подробная инструкция по настройке автоматического деплоя приложения при каждом push в GitHub.

## Варианты реализации

Есть два основных способа:

1. **GitHub Actions с Self-Hosted Runner** (рекомендуется) - более надежный и функциональный
2. **Webhook сервер** - более простой, но требует настройки вебхука в GitHub

Выберите один из вариантов ниже.

---

## Вариант 1: GitHub Actions с Self-Hosted Runner (Рекомендуется)

### Преимущества:
- ✅ Полная интеграция с GitHub
- ✅ Логи деплоя в GitHub UI
- ✅ Уведомления о статусе деплоя
- ✅ Возможность отката через GitHub

### Шаг 1: Подготовка Windows сервера

#### 1.1 Установка Git на Windows сервере

**Среда выполнения: Windows сервер (PowerShell от администратора)**

```powershell
# Скачайте и установите Git для Windows
# https://git-scm.com/download/win
# Или через winget (если доступен):
winget install --id Git.Git -e --source winget
```

#### 1.2 Установка Docker Desktop на Windows

**Среда выполнения: Windows сервер**

```powershell
# Скачайте Docker Desktop для Windows
# https://www.docker.com/products/docker-desktop/
# Или через winget:
winget install --id Docker.DockerDesktop -e --source winget
```

После установки перезагрузите сервер и убедитесь, что Docker запущен.

#### 1.3 Клонирование проекта на сервер

**Среда выполнения: Windows сервер (PowerShell)**

```powershell
# Создайте директорию для проекта
New-Item -ItemType Directory -Path "C:\juyaShop" -Force

# Перейдите в директорию
cd C:\juyaShop

# Клонируйте репозиторий (замените на ваш URL)
git clone https://github.com/your-username/juyaShop.git .

# Или если репозиторий уже существует, просто обновите
git pull origin main
```

#### 1.4 Создание .env файла

**Среда выполнения: Windows сервер (PowerShell)**

```powershell
cd C:\juyaShop

# Скопируйте пример файла
Copy-Item env.example .env

# Откройте файл для редактирования
notepad .env
```

Заполните `.env` файл (см. инструкцию в `DEPLOY_PRODUCTION.md`).

### Шаг 2: Установка GitHub Actions Runner

#### 2.1 Скачивание Runner

**Среда выполнения: Windows сервер (PowerShell от администратора)**

```powershell
# Создайте директорию для runner
New-Item -ItemType Directory -Path "C:\actions-runner" -Force
cd C:\actions-runner

# Скачайте последнюю версию runner для Windows
# Замените X.X.X на актуальную версию (проверьте на https://github.com/actions/runner/releases)
Invoke-WebRequest -Uri "https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip" -OutFile "actions-runner.zip"

# Распакуйте архив
Expand-Archive -Path actions-runner.zip -DestinationPath . -Force
```

#### 2.2 Настройка Runner

**Среда выполнения: Windows сервер (PowerShell от администратора)**

```powershell
cd C:\actions-runner

# Запустите конфигурацию
.\config.cmd --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
```

**Где взять токен:**
1. Перейдите в ваш GitHub репозиторий
2. Settings → Actions → Runners → New self-hosted runner
3. Скопируйте команду конфигурации (она содержит токен)

**Пример команды (замените на вашу):**
```powershell
.\config.cmd --url https://github.com/username/juyaShop --token AXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**При настройке укажите:**
- Runner name: `windows-production` (или любое другое имя)
- Labels: `windows`, `self-hosted` (можно оставить по умолчанию)
- Work folder: `_work` (по умолчанию)

#### 2.3 Установка Runner как службы Windows

**Среда выполнения: Windows сервер (PowerShell от администратора)**

```powershell
cd C:\actions-runner

# Установите runner как службу Windows
.\svc.cmd install

# Запустите службу
.\svc.cmd start

# Проверьте статус
.\svc.cmd status
```

#### 2.4 Проверка работы Runner

**Среда выполнения: GitHub (веб-интерфейс)**

1. Перейдите в ваш репозиторий на GitHub
2. Settings → Actions → Runners
3. Вы должны увидеть ваш runner в статусе "Idle" (ожидает заданий)

### Шаг 3: Настройка GitHub Actions Workflow

#### 3.1 Создание workflow файла

**Среда выполнения: Локальная машина (или через GitHub веб-интерфейс)**

Файл `.github/workflows/deploy.yml` уже создан в проекте. Проверьте, что он содержит правильные настройки:

```yaml
on:
  push:
    branches:
      - main  # Измените на вашу основную ветку, если отличается
```

#### 3.2 Настройка переменных окружения (опционально)

**Среда выполнения: GitHub (веб-интерфейс)**

Если вы хотите использовать секреты GitHub вместо .env файла:

1. Перейдите в Settings → Secrets and variables → Actions
2. Добавьте секреты:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `FRONTEND_URL`

Затем обновите `docker-compose.yml` для использования секретов.

### Шаг 4: Тестирование автодеплоя

**Среда выполнения: Локальная машина**

```bash
# Сделайте небольшое изменение в проекте
echo "# Test" >> README.md

# Закоммитьте и отправьте в GitHub
git add README.md
git commit -m "Test auto-deploy"
git push origin main
```

**Среда выполнения: GitHub (веб-интерфейс)**

1. Перейдите в Actions вкладку вашего репозитория
2. Вы должны увидеть запущенный workflow "Deploy to Production"
3. Нажмите на него, чтобы увидеть логи выполнения

**Среда выполнения: Windows сервер (PowerShell)**

```powershell
# Проверьте логи runner
Get-Content C:\actions-runner\_diag\Runner_*.log -Tail 50

# Проверьте статус контейнеров
docker ps

# Проверьте логи контейнеров
docker-compose logs -f
```

---

## Вариант 2: Webhook сервер (Альтернативный)

Этот вариант проще в настройке, но требует ручной настройки вебхука в GitHub.

### Шаг 1: Подготовка сервера

Выполните шаги 1.1-1.4 из Варианта 1.

### Шаг 2: Установка Node.js на Windows сервере

**Среда выполнения: Windows сервер (PowerShell от администратора)**

```powershell
# Скачайте и установите Node.js LTS
# https://nodejs.org/
# Или через winget:
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

Перезапустите PowerShell после установки.

### Шаг 3: Настройка Webhook сервера

**Среда выполнения: Windows сервер (PowerShell)**

```powershell
cd C:\juyaShop\scripts

# Установите зависимости (если нужно)
npm install

# Создайте файл .env для webhook сервера
@"
WEBHOOK_SECRET=your-very-secret-webhook-key-change-this
PROJECT_PATH=C:\juyaShop
"@ | Out-File -FilePath ".env" -Encoding utf8
```

**Важно:** Сгенерируйте безопасный секрет:
```powershell
# Генерация случайного секрета
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Шаг 4: Установка Webhook сервера как службы Windows

**Среда выполнения: Windows сервер (PowerShell от администратора)**

#### 4.1 Установка NSSM (Non-Sucking Service Manager)

```powershell
# Скачайте NSSM
Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile "$env:TEMP\nssm.zip"
Expand-Archive -Path "$env:TEMP\nssm.zip" -DestinationPath "$env:TEMP\nssm" -Force

# Скопируйте nssm.exe в системную папку
Copy-Item "$env:TEMP\nssm\nssm-2.24\win64\nssm.exe" -Destination "C:\Windows\nssm.exe"
```

#### 4.2 Создание службы

```powershell
# Установите webhook сервер как службу
C:\Windows\nssm.exe install JuyaShopWebhook "C:\Program Files\nodejs\node.exe" "C:\juyaShop\scripts\webhook-server.js"

# Установите рабочую директорию
C:\Windows\nssm.exe set JuyaShopWebhook AppDirectory "C:\juyaShop\scripts"

# Установите переменные окружения
C:\Windows\nssm.exe set JuyaShopWebhook AppEnvironmentExtra "WEBHOOK_SECRET=your-secret-here" "PROJECT_PATH=C:\juyaShop"

# Запустите службу
C:\Windows\nssm.exe start JuyaShopWebhook

# Проверьте статус
C:\Windows\nssm.exe status JuyaShopWebhook
```

### Шаг 5: Настройка вебхука в GitHub

**Среда выполнения: GitHub (веб-интерфейс)**

1. Перейдите в ваш репозиторий
2. Settings → Webhooks → Add webhook
3. Заполните форму:
   - **Payload URL**: `http://your-server-ip:3001/webhook` (или домен, если есть)
   - **Content type**: `application/json`
   - **Secret**: тот же секрет, что в `.env` файле webhook сервера
   - **Which events**: выберите "Just the push event"
   - **Active**: отмечено
4. Нажмите "Add webhook"

### Шаг 6: Настройка файрвола

**Среда выполнения: Windows сервер (PowerShell от администратора)**

```powershell
# Откройте порт 3001 для webhook сервера
New-NetFirewallRule -DisplayName "JuyaShop Webhook" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

### Шаг 7: Тестирование

**Среда выполнения: Локальная машина**

```bash
# Сделайте изменение и отправьте в GitHub
git add .
git commit -m "Test webhook deploy"
git push origin main
```

**Среда выполнения: Windows сервер (PowerShell)**

```powershell
# Проверьте логи webhook сервера
Get-Content "C:\Program Files\nssm\service\JuyaShopWebhook\service.log" -Tail 50

# Или через Event Viewer
eventvwr.msc
# Windows Logs → Application → найдите записи от Node.js
```

---

## Общие шаги для обоих вариантов

### Настройка прав доступа

**Среда выполнения: Windows сервер (PowerShell от администратора)**

```powershell
# Убедитесь, что служба имеет права на выполнение Docker команд
# Если используется служба, она должна работать от имени пользователя с правами Docker

# Добавьте пользователя службы в группу docker-users (если нужно)
# Это обычно делается автоматически при установке Docker Desktop
```

### Мониторинг и логирование

**Среда выполнения: Windows сервер (PowerShell)**

```powershell
# Просмотр логов деплоя (GitHub Actions)
Get-Content C:\actions-runner\_diag\Runner_*.log -Tail 100

# Просмотр логов Docker контейнеров
docker-compose logs -f

# Просмотр статуса контейнеров
docker ps

# Просмотр использования ресурсов
docker stats
```

### Ручной запуск деплоя

**Среда выполнения: Windows сервер (PowerShell)**

```powershell
cd C:\juyaShop
.\scripts\deploy.ps1
```

---

## Решение проблем

### Проблема: Runner не запускается

**Решение:**
```powershell
# Проверьте статус службы
Get-Service actions.runner.*

# Перезапустите службу
.\svc.cmd stop
.\svc.cmd start

# Проверьте логи
Get-Content C:\actions-runner\_diag\Runner_*.log -Tail 50
```

### Проблема: Docker команды не выполняются

**Решение:**
```powershell
# Убедитесь, что Docker Desktop запущен
Get-Process "Docker Desktop"

# Проверьте права пользователя
docker ps  # Должно работать без ошибок

# Если не работает, добавьте пользователя в группу docker-users
```

### Проблема: Webhook не получает запросы

**Решение:**
1. Проверьте, что порт 3001 открыт в файрволе
2. Проверьте, что webhook сервер запущен:
   ```powershell
   Get-Service JuyaShopWebhook
   ```
3. Проверьте логи в GitHub (Settings → Webhooks → ваш webhook → Recent Deliveries)

### Проблема: Деплой не выполняется автоматически

**Решение:**
1. Проверьте, что workflow файл находится в `.github/workflows/deploy.yml`
2. Проверьте, что вы пушите в правильную ветку (main)
3. Проверьте логи runner или webhook сервера

---

## Безопасность

1. **Никогда не коммитьте `.env` файл** - он должен быть в `.gitignore`
2. **Используйте сильные секреты** для webhook
3. **Ограничьте доступ к порту webhook** только с IP GitHub (если возможно)
4. **Регулярно обновляйте** GitHub Actions Runner
5. **Используйте HTTPS** для webhook (настройте reverse proxy с SSL)

---

## Дополнительные улучшения

### Настройка уведомлений

Можно добавить уведомления в Telegram/Discord/Slack при успешном/неуспешном деплое через GitHub Actions.

### Откат изменений

Можно добавить workflow для отката к предыдущей версии через GitHub Actions.

### Мониторинг

Настройте мониторинг здоровья приложения и автоматические алерты.

---

## Полезные команды

```powershell
# Перезапуск runner (GitHub Actions)
cd C:\actions-runner
.\svc.cmd restart

# Перезапуск webhook сервера
Restart-Service JuyaShopWebhook

# Просмотр всех логов
docker-compose logs --tail=100

# Очистка старых образов
docker image prune -a -f

# Проверка здоровья приложения
Invoke-WebRequest -Uri "http://localhost/api/health"
```

---

## Поддержка

При возникновении проблем:
1. Проверьте логи (см. раздел "Мониторинг и логирование")
2. Убедитесь, что все зависимости установлены
3. Проверьте права доступа
4. Проверьте настройки файрвола

