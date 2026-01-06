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
import { useMutation } from '@tanstack/react-query';
import { authApi, LoginData } from '../../api/auth';
import { useAppDispatch } from '../../hooks/redux';
import { setCredentials } from '../../store/slices/authSlice';
import './LoginPage.scss';

const LoginPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [formData, setFormData] = useState<LoginData>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      dispatch(setCredentials({ user: data.user }));
      navigate('/');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка входа');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    loginMutation.mutate(formData);
  };

  return (
    <Box className="login-page">
      <Card className="login-page__card">
        <CardContent>
          <Typography variant="h4" component="h1" className="login-page__title">
            Вход
          </Typography>
          {error && (
            <Alert severity="error" className="login-page__error">
              {error}
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="login-page__form">
            <TextField
              fullWidth
              label="Email"
              type="email"
              margin="normal"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="login-page__field"
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              margin="normal"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="login-page__field"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              className="login-page__submit"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Вход...' : 'Войти'}
            </Button>
            <Typography variant="body2" className="login-page__footer">
              Нет аккаунта?{' '}
              <Link to="/register" className="login-page__link">
                Зарегистрироваться
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;

