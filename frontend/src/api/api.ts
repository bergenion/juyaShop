import axios from 'axios';

// Определяем URL API в зависимости от окружения
// В продакшне используем относительный путь (nginx проксирует на backend)
// В разработке используем localhost
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Важно для отправки cookies
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthMeRequest = error.config?.url?.includes('/auth/me');
    
    // Для /auth/me 401 - это нормальная ситуация (пользователь не авторизован)
    // Не логируем ошибку в консоль и не делаем редирект
    if (error.response?.status === 401 && isAuthMeRequest) {
      // Просто возвращаем ошибку, но она будет обработана в authApi.getMe
      return Promise.reject(error);
    }
    
    // Для других запросов с 401 делаем редирект
    if (error.response?.status === 401 && !isAuthMeRequest) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  },
);

