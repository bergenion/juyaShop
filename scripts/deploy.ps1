# Скрипт автоматического деплоя для Windows
# Используется GitHub Actions или webhook сервером

param(
    [string]$ProjectPath = "C:\juyaShop",
    [switch]$SkipPull = $false
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Автоматический деплой JuyaShop" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Переходим в директорию проекта
Set-Location $ProjectPath

# Обновляем код из Git (если не пропущено)
if (-not $SkipPull) {
    Write-Host "[1/5] Обновление кода из Git..." -ForegroundColor Yellow
    try {
        git pull origin main
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Ошибка при обновлении кода из Git" -ForegroundColor Red
            exit 1
        }
        Write-Host "Код успешно обновлен" -ForegroundColor Green
    } catch {
        Write-Host "Ошибка: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[1/5] Пропуск обновления кода (SkipPull)" -ForegroundColor Yellow
}

# Останавливаем контейнеры
Write-Host "[2/5] Остановка контейнеров..." -ForegroundColor Yellow
try {
    docker-compose down
    Write-Host "Контейнеры остановлены" -ForegroundColor Green
} catch {
    Write-Host "Ошибка при остановке контейнеров: $_" -ForegroundColor Red
    exit 1
}

# Пересобираем образы
Write-Host "[3/5] Пересборка Docker образов..." -ForegroundColor Yellow
Write-Host "Используется кэш для ускорения сборки. Для полной пересборки используйте: docker-compose build --no-cache" -ForegroundColor Gray
try {
    docker-compose build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Ошибка при сборке образов" -ForegroundColor Red
        exit 1
    }
    Write-Host "Образы успешно собраны" -ForegroundColor Green
} catch {
    Write-Host "Ошибка при сборке: $_" -ForegroundColor Red
    exit 1
}

# Запускаем контейнеры
Write-Host "[4/5] Запуск контейнеров..." -ForegroundColor Yellow
try {
    docker-compose up -d
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Ошибка при запуске контейнеров" -ForegroundColor Red
        exit 1
    }
    Write-Host "Контейнеры запущены" -ForegroundColor Green
} catch {
    Write-Host "Ошибка при запуске: $_" -ForegroundColor Red
    exit 1
}

# Выполняем миграции
Write-Host "[5/5] Выполнение миграций базы данных..." -ForegroundColor Yellow
Start-Sleep -Seconds 5  # Ждем запуска backend
try {
    docker exec juya-shop-backend npx prisma migrate deploy
    Write-Host "Миграции выполнены" -ForegroundColor Green
} catch {
    Write-Host "Предупреждение: Миграции не выполнены (возможно, уже выполнены)" -ForegroundColor Yellow
}

# Очистка старых образов
Write-Host "Очистка неиспользуемых образов..." -ForegroundColor Yellow
docker image prune -f | Out-Null

# Проверка работоспособности
Write-Host "Проверка работоспособности..." -ForegroundColor Yellow
Start-Sleep -Seconds 10
try {
    $response = Invoke-WebRequest -Uri "http://localhost/api/health" -UseBasicParsing -TimeoutSec 10
    if ($response.StatusCode -eq 200) {
        Write-Host "Проверка пройдена успешно!" -ForegroundColor Green
    } else {
        Write-Host "Предупреждение: Health check вернул код $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Предупреждение: Не удалось проверить health endpoint" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Деплой завершен успешно!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

