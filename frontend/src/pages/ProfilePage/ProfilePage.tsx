import { Box, Typography, Card, CardContent, TextField, Alert } from '@mui/material';
import { useAppSelector } from '../../hooks/redux';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import './ProfilePage.scss';

const ProfilePage = () => {
  const { user } = useAppSelector((state) => state.auth);

  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: authApi.getMe,
  });

  const displayUser = userData || user;

  return (
    <Box className="profile-page">
      <Typography variant="h4" component="h1" className="profile-page__title">
        Личный кабинет
      </Typography>
      <Card className="profile-page__card">
        <CardContent>
          <Typography variant="h6" className="profile-page__card-title">
            Информация о пользователе
          </Typography>
          <Box className="profile-page__fields">
            <TextField
              label="Email"
              value={displayUser?.email || ''}
              disabled
              fullWidth
              className="profile-page__field"
            />
            <TextField
              label="Имя"
              value={displayUser?.firstName || ''}
              disabled
              fullWidth
              className="profile-page__field"
            />
            <TextField
              label="Фамилия"
              value={displayUser?.lastName || ''}
              disabled
              fullWidth
              className="profile-page__field"
            />
            <TextField
              label="Телефон"
              value={displayUser?.phone || ''}
              disabled
              fullWidth
              className="profile-page__field"
            />
            {displayUser?.role === 'ADMIN' && (
              <Alert severity="info" className="profile-page__admin-alert">
                Вы администратор
              </Alert>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProfilePage;

