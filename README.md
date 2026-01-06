# Juya Shop - Интернет-магазин

Интернет-магазин с современным стеком технологий. Создан на основе дизайна alfargave.ru.

## Технологии

### Frontend
- React + Redux Toolkit
- React Router
- React Query
- TypeScript
- Material-UI (MUI)

### Backend
- Node.js + NestJS
- JWT авторизация
- REST API
- Prisma ORM
- PostgreSQL

## Функционал

✅ Каталог товаров с фильтрами и сортировкой  
✅ Корзина (Redux)  
✅ Авторизация/регистрация  
✅ Личный кабинет  
✅ История заказов  
✅ Админ-панель (управление товарами и заказами)

## Установка

### 1. Установка зависимостей

```bash
# Установка всех зависимостей
npm run install:all
```

### 2. Настройка базы данных

Создайте базу данных PostgreSQL и настройте переменные окружения:

```bash
cd backend
cp .env.example .env
```

Отредактируйте `.env` файл:
```
DATABASE_URL="postgresql://user:password@localhost:5432/juyashop"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3000
```

Запустите миграции:
```bash
npx prisma migrate dev
npx prisma generate
```

Заполните базу тестовыми данными:
```bash
npm run prisma:seed
```

### 3. Настройка Frontend

```bash
cd ../frontend
cp .env.example .env
```

Отредактируйте `.env` файл:
```
VITE_API_URL=http://localhost:3000/api
```

### 4. Запуск

Из корневой директории:
```bash
npm run dev
```

Или отдельно:
```bash
# Backend
cd backend
npm run start:dev

# Frontend (в другом терминале)
cd frontend
npm run dev
```

## Тестовые аккаунты

После выполнения seed:
- **Администратор**: `admin@example.com` / `admin123`
- **Пользователь**: `user@example.com` / `user123`

## Структура проекта

```
juyaShop/
├── backend/          # NestJS backend
│   ├── src/
│   │   ├── auth/     # Авторизация
│   │   ├── users/     # Пользователи
│   │   ├── products/  # Товары
│   │   ├── cart/      # Корзина
│   │   ├── orders/    # Заказы
│   │   └── prisma/    # Prisma сервис
│   └── prisma/        # Prisma схемы и миграции
├── frontend/         # React frontend
│   └── src/
│       ├── api/      # API клиенты
│       ├── components/ # React компоненты
│       ├── pages/    # Страницы
│       ├── store/    # Redux store
│       └── theme/    # MUI тема
└── package.json      # Root package.json
```

## API Endpoints

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Получить текущего пользователя

### Товары
- `GET /api/products` - Список товаров (с фильтрами)
- `GET /api/products/:id` - Детали товара
- `GET /api/products/categories` - Список категорий
- `POST /api/products` - Создать товар (Admin)
- `PATCH /api/products/:id` - Обновить товар (Admin)
- `DELETE /api/products/:id` - Удалить товар (Admin)

### Корзина
- `GET /api/cart` - Получить корзину
- `POST /api/cart` - Добавить в корзину
- `PATCH /api/cart/:id` - Обновить количество
- `DELETE /api/cart/:id` - Удалить из корзины
- `DELETE /api/cart` - Очистить корзину

### Заказы
- `POST /api/orders` - Создать заказ
- `GET /api/orders` - Список заказов
- `GET /api/orders/:id` - Детали заказа
- `PATCH /api/orders/:id/status` - Обновить статус (Admin)

## Разработка

### Backend
```bash
cd backend
npm run start:dev      # Запуск в режиме разработки
npm run prisma:studio  # Открыть Prisma Studio
```

### Frontend
```bash
cd frontend
npm run dev            # Запуск dev сервера
npm run build          # Сборка для production
```

## Лицензия

MIT

