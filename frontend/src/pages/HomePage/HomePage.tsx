import { Box, Typography, Button, Container, Grid } from '@mui/material';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../../api/products';
import ProductCard from '../../components/ProductCard';
import './HomePage.scss';

const HomePage = () => {
  const { data: productsData } = useQuery({
    queryKey: ['products', 'new'],
    queryFn: () => productsApi.getAll({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
  });

  return (
    <Container className="home-page">
      <Box className="home-page__hero">
        <Typography variant="h2" component="h1" className="home-page__hero-title">
          Браслеты · Минералы · Травы · Свечи.
        </Typography>
        <Typography variant="h4" component="h2" className="home-page__hero-subtitle">
          JUYA SHOP — Магия Природы.
        </Typography>
        <Button
          component={Link}
          to="/catalog"
          variant="contained"
          size="large"
          className="home-page__hero-button"
        >
          Перейти в каталог
        </Button>
      </Box>

      {productsData && productsData.products.length > 0 && (
        <Box className="home-page__new-products">
          <Typography variant="h4" component="h2" className="home-page__new-products-title">
            НОВИНКИ
          </Typography>
          <Grid container spacing={3} className="home-page__new-products-grid">
            {productsData.products.slice(0, 8).map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.id}>
                <ProductCard product={product} imageHeight={200} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Container>
  );
};

export default HomePage;

