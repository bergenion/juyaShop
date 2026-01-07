import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  FormControl,
  Grid,
  IconButton,
  Tooltip,
  Autocomplete,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi, Product } from '../../api/products';
import { ordersApi } from '../../api/orders';
import './AdminPage.scss';

const AdminPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const editProductId = searchParams.get('edit');
  const [tab, setTab] = useState(0);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: 0,
    image: '',
    category: '',
    inStock: 0,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [orderSortField, setOrderSortField] = useState<string | null>(null);
  const [orderSortDirection, setOrderSortDirection] = useState<'asc' | 'desc' | null>(null);
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: () => productsApi.getAll({ limit: 1000, includeInactive: true }),
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', 'admin'],
    queryFn: ordersApi.getAll,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productsApi.getCategories,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingProduct) {
        return productsApi.update(editingProduct.id, data, imageFiles);
      } else {
        return productsApi.create(data, imageFiles);
      }
    },
    onSuccess: async (savedProduct) => {
      // Инвалидируем и принудительно перезагружаем данные
      await queryClient.invalidateQueries({ queryKey: ['products', 'all'] });
      await queryClient.refetchQueries({ queryKey: ['products', 'all'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      setProductDialogOpen(false);
      resetForm();
      
      // Переход на страницу товара после сохранения
      const productId = editingProduct?.id || savedProduct.id;
      if (productId) {
        navigate(`/product/${productId}`, {
          state: { from: 'admin', fromEdit: true }, // Помечаем, что переход был после редактирования
        });
      }
    },
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return ordersApi.updateStatus(id, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      return productsApi.delete(id);
    },
    onSuccess: async () => {
      // Инвалидируем и принудительно перезагружаем данные
      await queryClient.invalidateQueries({ queryKey: ['products', 'all'] });
      await queryClient.refetchQueries({ queryKey: ['products', 'all'] });
      await queryClient.invalidateQueries({ queryKey: ['products', 'admin'] });
      await queryClient.refetchQueries({ queryKey: ['products', 'admin'] });
      await queryClient.invalidateQueries({ queryKey: ['categories'] });
      await queryClient.refetchQueries({ queryKey: ['categories'] });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
  });

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setProductToDelete(null);
  };

  const handleSort = (field: string) => {
    if (sortField !== field) {
      // Новое поле - сортировка по возрастанию
      setSortField(field);
      setSortDirection('asc');
    } else if (sortDirection === 'asc') {
      // Тот же столбец, было asc - переключаем на desc
      setSortDirection('desc');
    } else if (sortDirection === 'desc') {
      // Тот же столбец, было desc - сбрасываем сортировку
      setSortField(null);
      setSortDirection(null);
    }
  };

  // Сортируем товары
  const sortedProducts = useMemo(() => {
    if (!products?.products || !sortField || !sortDirection) {
      return products?.products || [];
    }

    const sorted = [...products.products];
    sorted.sort((a, b) => {
      let aValue: any = a[sortField as keyof Product];
      let bValue: any = b[sortField as keyof Product];

      // Обработка разных типов данных
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      } else if (typeof aValue === 'number') {
        // Для числовых значений сортируем как числа
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      // Обработка null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [products?.products, sortField, sortDirection]);

  const handleOrderSort = (field: string) => {
    if (orderSortField !== field) {
      // Новое поле - сортировка по возрастанию
      setOrderSortField(field);
      setOrderSortDirection('asc');
    } else if (orderSortDirection === 'asc') {
      // Тот же столбец, было asc - переключаем на desc
      setOrderSortDirection('desc');
    } else if (orderSortDirection === 'desc') {
      // Тот же столбец, было desc - сбрасываем сортировку
      setOrderSortField(null);
      setOrderSortDirection(null);
    }
  };

  // Сортируем заказы
  const sortedOrders = useMemo(() => {
    if (!orders || !orderSortField || !orderSortDirection) {
      return orders || [];
    }

    const sorted = [...orders];
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Определяем значение в зависимости от поля сортировки
      switch (orderSortField) {
        case 'client':
          // Клиент = firstName + lastName
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'total':
          // Сумма - числовое значение
          aValue = Number(a.total);
          bValue = Number(b.total);
          break;
        case 'status':
          // Статус - строка
          aValue = a.status.toLowerCase();
          bValue = b.status.toLowerCase();
          break;
        case 'date':
          // Дата - преобразуем в Date объект для правильной сортировки
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }

      // Обработка null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1;
      if (bValue == null) return -1;

      if (aValue < bValue) {
        return orderSortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return orderSortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [orders, orderSortField, orderSortDirection]);

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: 0,
      image: '',
      category: '',
      inStock: 0,
    });
    setImageFiles([]);
    setImagePreviews([]);
    setEditingProduct(null);
  };

  const handleOpenProductDialog = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setProductForm({
        name: product.name,
        description: product.description || '',
        price: product.price,
        image: product.image || '',
        category: product.category,
        inStock: product.inStock,
      });
      setImageFiles([]);
      // Показываем все изображения товара в preview
      const allImages = product.image 
        ? [product.image, ...(product.images || [])].filter((img, idx, arr) => arr.indexOf(img) === idx)
        : product.images || [];
      setImagePreviews(allImages);
    } else {
      resetForm();
    }
    setProductDialogOpen(true);
  };

  // Автоматически открываем диалог редактирования, если есть параметр edit в URL
  useEffect(() => {
    if (editProductId && products?.products) {
      const productToEdit = products.products.find((p) => p.id === editProductId);
      if (productToEdit && !productDialogOpen) {
        handleOpenProductDialog(productToEdit);
        // Убираем параметр из URL после открытия диалога
        setSearchParams({});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProductId, products]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setImageFiles(files);
      const readers = files.map((file) => {
        const reader = new FileReader();
        return new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      Promise.all(readers).then((previews) => {
        setImagePreviews(previews);
      });
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImagePreviews((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSaveProduct = () => {
    const dataToSave = { ...productForm };
    
    // Преобразуем первую букву категории в заглавную
    if (dataToSave.category && dataToSave.category.length > 0) {
      dataToSave.category = dataToSave.category.charAt(0).toUpperCase() + dataToSave.category.slice(1).toLowerCase();
    }
    
    if (imageFiles.length > 0) {
      const formData = new FormData();
      Object.keys(dataToSave).forEach(key => {
        if (key !== 'image' && key !== 'images') {
          formData.append(key, String(dataToSave[key as keyof typeof dataToSave]));
        }
      });
      imageFiles.forEach(file => {
        formData.append('images', file);
      });
      const existingImages = imagePreviews.filter(preview => !preview.startsWith('blob:'));
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
      createProductMutation.mutate(formData);
    } else {
      createProductMutation.mutate(dataToSave);
    }
  };

  return (
    <Box className="admin-page">
      <Box className="admin-page__header">
        <Typography variant="h4" component="h1" className="admin-page__title">
          Админ-панель
        </Typography>
        {tab === 0 && (
          <Button
            variant="contained"
            onClick={() => handleOpenProductDialog()}
            className="admin-page__add-button"
            size="large"
          >
            Добавить товар
          </Button>
        )}
      </Box>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} className="admin-page__tabs">
        <Tab label="Товары" />
        <Tab label="Заказы" />
      </Tabs>

      {tab === 0 && (
        <Box className="admin-page__products">
          <TableContainer component={Paper} className="admin-page__table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleSort('name')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Название
                      {sortField === 'name' && sortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {sortField === 'name' && sortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleSort('category')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Категория
                      {sortField === 'category' && sortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {sortField === 'category' && sortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleSort('price')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Цена
                      {sortField === 'price' && sortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {sortField === 'price' && sortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleSort('inStock')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      В наличии
                      {sortField === 'inStock' && sortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {sortField === 'inStock' && sortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price} ₽</TableCell>
                    <TableCell>{product.inStock}</TableCell>
                    <TableCell>
                      <Box className="admin-page__actions">
                        <Button size="small" onClick={() => handleOpenProductDialog(product)} className="admin-page__edit-button">
                          Редактировать
                        </Button>
                        <Tooltip title="Удалить" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(product)}
                            className="admin-page__delete-button"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {tab === 1 && (
        <Box className="admin-page__orders">
          <TableContainer component={Paper} className="admin-page__table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleOrderSort('client')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Клиент
                      {orderSortField === 'client' && orderSortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {orderSortField === 'client' && orderSortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleOrderSort('total')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Сумма
                      {orderSortField === 'total' && orderSortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {orderSortField === 'total' && orderSortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleOrderSort('status')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Статус
                      {orderSortField === 'status' && orderSortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {orderSortField === 'status' && orderSortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    className="admin-page__sortable-header"
                    onClick={() => handleOrderSort('date')}
                    style={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center" gap={0.5}>
                      Дата
                      {orderSortField === 'date' && orderSortDirection === 'asc' && (
                        <ArrowUpwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                      {orderSortField === 'date' && orderSortDirection === 'desc' && (
                        <ArrowDownwardIcon fontSize="small" style={{ color: '#000' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      {order.firstName} {order.lastName}
                    </TableCell>
                    <TableCell>{order.total.toLocaleString('ru-RU')} ₽</TableCell>
                    <TableCell>
                      <Chip label={order.status} size="small" className="admin-page__status-chip" />
                    </TableCell>
                    <TableCell>
                      {new Date(order.createdAt).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" className="admin-page__status-select">
                        <Select
                          value={order.status}
                          onChange={(e) =>
                            updateOrderStatusMutation.mutate({
                              id: order.id,
                              status: e.target.value,
                            })
                          }
                        >
                          <MenuItem value="PENDING">PENDING</MenuItem>
                          <MenuItem value="PROCESSING">PROCESSING</MenuItem>
                          <MenuItem value="SHIPPED">SHIPPED</MenuItem>
                          <MenuItem value="DELIVERED">DELIVERED</MenuItem>
                          <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth className="admin-page__dialog">
        <DialogTitle className="admin-page__dialog-title">
          {editingProduct ? 'Редактировать товар' : 'Добавить товар'}
        </DialogTitle>
        <DialogContent>
          <Box className="admin-page__dialog-content">
            <TextField
              label="Название"
              fullWidth
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              className="admin-page__dialog-field"
            />
            <TextField
              label="Описание"
              fullWidth
              multiline
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              className="admin-page__dialog-field"
            />
            <TextField
              label="Цена"
              type="number"
              fullWidth
              value={productForm.price}
              onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
              className="admin-page__dialog-field"
            />
            <Box className="admin-page__images">
              <Typography variant="body2" className="admin-page__images-label">
                Изображения товара (можно выбрать несколько)
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="images-upload"
                type="file"
                multiple
                onChange={handleImageChange}
              />
              <label htmlFor="images-upload">
                <Button variant="outlined" component="span" fullWidth className="admin-page__images-button">
                  Выбрать изображения
                </Button>
              </label>
              {imagePreviews.length > 0 && (
                <Grid container spacing={1} className="admin-page__images-preview">
                  {imagePreviews.map((preview, index) => (
                    <Grid item key={index}>
                      <Box className="admin-page__image-wrapper">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="admin-page__image-preview"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          className="admin-page__image-remove"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
              {imageFiles.length === 0 && imagePreviews.length === 0 && productForm.image && (
                <TextField
                  label="Или введите URL изображения"
                  fullWidth
                  size="small"
                  value={productForm.image}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="admin-page__dialog-field admin-page__dialog-field--url"
                />
              )}
            </Box>
            <Autocomplete
              freeSolo
              options={categories || []}
              value={productForm.category}
              onInputChange={(_, newValue) => {
                setProductForm({ ...productForm, category: newValue });
              }}
              onChange={(_, newValue) => {
                if (typeof newValue === 'string') {
                  setProductForm({ ...productForm, category: newValue });
                } else if (newValue === null) {
                  setProductForm({ ...productForm, category: '' });
                }
              }}
              filterOptions={(options, { inputValue }) => {
                // Показываем список только если введено 2+ символа
                if (inputValue.length < 2) {
                  return [];
                }
                // Фильтруем категории по введенному тексту
                return options.filter((option) =>
                  option.toLowerCase().includes(inputValue.toLowerCase())
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Категория"
                  className="admin-page__dialog-field"
                />
              )}
              className="admin-page__dialog-field"
            />
            <TextField
              label="В наличии"
              type="number"
              fullWidth
              value={productForm.inStock}
              onChange={(e) => setProductForm({ ...productForm, inStock: Number(e.target.value) })}
              className="admin-page__dialog-field"
            />
          </Box>
        </DialogContent>
        <DialogActions className="admin-page__dialog-actions">
          <Button onClick={() => setProductDialogOpen(false)} className="admin-page__dialog-cancel">
            Отмена
          </Button>
          <Button onClick={handleSaveProduct} variant="contained" className="admin-page__dialog-save">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        className="admin-page__delete-dialog"
      >
        <DialogTitle className="admin-page__delete-dialog-title">
          Подтверждение удаления
        </DialogTitle>
        <DialogContent>
          <Typography>
            Вы уверены, что хотите удалить товар?
          </Typography>
        </DialogContent>
        <DialogActions className="admin-page__delete-dialog-actions">
          <Button onClick={handleDeleteCancel} className="admin-page__delete-dialog-cancel">
            Нет
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            className="admin-page__delete-dialog-confirm"
            disabled={deleteProductMutation.isPending}
          >
            {deleteProductMutation.isPending ? 'Удаление...' : 'Да'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminPage;

