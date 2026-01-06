import { useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { productsApi, ProductQuery } from '../../api/products';
import ProductCard from '../../components/ProductCard';
import './CatalogPage.scss';

const CatalogPage = () => {
  const [filters, setFilters] = useState<ProductQuery>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', filters],
    queryFn: () => productsApi.getAll(filters),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  const handleFilterChange = (key: keyof ProductQuery, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (_: any, page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <Box className="catalog-page">
      <Typography variant="h4" component="h1" className="catalog-page__title">
        Каталог товаров
      </Typography>

      <Box className="catalog-page__filters">
        <TextField
          label="Поиск"
          variant="outlined"
          size="small"
          value={filters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
          className="catalog-page__filter catalog-page__filter--search"
        />
        <FormControl size="small" className="catalog-page__filter catalog-page__filter--category">
          <InputLabel>Категория</InputLabel>
          <Select
            value={filters.category || ''}
            label="Категория"
            onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
          >
            <MenuItem value="">Все категории</MenuItem>
            {categories?.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" className="catalog-page__filter catalog-page__filter--sort">
          <InputLabel>Сортировка</InputLabel>
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            label="Сортировка"
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-');
              handleFilterChange('sortBy', sortBy);
              handleFilterChange('sortOrder', sortOrder);
            }}
          >
            <MenuItem value="createdAt-desc">Новинки</MenuItem>
            <MenuItem value="price-asc">Цена: по возрастанию</MenuItem>
            <MenuItem value="price-desc">Цена: по убыванию</MenuItem>
            <MenuItem value="name-asc">Название: А-Я</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Мин. цена"
          type="number"
          variant="outlined"
          size="small"
          value={filters.minPrice || ''}
          onChange={(e) =>
            handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
          }
          className="catalog-page__filter catalog-page__filter--price-min"
        />
        <TextField
          label="Макс. цена"
          type="number"
          variant="outlined"
          size="small"
          value={filters.maxPrice || ''}
          onChange={(e) =>
            handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
          }
          className="catalog-page__filter catalog-page__filter--price-max"
        />
      </Box>

      {isLoading ? (
        <Box className="catalog-page__loader">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} className="catalog-page__products">
            {data?.products.map((product) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>

          {data && data.pagination.totalPages > 1 && (
            <Box className="catalog-page__pagination">
              <Pagination
                count={data.pagination.totalPages}
                page={data.pagination.page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CatalogPage;

