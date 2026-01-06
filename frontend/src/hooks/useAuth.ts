import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAppDispatch } from './redux';
import { setCredentials, logout } from '../store/slices/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();

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
    if (user) {
      dispatch(setCredentials({ user }));
    } else {
      // Если user === null, значит пользователь не авторизован
      dispatch(logout());
    }
  }, [user, dispatch]);

  return { user, isLoading };
};

