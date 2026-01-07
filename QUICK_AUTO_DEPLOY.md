# Быстрый старт автодеплоя

## Вариант 1: GitHub Actions (Рекомендуется) - 5 шагов

### 1. На Windows сервере установите зависимости

```powershell
# Git
winget install --id Git.Git -e --source winget

# Docker Desktop
winget install --id Docker.DockerDesktop -e --source winget

# Перезагрузите сервер
```

### 2. Клонируйте проект

```powershell
cd C:\
git clone https://github.com/your-username/juyaShop.git juyaShop
cd juyaShop
Copy-Item env.example .env
notepad .env  # Заполните переменные
```

### 3. Установите GitHub Actions Runner

```powershell
cd C:\
New-Item -ItemType Directory -Path "actions-runner" -Force
cd actions-runner
Invoke-WebRequest -Uri "https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-win-x64-2.311.0.zip" -OutFile "actions-runner.zip"
Expand-Archive -Path actions-runner.zip -DestinationPath . -Force
.\config.cmd --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN
.\svc.cmd install
.\svc.cmd start
```

**Где взять токен:** GitHub → Settings → Actions → Runners → New self-hosted runner

### 4. Проверьте workflow файл

Убедитесь, что `.github/workflows/deploy.yml` существует и настроен правильно.

### 5. Протестируйте

```bash
# На локальной машине
git add .
git commit -m "Test auto-deploy"
git push origin main
```

Проверьте в GitHub → Actions, что деплой запустился.

---

## Вариант 2: Webhook сервер - 4 шага

### 1. На Windows сервере установите зависимости

```powershell
# Git, Docker (см. Вариант 1, шаг 1)
# Node.js
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

### 2. Клонируйте проект и настройте

```powershell
cd C:\
git clone https://github.com/your-username/juyaShop.git juyaShop
cd juyaShop
Copy-Item env.example .env
notepad .env
```

### 3. Запустите webhook сервер

```powershell
cd C:\juyaShop\scripts
npm install
node webhook-server.js
```

Или установите как службу Windows (см. `AUTO_DEPLOY_SETUP.md`).

### 4. Настройте webhook в GitHub

GitHub → Settings → Webhooks → Add webhook
- URL: `http://your-server-ip:3001/webhook`
- Secret: (сгенерируйте и укажите в .env)
- Events: Just the push event

---

## Проверка работы

```powershell
# Проверьте контейнеры
docker ps

# Проверьте логи
docker-compose logs -f

# Проверьте приложение
Start-Process "http://localhost"
```

Подробная инструкция: см. `AUTO_DEPLOY_SETUP.md`

