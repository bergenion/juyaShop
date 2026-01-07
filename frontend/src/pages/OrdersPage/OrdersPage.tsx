import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { ordersApi } from '../../api/orders';
import './OrdersPage.scss';

const OrdersPage = () => {
  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['orders'],
    queryFn: ordersApi.getAll,
    retry: false,
    throwOnError: false,
  });

  // Если ошибка авторизации - редиректим на страницу входа
  if (error && (error as any).response?.status === 401) {
    return <Navigate to="/login" replace state={{ returnTo: '/orders' }} />;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Ожидает обработки',
      PROCESSING: 'В обработке',
      SHIPPED: 'Отправлен',
      DELIVERED: 'Доставлен',
      CANCELLED: 'Отменен',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return <Typography>Загрузка заказов...</Typography>;
  }

  return (
    <Box className="orders-page">
      <Typography variant="h4" component="h1" className="orders-page__title">
        История заказов
      </Typography>
      {!orders || orders.length === 0 ? (
        <Typography className="orders-page__empty">У вас пока нет заказов</Typography>
      ) : (
        <Box className="orders-page__list">
          {orders.map((order) => (
            <Card key={order.id} className="orders-page__order">
              <CardContent>
                <Box className="orders-page__order-header">
                  <Typography variant="h6" className="orders-page__order-number">
                    Заказ №{order.id.substring(0, 8)}
                  </Typography>
                  <Chip
                    label={getStatusLabel(order.status)}
                    color={getStatusColor(order.status) as any}
                    className="orders-page__order-status"
                  />
                </Box>
                <Typography variant="body2" className="orders-page__order-date">
                  Дата: {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                </Typography>
                <Divider className="orders-page__order-divider" />
                <Grid container spacing={2} className="orders-page__order-items">
                  {order.orderItems.map((item) => (
                    <Grid item xs={12} key={item.id}>
                      <Box className="orders-page__order-item">
                        <Typography className="orders-page__order-item-name">
                          {item.product.name} x {item.quantity}
                        </Typography>
                        <Typography className="orders-page__order-item-price">
                          {(item.price * item.quantity).toLocaleString('ru-RU')} ₽
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
                <Divider className="orders-page__order-divider" />
                <Box className="orders-page__order-total">
                  <Typography variant="h6" className="orders-page__order-total-label">
                    Итого:
                  </Typography>
                  <Typography variant="h6" className="orders-page__order-total-price">
                    {order.total.toLocaleString('ru-RU')} ₽
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default OrdersPage;

