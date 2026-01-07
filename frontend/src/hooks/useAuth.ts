import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAppDispatch } from './redux';
import { setCredentials, logout } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const previousUserRef = useRef<any>(null);

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.getMe,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    // Ошибки не будут показываться в консоли, так как getMe возвращает null при 401
    throwOnError: false,
  });

  useEffect(() => {
    const previousUser = previousUserRef.current;
    const currentUser = user;

    // Проверяем, изменился ли статус авторизации
    const wasLoggedOut = previousUser === null && currentUser !== null;
    const wasLoggedIn = previousUser !== null && currentUser === null;

    if (wasLoggedOut || wasLoggedIn) {
      // Инвалидируем кэш товаров при изменении статуса авторизации
      queryClient.invalidateQueries({ queryKey: ['products', 'all'] });
    }

    previousUserRef.current = currentUser;

    if (user) {
      dispatch(setCredentials({ user }));
    } else {
      // Если user === null, значит пользователь не авторизован
      dispatch(logout());
    }
  }, [user, dispatch, queryClient]);

  return { user, isLoading };
};

