import { Outlet } from 'react-router-dom';
import { AppBar, Toolbar, Container, Box } from '@mui/material';
import Header from './Header';
import Footer from './Footer';
import './Layout.scss';

const Layout = () => {
  return (
    <Box className="layout">
      <AppBar position="static" className="layout__appbar">
        <Toolbar>
          <Header />
        </Toolbar>
      </AppBar>
      <Container component="main" className="layout__main">
        <Outlet />
      </Container>
      <Footer />
    </Box>
  );
};

export default Layout;
