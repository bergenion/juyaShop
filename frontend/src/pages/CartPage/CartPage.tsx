import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  TextField,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cartApi } from '../../api/cart';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setCart, removeItem } from '../../store/slices/cartSlice';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './CartPage.scss';

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { items, total } = useAppSelector((state) => state.cart);
  const queryClient = useQueryClient();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const { isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const cart = await cartApi.getCart();
      dispatch(setCart(cart));
      const qty: Record<string, number> = {};
      cart.items.forEach((item) => {
        qty[item.id] = item.quantity;
      });
      setQuantities(qty);
      return cart;
    },
    // Загружаем корзину всегда (даже без авторизации - локальная корзина)
    refetchOnMount: true,
  });

  const updateQuantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      cartApi.updateQuantity(id, quantity),
    onSuccess: async () => {
      const cart = await cartApi.getCart();
      dispatch(setCart(cart));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const removeItemMutation = useMutation({
    mutationFn: cartApi.removeFromCart,
    onSuccess: async () => {
      const cart = await cartApi.getCart();
      dispatch(setCart(cart));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantities((prev) => ({ ...prev, [itemId]: newQuantity }));
    updateQuantityMutation.mutate({ id: itemId, quantity: newQuantity });
  };

  const handleRemove = (itemId: string) => {
    removeItemMutation.mutate(itemId);
    dispatch(removeItem(itemId));
  };

  // Показываем корзину даже без авторизации (локальная корзина)
  // При оформлении заказа потребуется авторизация

  if (isLoading) {
    return <Typography>Загрузка корзины...</Typography>;
  }

  if (items.length === 0) {
    return (
      <Box className="cart-page__empty">
        <Typography variant="h5" className="cart-page__empty-title">
          Корзина пуста
        </Typography>
        <Button variant="contained" onClick={() => navigate('/catalog')} className="cart-page__empty-button">
          Перейти в каталог
        </Button>
      </Box>
    );
  }

  return (
    <Box className="cart-page">
      <Typography variant="h4" component="h1" className="cart-page__title">
        Корзина
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8} className="cart-page__items">
          {items.map((item) => (
            <Card key={item.id} className="cart-page__item">
              <CardContent>
                <Box className="cart-page__item-content">
                  <img
                    src={item.product.image || '/placeholder.jpg'}
                    alt={item.product.name}
                    className="cart-page__item-image"
                  />
                  <Box className="cart-page__item-info">
                    <Typography variant="h6" className="cart-page__item-name">
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" className="cart-page__item-price">
                      {item.product.price.toLocaleString('ru-RU')} ₽ за шт.
                    </Typography>
                    <Box className="cart-page__item-actions">
                      <TextField
                        type="number"
                        size="small"
                        value={quantities[item.id] || item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item.id, Math.max(1, Number(e.target.value)))
                        }
                        inputProps={{ min: 1 }}
                        className="cart-page__quantity-input"
                      />
                      <Typography variant="h6" className="cart-page__item-total">
                        {(item.product.price * (quantities[item.id] || item.quantity)).toLocaleString('ru-RU')} ₽
                      </Typography>
                      <IconButton
                        color="error"
                        onClick={() => handleRemove(item.id)}
                        className="cart-page__remove-button"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Grid>
        <Grid item xs={12} md={4}>
          <Card className="cart-page__summary">
            <CardContent>
              <Typography variant="h6" className="cart-page__summary-title">
                Итого
              </Typography>
              <Divider className="cart-page__summary-divider" />
              <Box className="cart-page__summary-total">
                <Typography className="cart-page__summary-items">
                  Товаров: {items.reduce((sum, item) => sum + item.quantity, 0)}
                </Typography>
                <Typography variant="h6" className="cart-page__summary-price">
                  {total.toLocaleString('ru-RU')} ₽
                </Typography>
              </Box>
              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/cart/checkout');
                  } else {
                    navigate('/login', { state: { returnTo: '/cart/checkout' } });
                  }
                }}
                className="cart-page__checkout-button"
              >
                Оформить заказ
              </Button>
              {!isAuthenticated && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Для оформления заказа необходимо войти в систему
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CartPage;

