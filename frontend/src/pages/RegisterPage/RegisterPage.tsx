import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
} from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, RegisterData } from '../../api/auth';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials } from '../../store/slices/authSlice';
import { setCart } from '../../store/slices/cartSlice';
import { syncLocalCartToServer } from '../../utils/syncCart';
import './RegisterPage.scss';

const RegisterPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [error, setError] = useState<string | null>(null);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: async (data) => {
      // Устанавливаем авторизацию в Redux
      dispatch(setCredentials({ user: data.user }));
      
      // Синхронизируем локальную корзину с серверной и получаем обновленную корзину
      const syncedCart = await syncLocalCartToServer();
      
      // Обновляем корзину в Redux store с синхронизированными данными
      dispatch(setCart(syncedCart));
      
      // Инвалидируем кэш корзины для React Query
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка регистрации');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    registerMutation.mutate(formData);
  };

  return (
    <Box className="register-page">
      <Card className="register-page__card">
        <CardContent>
          <Typography variant="h4" component="h1" className="register-page__title">
            Регистрация
          </Typography>
          {error && (
            <Alert severity="error" className="register-page__error">
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="register-page__form">
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="register-page__field"
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              margin="normal"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="register-page__field"
            />
            <TextField
              fullWidth
              label="Имя"
              margin="normal"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="register-page__field"
            />
            <TextField
              fullWidth
              label="Фамилия"
              margin="normal"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="register-page__field"
            />
            <TextField
              fullWidth
              label="Телефон"
              margin="normal"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="register-page__field"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="register-page__submit"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Регистрация...' : 'Зарегистрироваться'}
            </Button>
            <Typography variant="body2" className="register-page__footer">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="register-page__link">
                Войти
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterPage;

