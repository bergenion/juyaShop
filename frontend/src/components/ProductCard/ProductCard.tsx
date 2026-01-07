import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, Typography, Chip, Box, IconButton, Tooltip } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '../../api/products';
import { cartApi } from '../../api/cart';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { setCart } from '../../store/slices/cartSlice';
import Toast from '../Toast';
import './ProductCard.scss';

interface ProductCardProps {
  product: Product;
  imageHeight?: number;
}

const ProductCard = ({ product, imageHeight = 250 }: ProductCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const { items: cartItems } = useAppSelector((state) => state.cart);
  const [showToast, setShowToast] = useState(false);
  const [isInCart, setIsInCart] = useState(false);
  const [isIconRed, setIsIconRed] = useState(false);

  // Формируем массив всех изображений товара
  const allImages = (() => {
    const images: string[] = [];
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
  })();

  const hasSecondImage = allImages.length > 1;
  const [isHovered, setIsHovered] = useState(false);
  const currentImage = isHovered && hasSecondImage ? allImages[1] : allImages[0];

  // Проверяем, есть ли товар в корзине
  useEffect(() => {
    const itemInCart = cartItems.some((item) => item.productId === product.id);
    setIsInCart(itemInCart);
    // Обновляем состояние иконки в зависимости от наличия товара в корзине
    setIsIconRed(itemInCart);
  }, [cartItems, product.id]);

  // Определяем источник перехода
  const getNavigationSource = () => {
    if (location.pathname === '/admin') {
      return 'admin';
    }
    if (location.pathname === '/catalog' || location.pathname === '/') {
      return 'catalog';
    }
    return 'catalog'; // По умолчанию из каталога
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Игнорируем клик, если кликнули на иконку корзины или её родительский элемент
    const target = e.target as HTMLElement;
    if (
      target.closest('.product-card__add-button') ||
      target.closest('button') ||
      target.closest('[role="button"]')
    ) {
      e.stopPropagation();
      return;
    }
    e.preventDefault();
    navigate(`/product/${product.id}`, {
      state: { from: getNavigationSource() },
    });
  };

  const addToCartMutation = useMutation({
    mutationFn: () => cartApi.addToCart({ productId: product.id, quantity: 1 }),
    onSuccess: async () => {
      const cart = await cartApi.getCart();
      dispatch(setCart(cart));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Делаем иконку красной
      setIsIconRed(true);
      // Показываем уведомление
      setShowToast(true);
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async () => {
      // Находим элемент корзины по productId
      const cartItem = cartItems.find((item) => item.productId === product.id);
      if (cartItem) {
        await cartApi.removeFromCart(cartItem.id);
      }
    },
    onSuccess: async () => {
      const cart = await cartApi.getCart();
      dispatch(setCart(cart));
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // Возвращаем иконку к исходному состоянию
      setIsIconRed(false);
    },
  });

  const handleCartToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (product.inStock === 0) {
      return;
    }

    if (isInCart) {
      // Если товар уже в корзине - удаляем
      removeFromCartMutation.mutate();
    } else {
      // Если товара нет в корзине - добавляем
      addToCartMutation.mutate();
    }
  };

  // Определяем, должна ли кнопка быть неактивной (только если товара нет в наличии)
  const isButtonDisabled = product.inStock === 0 || addToCartMutation.isPending || removeFromCartMutation.isPending;

  return (
    <Card
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="product-card"
      sx={{ cursor: 'pointer' }}
    >
      <Box className="product-card__image-wrapper" style={{ height: `${imageHeight}px` }}>
        <img
          key={`${product.id}-${currentImage}`}
          src={currentImage}
          alt={product.name}
          className="product-card__image"
        />
      </Box>
      <CardContent className="product-card__content">
        <Typography variant="h6" component="h3" className="product-card__title">
          {product.name}
        </Typography>
        <Chip label={product.category} size="small" className="product-card__category" />
        <Typography variant="body2" className="product-card__description">
          {product.description?.substring(0, 100)}
          {product.description && product.description.length > 100 ? '...' : ''}
        </Typography>
        
        <Box className="product-card__footer">
          <Typography variant="h6" className="product-card__price">
            {product.price.toLocaleString('ru-RU')} ₽
          </Typography>
          {product.inStock > 0 ? (
            <Typography variant="body2" className="product-card__stock product-card__stock--available">
              В наличии
            </Typography>
          ) : (
            <Typography variant="body2" className="product-card__stock product-card__stock--unavailable">
              Нет в наличии
            </Typography>
          )}
          <Tooltip 
            title={isInCart ? "Удалить из корзины" : "Добавить в корзину"} 
            arrow
            placement="top"
          >
            <IconButton
              className={`product-card__add-button ${isIconRed || isInCart ? 'product-card__add-button--active' : ''}`}
              onClick={handleCartToggle}
              disabled={isButtonDisabled}
              color="primary"
              size="small"
              onMouseDown={(e) => e.stopPropagation()}
              onMouseUp={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchEnd={(e) => e.stopPropagation()}
            >
              <ShoppingCartIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
      {showToast && (
        <Toast
          message="Товар успешно добавлен в корзину"
          onClose={() => setShowToast(false)}
        />
      )}
    </Card>
  );
};

export default ProductCard;

