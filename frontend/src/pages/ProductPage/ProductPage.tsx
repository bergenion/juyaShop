import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  TextField,
  Alert,
  IconButton,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import { cartApi } from '../../api/cart';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { setCart } from '../../store/slices/cartSlice';
import { useState, useEffect, useMemo } from 'react';
import './ProductPage.scss';

const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const isAdmin = user?.role === 'ADMIN';

  // Определяем источник перехода
  const navigationState = (location.state as any) || {};
  const navigationSource = navigationState.from || 'catalog';
  const isFromEdit = navigationState.fromEdit === true; // Флаг, что переход был после редактирования

  // Обработчик кнопки "Назад"
  const handleBack = () => {
    if (isFromEdit) {
      // Если переход был после редактирования товара - переходим в каталог с фильтрами по умолчанию
      localStorage.removeItem('catalogFilters');
      localStorage.removeItem('catalogPage');
      navigate('/catalog');
    } else if (navigationSource === 'admin') {
      // Если переход был из админки (но не после редактирования) - возвращаемся в админку
      navigate('/admin');
    } else {
      // Если переход был из каталога - возвращаемся с сохранением фильтров
      navigate('/catalog');
    }
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.getById(id!),
    enabled: !!id,
  });

  const addToCartMutation = useMutation({
    mutationFn: cartApi.addToCart,
    onSuccess: async () => {
      if (isAuthenticated) {
        const cart = await cartApi.getCart();
        dispatch(setCart(cart));
      }
      setMessage('Товар добавлен в корзину!');
      setTimeout(() => setMessage(null), 3000);
    },
    onError: () => {
      setMessage('Ошибка при добавлении товара');
    },
  });

  const handleAddToCart = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (product) {
      addToCartMutation.mutate({
        productId: product.id,
        quantity,
      });
    }
  };

  // Формируем массив всех изображений товара (используем useMemo для стабильности)
  const allImages = useMemo(() => {
    if (!product) {
      return ['/placeholder.jpg'];
    }
    const images = [];
    if (product.image) {
      images.push(product.image);
    }
    if (product.images && product.images.length > 0) {
      product.images.forEach((img) => {
        if (img && !images.includes(img)) {
          images.push(img);
        }
      });
    }
    if (images.length === 0) {
      images.push('/placeholder.jpg');
    }
    return images;
  }, [product]);

  // Сбрасываем индекс при изменении товара
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [id]);

  const handlePreviousImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  if (isLoading) {
    return <Typography>Загрузка...</Typography>;
  }

  if (!product) {
    return <Typography>Товар не найден</Typography>;
  }

  return (
    <Box className="product-page">
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBack}
        className="product-page__back-button"
      >
        Назад
      </Button>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card className="product-page__image-card">
            <Box className="product-page__image-wrapper">
              <img
                src={allImages[currentImageIndex]}
                alt={`${product.name} - изображение ${currentImageIndex + 1}`}
                className="product-page__image"
              />
              {allImages.length > 1 && (
                <>
                  <IconButton
                    onClick={handlePreviousImage}
                    className="product-page__nav-button product-page__nav-button--prev"
                  >
                    <ArrowBackIosIcon />
                  </IconButton>
                  <IconButton
                    onClick={handleNextImage}
                    className="product-page__nav-button product-page__nav-button--next"
                  >
                    <ArrowForwardIosIcon />
                  </IconButton>
                  <Box className="product-page__indicators">
                    {allImages.map((_, index) => (
                      <Box
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`product-page__indicator ${
                          currentImageIndex === index ? 'product-page__indicator--active' : ''
                        }`}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Box className="product-page__header">
            <Typography variant="h4" component="h1" className="product-page__title">
              {product.name}
            </Typography>
            {isAdmin && (
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={() => navigate(`/admin?edit=${product.id}`)}
                className="product-page__edit-button"
              >
                Редактировать
              </Button>
            )}
          </Box>
          <Typography variant="h5" className="product-page__price">
            {product.price.toLocaleString('ru-RU')} ₽
          </Typography>
          <Typography variant="body1" className="product-page__description">
            {product.description || 'Описание отсутствует'}
          </Typography>
          <Box className="product-page__info">
            <Typography variant="body2" className="product-page__info-item">
              Категория: {product.category}
            </Typography>
            <Typography variant="body2" className="product-page__info-item">
              В наличии: {product.inStock} шт.
            </Typography>
          </Box>
          {message && (
            <Alert
              severity={message.includes('Ошибка') ? 'error' : 'success'}
              className="product-page__message"
            >
              {message}
            </Alert>
          )}
          {product.inStock > 0 ? (
            <Box className="product-page__actions">
              <TextField
                type="number"
                label="Количество"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(product.inStock, Number(e.target.value))))}
                inputProps={{ min: 1, max: product.inStock }}
                className="product-page__quantity-input"
              />
              <Button
                variant="contained"
                size="large"
                onClick={handleAddToCart}
                disabled={addToCartMutation.isPending}
                className="product-page__add-button"
              >
                В корзину
              </Button>
            </Box>
          ) : (
            <Alert severity="warning" className="product-page__warning">
              Товар отсутствует на складе
            </Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductPage;

