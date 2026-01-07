import axios from 'axios';
import { tokenStorage } from '../utils/tokenStorage';

// Определяем URL API в зависимости от окружения
// В продакшне используем относительный путь (nginx проксирует на backend)
// В разработке используем localhost
const API_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://192.168.3.124:3000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Оставляем для совместимости с cookies
});

// Добавляем токен в заголовок Authorization для каждого запроса
api.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthMeRequest = error.config?.url?.includes('/auth/me');
    const isCartRequest = error.config?.url?.includes('/cart');
    const isAuthRequest = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    
    // Для запросов логина/регистрации не удаляем токен
    if (error.response?.status === 401 && isAuthRequest) {
      return Promise.reject(error);
    }
    
    // Для /auth/me 401 - это нормальная ситуация (пользователь не авторизован)
    // Удаляем токен, если он есть, но не делаем редирект
    if (error.response?.status === 401 && isAuthMeRequest) {
      tokenStorage.remove();
      return Promise.reject(error);
    }
    
    // Для запросов корзины с 401 не делаем редирект - пользователь может работать с локальной корзиной
    if (error.response?.status === 401 && isCartRequest) {
      return Promise.reject(error);
    }
    
    // Для других запросов с 401 удаляем токен (он истек или невалидный)
    if (error.response?.status === 401) {
      tokenStorage.remove();
    }
    
    // Не делаем автоматический редирект для других запросов
    // Пусть React Query или компоненты сами решают, что делать с ошибкой
    // Это предотвращает "слетание" авторизации при временных ошибках
    
    return Promise.reject(error);
  },
);

