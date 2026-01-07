import { useState, useMemo, useEffect } from 'react';
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
import { productsApi, Product, ProductQuery } from '../../api/products';
import ProductCard from '../../components/ProductCard';
import './CatalogPage.scss';

const CatalogPage = () => {
  // Восстанавливаем фильтры из localStorage при монтировании
  const savedFilters = localStorage.getItem('catalogFilters');
  const savedPage = localStorage.getItem('catalogPage');
  
  const [filters, setFilters] = useState<Omit<ProductQuery, 'page' | 'limit'>>(
    savedFilters ? JSON.parse(savedFilters) : {
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }
  );
  const [currentPage, setCurrentPage] = useState(
    savedPage ? Number(savedPage) : 1
  );
  const itemsPerPage = 12;

  // Сохраняем фильтры в localStorage при их изменении
  useEffect(() => {
    localStorage.setItem('catalogFilters', JSON.stringify(filters));
  }, [filters]);

  // Сохраняем текущую страницу в localStorage
  useEffect(() => {
    localStorage.setItem('catalogPage', String(currentPage));
  }, [currentPage]);

  // Загружаем все товары без фильтров один раз
  // Данные обновляются только при:
  // 1) Авторизации пользователя (через useAuth)
  // 2) Перезагрузке страницы (автоматически)
  // 3) Изменении/добавлении товара (через AdminPage)
  // 4) Возврате фокуса на окно браузера (refetchOnWindowFocus)
  const { data: allProductsData, isLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsApi.getAll({ limit: 10000 }), // Загружаем все товары
    staleTime: Infinity, // Данные не устаревают автоматически при изменении фильтров
    refetchOnWindowFocus: true, // Обновляем при возврате фокуса на окно (открытие браузера)
    refetchOnMount: false, // Не обновляем при монтировании компонента
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  // Функция проверки видимости товара по фильтрам
  const isProductVisible = useMemo(() => {
    if (!allProductsData?.products) return () => false;

    return (product: Product): boolean => {
      // Фильтр по поиску
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        if (
          !product.name.toLowerCase().includes(searchLower) &&
          !product.description?.toLowerCase().includes(searchLower)
        ) {
          return false;
        }
      }

      // Фильтр по категории
      if (filters.category && product.category !== filters.category) {
        return false;
      }

      // Фильтр по цене
      if (filters.minPrice !== undefined && product.price < filters.minPrice) {
        return false;
      }
      if (filters.maxPrice !== undefined && product.price > filters.maxPrice) {
        return false;
      }

      return true;
    };
  }, [allProductsData?.products, filters]);

  // Отсортированные товары (для определения порядка отображения)
  const sortedProducts = useMemo(() => {
    if (!allProductsData?.products) return [];

    const sorted = [...allProductsData.products];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (filters.sortBy) {
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
      }

      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    return sorted;
  }, [allProductsData?.products, filters.sortBy, filters.sortOrder]);

  // Подсчет видимых товаров для пагинации
  const visibleProducts = useMemo(() => {
    return sortedProducts.filter(isProductVisible);
  }, [sortedProducts, isProductVisible]);

  const totalPages = Math.ceil(visibleProducts.length / itemsPerPage);

  // Определяем, какие товары должны быть видимы на текущей странице
  const getProductDisplayStyle = (product: Product) => {
    if (!isProductVisible(product)) {
      return { display: 'none' };
    }

    // Определяем индекс товара среди видимых
    const visibleIndex = visibleProducts.findIndex((p) => p.id === product.id);
    if (visibleIndex === -1) {
      return { display: 'none' };
    }

    // Проверяем, попадает ли товар на текущую страницу
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    if (visibleIndex >= startIndex && visibleIndex < endIndex) {
      return { display: 'block' };
    }

    return { display: 'none' };
  };

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Сбрасываем на первую страницу при изменении фильтров
  };

  const handlePageChange = (_: any, page: number) => {
    setCurrentPage(page);
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
            <MenuItem value="createdAt-desc">По новизне</MenuItem>
            <MenuItem value="price-asc">Цена: по возрастанию</MenuItem>
            <MenuItem value="price-desc">Цена: по убыванию</MenuItem>
            <MenuItem value="name-asc">Название: А-Я</MenuItem>
          </Select>
        </FormControl>
        <Box className="catalog-page__price-filter">
          <Typography variant="body2" className="catalog-page__price-label">
            Цена
          </Typography>
          <Box className="catalog-page__price-inputs">
            <TextField
              type="number"
              variant="outlined"
              size="small"
              placeholder="От"
              value={filters.minPrice || ''}
              onChange={(e) =>
                handleFilterChange('minPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              className="catalog-page__price-input catalog-page__price-input--min"
            />
            <Typography variant="body2" className="catalog-page__price-separator">
              —
            </Typography>
            <TextField
              type="number"
              variant="outlined"
              size="small"
              placeholder="До"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                handleFilterChange('maxPrice', e.target.value ? Number(e.target.value) : undefined)
              }
              className="catalog-page__price-input catalog-page__price-input--max"
            />
          </Box>
        </Box>
      </Box>

      {isLoading ? (
        <Box className="catalog-page__loader">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} className="catalog-page__products">
            {sortedProducts.map((product) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                lg={3}
                key={product.id}
                sx={getProductDisplayStyle(product)}
              >
                <ProductCard product={product} />
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box className="catalog-page__pagination">
              <Pagination
                count={totalPages}
                page={currentPage}
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

