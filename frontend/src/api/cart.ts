import { api } from './api';
import {
  getLocalCart,
  saveLocalCart,
  addToLocalCart,
  updateLocalCartQuantity,
  removeFromLocalCart,
  clearLocalCart,
  getLocalCartTotal,
  getLocalCartAsCartItems,
  LocalCartItem,
} from '../utils/localCart';
import { productsApi } from './products';

export interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
  quantity: number;
}

export interface CartResponse {
  items: CartItem[];
  total: number;
}

export interface AddToCartData {
  productId: string;
  quantity: number;
}

// Проверка авторизации
const isAuthenticated = (): boolean => {
  // Проверяем наличие токена в localStorage
  const token = localStorage.getItem('auth_token');
  return !!token;
};

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    // Если не авторизован - возвращаем локальную корзину
    if (!isAuthenticated()) {
      const items = getLocalCartAsCartItems();
      return {
        items,
        total: getLocalCartTotal(),
      };
    }

    try {
      const response = await api.get('/cart');
      return response.data;
    } catch (error: any) {
      // Если 401 - возвращаем локальную корзину
      if (error.response?.status === 401) {
        const items = getLocalCartAsCartItems();
        return {
          items,
          total: getLocalCartTotal(),
        };
      }
      throw error;
    }
  },

  addToCart: async (data: AddToCartData): Promise<CartItem> => {
    // Если не авторизован - добавляем в локальную корзину
    if (!isAuthenticated()) {
      // Получаем информацию о товаре
      const product = await productsApi.getById(data.productId);
      addToLocalCart(
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image,
        },
        data.quantity,
      );

      // Возвращаем локальный элемент корзины
      const localCart = getLocalCart();
      const item = localCart.items.find((item) => item.productId === data.productId);
      if (item) {
        const index = localCart.items.findIndex((i) => i.productId === data.productId);
        return {
          id: `local_${item.productId}_${index}`,
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
        };
      }
      throw new Error('Ошибка при добавлении в локальную корзину');
    }

    try {
      const response = await api.post('/cart', data);
      return response.data;
    } catch (error: any) {
      // Если 401 - добавляем в локальную корзину
      if (error.response?.status === 401) {
        const product = await productsApi.getById(data.productId);
        addToLocalCart(
          {
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
          },
          data.quantity,
        );

        const localCart = getLocalCart();
        const item = localCart.items.find((item) => item.productId === data.productId);
        if (item) {
          const index = localCart.items.findIndex((i) => i.productId === data.productId);
          return {
            id: `local_${item.productId}_${index}`,
            productId: item.productId,
            product: item.product,
            quantity: item.quantity,
          };
        }
      }
      throw error;
    }
  },

  updateQuantity: async (id: string, quantity: number): Promise<CartItem> => {
    // Если это локальный элемент (начинается с local_)
    if (id.startsWith('local_')) {
      // Извлекаем productId из ID (формат: local_productId_index или local_productId)
      const parts = id.replace(/^local_/, '').split('_');
      const productId = parts[0];
      updateLocalCartQuantity(productId, quantity);
      
      const localCart = getLocalCart();
      const item = localCart.items.find((item) => item.productId === productId);
      if (item) {
        const index = localCart.items.findIndex((i) => i.productId === productId);
        return {
          id: `local_${item.productId}_${index}`,
          productId: item.productId,
          product: item.product,
          quantity: item.quantity,
        };
      }
      throw new Error('Товар не найден в локальной корзине');
    }

    // Если не авторизован - работаем с локальной корзиной
    if (!isAuthenticated()) {
      // Получаем товар из локальной корзины по ID
      const localCart = getLocalCart();
      const item = localCart.items.find((item, index) => `local_${item.productId}_${index}` === id);
      if (item) {
        updateLocalCartQuantity(item.productId, quantity);
        const updatedCart = getLocalCart();
        const updatedItemIndex = updatedCart.items.findIndex((i) => i.productId === item.productId);
        const updatedItem = updatedCart.items[updatedItemIndex];
        if (updatedItem) {
          return {
            id: `local_${updatedItem.productId}_${updatedItemIndex}`,
            productId: updatedItem.productId,
            product: updatedItem.product,
            quantity: updatedItem.quantity,
          };
        }
      }
      throw new Error('Товар не найден в локальной корзине');
    }

    try {
      const response = await api.patch(`/cart/${id}`, { quantity });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Если 401 - работаем с локальной корзиной
        const localCart = getLocalCart();
        const item = localCart.items.find((item, index) => `local_${item.productId}_${index}` === id);
        if (item) {
          updateLocalCartQuantity(item.productId, quantity);
          const updatedCart = getLocalCart();
          const updatedItem = updatedCart.items.find((i) => i.productId === item.productId);
          if (updatedItem) {
            return {
              id: `local_${updatedItem.productId}`,
              productId: updatedItem.productId,
              product: updatedItem.product,
              quantity: updatedItem.quantity,
            };
          }
        }
      }
      throw error;
    }
  },

  removeFromCart: async (id: string): Promise<void> => {
    // Если это локальный элемент
    if (id.startsWith('local_')) {
      // Извлекаем productId из ID (формат: local_productId_index или local_productId)
      const parts = id.replace(/^local_/, '').split('_');
      const productId = parts[0];
      removeFromLocalCart(productId);
      return;
    }

    // Если не авторизован - работаем с локальной корзиной
    if (!isAuthenticated()) {
      const localCart = getLocalCart();
      const item = localCart.items.find((item, index) => `local_${item.productId}_${index}` === id);
      if (item) {
        removeFromLocalCart(item.productId);
      }
      return;
    }

    try {
      await api.delete(`/cart/${id}`);
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Если 401 - работаем с локальной корзиной
        const localCart = getLocalCart();
        const item = localCart.items.find((item, index) => `local_${item.productId}_${index}` === id);
        if (item) {
          removeFromLocalCart(item.productId);
        }
      } else {
        throw error;
      }
    }
  },

  clearCart: async (): Promise<void> => {
    // Если не авторизован - очищаем локальную корзину
    if (!isAuthenticated()) {
      clearLocalCart();
      return;
    }

    try {
      await api.delete('/cart');
    } catch (error: any) {
      if (error.response?.status === 401) {
        clearLocalCart();
      } else {
        throw error;
      }
    }
  },
};

