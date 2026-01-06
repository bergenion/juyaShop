import { api } from './api';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  images?: string[];
  category: string;
  inStock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductQuery {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'price' | 'createdAt' | 'name';
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const productsApi = {
  getAll: async (query?: ProductQuery): Promise<ProductsResponse> => {
    const response = await api.get('/products', { params: query });
    return response.data;
  },
  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  getCategories: async (): Promise<string[]> => {
    const response = await api.get('/products/categories');
    return response.data;
  },
  create: async (
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    imageFiles?: File[] | null,
  ): Promise<Product> => {
    if (imageFiles && imageFiles.length > 0) {
      // Если есть файлы, отправляем FormData
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof typeof data];
        if (value !== undefined && value !== null && key !== 'image' && key !== 'images') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      // Добавляем все файлы с одним именем поля 'images'
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
      const response = await api.post('/products', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Если файлов нет, отправляем обычный JSON
      const response = await api.post('/products', data);
      return response.data;
    }
  },
  update: async (
    id: string,
    data: Partial<Product>,
    imageFiles?: File[] | null,
  ): Promise<Product> => {
    if (imageFiles && imageFiles.length > 0) {
      // Если есть файлы, отправляем FormData
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        const value = data[key as keyof typeof data];
        if (value !== undefined && value !== null && key !== 'image' && key !== 'images') {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });
      // Если есть существующие изображения, добавляем их
      if (data.images) {
        formData.append('images', JSON.stringify(data.images));
      }
      // Добавляем все новые файлы с одним именем поля 'images'
      imageFiles.forEach((file) => {
        formData.append('images', file);
      });
      const response = await api.patch(`/products/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      // Если файлов нет, отправляем обычный JSON
      const response = await api.patch(`/products/${id}`, data);
      return response.data;
    }
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

