import { api } from './api';

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

export const cartApi = {
  getCart: async (): Promise<CartResponse> => {
    const response = await api.get('/cart');
    return response.data;
  },
  addToCart: async (data: AddToCartData): Promise<CartItem> => {
    const response = await api.post('/cart', data);
    return response.data;
  },
  updateQuantity: async (id: string, quantity: number): Promise<CartItem> => {
    const response = await api.patch(`/cart/${id}`, { quantity });
    return response.data;
  },
  removeFromCart: async (id: string): Promise<void> => {
    await api.delete(`/cart/${id}`);
  },
  clearCart: async (): Promise<void> => {
    await api.delete('/cart');
  },
};

