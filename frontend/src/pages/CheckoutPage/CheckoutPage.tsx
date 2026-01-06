import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
} from '@mui/material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ordersApi, CreateOrderData } from '../../api/orders';
import { cartApi } from '../../api/cart';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { clearCart } from '../../store/slices/cartSlice';
import './CheckoutPage.scss';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { items, total } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<CreateOrderData>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    comment: '',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: cartApi.getCart,
  });

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: () => {
      dispatch(clearCart());
      navigate('/orders');
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || 'Ошибка при оформлении заказа');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    createOrderMutation.mutate(formData);
  };

  if (!items || items.length === 0) {
    return (
      <Alert severity="info" className="checkout-page__empty-alert">
        Корзина пуста.{' '}
        <Button onClick={() => navigate('/catalog')} className="checkout-page__empty-button">
          Перейти в каталог
        </Button>
      </Alert>
    );
  }

  return (
    <Box className="checkout-page">
      <Typography variant="h4" component="h1" className="checkout-page__title">
        Оформление заказа
      </Typography>
      <form onSubmit={handleSubmit} className="checkout-page__form">
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card className="checkout-page__form-card">
              <CardContent>
                <Typography variant="h6" className="checkout-page__form-title">
                  Данные для доставки
                </Typography>
                {error && (
                  <Alert severity="error" className="checkout-page__error">
                    {error}
                  </Alert>
                )}
                <Grid container spacing={2} className="checkout-page__form-fields">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Имя"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="checkout-page__field"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Фамилия"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="checkout-page__field"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="checkout-page__field"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Телефон"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="checkout-page__field"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Адрес доставки"
                      multiline
                      rows={3}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="checkout-page__field"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Комментарий к заказу"
                      multiline
                      rows={3}
                      value={formData.comment}
                      onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                      className="checkout-page__field"
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="checkout-page__summary">
              <CardContent>
                <Typography variant="h6" className="checkout-page__summary-title">
                  Итого
                </Typography>
                <Divider className="checkout-page__summary-divider" />
                <Box className="checkout-page__summary-items">
                  {items.map((item) => (
                    <Box key={item.id} className="checkout-page__summary-item">
                      <Typography variant="body2" className="checkout-page__summary-item-name">
                        {item.product.name} x {item.quantity}
                      </Typography>
                      <Typography variant="body2" className="checkout-page__summary-item-price">
                        {(item.product.price * item.quantity).toLocaleString('ru-RU')} ₽
                      </Typography>
                    </Box>
                  ))}
                </Box>
                <Divider className="checkout-page__summary-divider" />
                <Box className="checkout-page__summary-total">
                  <Typography variant="h6" className="checkout-page__summary-total-label">
                    Всего:
                  </Typography>
                  <Typography variant="h6" className="checkout-page__summary-total-price">
                    {(cartData?.total || total).toLocaleString('ru-RU')} ₽
                  </Typography>
                </Box>
                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={createOrderMutation.isPending}
                  className="checkout-page__submit-button"
                >
                  {createOrderMutation.isPending ? 'Оформление...' : 'Оформить заказ'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default CheckoutPage;

