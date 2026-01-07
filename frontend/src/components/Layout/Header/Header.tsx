import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Badge,
  Menu,
  MenuItem,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import { useAppSelector, useAppDispatch } from '../../../hooks/redux';
import { logout } from '../../../store/slices/authSlice';
import { authApi } from '../../../api/auth';
import { useState } from 'react';
import './Header.scss';

const Header = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { items } = useAppSelector((state) => state.cart);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const cartItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Ошибка при выходе:', error);
    } finally {
      dispatch(logout());
      handleMenuClose();
      navigate('/');
    }
  };

  return (
    <Box className="header">
      <Link to="/" className="header__logo">
        <Typography variant="h5" component="div" className="header__logo-text">
          JUYA SHOP
        </Typography>
      </Link>

      <Box className="header__nav">
        <Button 
          component={Link} 
          to="/" 
          className="header__nav-link"
          sx={{ color: '#ffffff' }}
        >
          Главная
        </Button>
        <Button 
          component={Link} 
          to="/catalog" 
          className="header__nav-link"
          sx={{ color: '#ffffff' }}
        >
          Каталог
        </Button>
      </Box>

      <Box className="header__actions">
        <IconButton
          component={Link}
          to="/cart"
          className="header__cart-button"
        >
          <Badge badgeContent={cartItemsCount} color="secondary">
            <ShoppingCartIcon />
          </Badge>
        </IconButton>

        {isAuthenticated ? (
          <>
            <IconButton onClick={handleMenuOpen} className="header__user-button">
              <PersonIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              className="header__menu"
            >
              <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                Профиль
              </MenuItem>
              <MenuItem onClick={() => { navigate('/orders'); handleMenuClose(); }}>
                Заказы
              </MenuItem>
              {user?.role === 'ADMIN' && (
                <MenuItem onClick={() => { navigate('/admin'); handleMenuClose(); }}>
                  Админ-панель
                </MenuItem>
              )}
              <MenuItem onClick={handleLogout}>Выйти</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button 
              component={Link} 
              to="/login" 
              className="header__auth-button"
              sx={{ color: '#ffffff' }}
            >
              Войти
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="outlined"
              className="header__auth-button header__auth-button--register"
              sx={{ 
                color: '#ffffff',
                borderColor: '#ffffff',
                '&:hover': {
                  borderColor: '#ffffff',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Регистрация
            </Button>
          </>
        )}
      </Box>
    </Box>
  );
};

export default Header;

