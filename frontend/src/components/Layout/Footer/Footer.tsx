import { Box, Container, Typography, Link as MuiLink, Grid } from '@mui/material';
import './Footer.scss';

const Footer = () => {
  return (
    <Box component="footer" className="footer">
      <Container>
        <Grid container spacing={4} className="footer__content">
          <Grid item xs={12} md={4} className="footer__section">
            <Typography variant="h6" className="footer__title">
              JUYA SHOP
            </Typography>
            <Typography variant="body2" className="footer__text">
              Магия Природы. Браслеты · Минералы · Травы · Свечи.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} className="footer__section">
            <Typography variant="h6" className="footer__title">
              Информация
            </Typography>
            <Box className="footer__links">
              <MuiLink href="/catalog" color="inherit" underline="hover" className="footer__link">
                Каталог
              </MuiLink>
              <MuiLink href="/cart" color="inherit" underline="hover" className="footer__link">
                Корзина
              </MuiLink>
            </Box>
          </Grid>
          <Grid item xs={12} md={4} className="footer__section">
            <Typography variant="h6" className="footer__title">
              Контакты
            </Typography>
            <Typography variant="body2" className="footer__text">
              Обработка заказов: с 9:00 до 18:00
              <br />
              без выходных
            </Typography>
          </Grid>
        </Grid>
        <Box className="footer__copyright">
          <Typography variant="body2" align="center">
            © 2025 JUYA SHOP. Все права защищены.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

