import { api } from './api';
import { tokenStorage } from '../utils/tokenStorage';

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: 'USER' | 'ADMIN';
}

export interface AuthResponse {
  user: User;
  token?: string; // Токен может быть в ответе
}

export const authApi = {
  register: async (data: RegisterData): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    // Сохраняем токен из cookies или из ответа
    // Backend устанавливает cookie, но также может вернуть токен в ответе
    if (response.data.token) {
      tokenStorage.set(response.data.token);
    }
    return response.data;
  },
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    // Сохраняем токен из cookies или из ответа
    if (response.data.token) {
      tokenStorage.set(response.data.token);
    }
    return response.data;
  },
  getMe: async (): Promise<User | null> => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error: any) {
      // 401 - это нормальная ситуация, когда пользователь не авторизован
      // Не пробрасываем ошибку дальше, возвращаем null
      if (error.response?.status === 401) {
        return null;
      }
      // Для других ошибок пробрасываем дальше
      throw error;
    }
  },
  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      // Удаляем токен из localStorage в любом случае
      tokenStorage.remove();
    }
  },
};

