import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAppDispatch } from './redux';
import { setCart } from '../store/slices/cartSlice';
import { cartApi } from '../api/cart';

/**
 * Хук для загрузки корзины при монтировании компонента
 * Работает как для авторизованных, так и для неавторизованных пользователей
 */
export const useCart = () => {
  const dispatch = useAppDispatch();

  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cartData = await cartApi.getCart();
      dispatch(setCart(cartData));
      return cartData;
    },
    // Загружаем корзину всегда (даже без авторизации - локальная корзина)
    staleTime: 30000, // 30 секунд
    refetchOnWindowFocus: true,
  });

  return { cart, isLoading };
};

