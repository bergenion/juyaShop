import { useState, useEffect } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const queryClient = useQueryClient();

  const { data: products } = useQuery({
    queryKey: ['products', 'admin'],
    queryFn: () => productsApi.getAll({ limit: 1000 }),
  });

  const { data: orders } = useQuery({
    queryKey: ['orders', 'admin'],
    queryFn: ordersApi.getAll,
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingProduct) {
        return productsApi.update(editingProduct.id, data, imageFiles);
      } else {
        return productsApi.create(data, imageFiles);
      }
    },
    onSuccess: (savedProduct) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setProductDialogOpen(false);
      resetForm();
      
      // Переход на страницу товара после сохранения
      const productId = editingProduct?.id || savedProduct.id;
      if (productId) {
        navigate(`/product/${productId}`);
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
      <Typography variant="h4" component="h1" className="admin-page__title">
        Админ-панель
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} className="admin-page__tabs">
        <Tab label="Товары" />
        <Tab label="Заказы" />
      </Tabs>

      {tab === 0 && (
        <Box className="admin-page__products">
          <Button
            variant="contained"
            onClick={() => handleOpenProductDialog()}
            className="admin-page__add-button"
          >
            Добавить товар
          </Button>
          <TableContainer component={Paper} className="admin-page__table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Категория</TableCell>
                  <TableCell>Цена</TableCell>
                  <TableCell>В наличии</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products?.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.category}</TableCell>
                    <TableCell>{product.price} ₽</TableCell>
                    <TableCell>{product.inStock}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleOpenProductDialog(product)} className="admin-page__edit-button">
                        Редактировать
                      </Button>
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
                  <TableCell>Клиент</TableCell>
                  <TableCell>Сумма</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Дата</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders?.map((order) => (
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
            <TextField
              label="Категория"
              fullWidth
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
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
    </Box>
  );
};

export default AdminPage;

