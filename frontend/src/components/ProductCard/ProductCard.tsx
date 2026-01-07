import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { Product } from '../../api/products';
import './ProductCard.scss';

interface ProductCardProps {
  product: Product;
  imageHeight?: number;
}

const ProductCard = ({ product, imageHeight = 250 }: ProductCardProps) => {
  const navigate = useNavigate();
  const location = useLocation();

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
    e.preventDefault();
    navigate(`/product/${product.id}`, {
      state: { from: getNavigationSource() },
    });
  };

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
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductCard;

