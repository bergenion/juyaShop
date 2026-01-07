import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Typography } from '@mui/material';
import './Toast.scss';

interface ToastProps {
  message: string;
  onClose: () => void;
}

const Toast = ({ message, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    // Анимация появления (1 секунда)
    const showTimer = setTimeout(() => {
      setIsVisible(true);
    }, 10);

    // Время жизни после анимации (2 секунды) + время анимации (1 секунда) = 3 секунды
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      // Ждем завершения анимации исчезновения перед вызовом onClose
      setTimeout(() => {
        onClose();
      }, 1000); // 1 секунда на анимацию исчезновения
    }, 1500); // 1 секунда анимация + 2 секунды отображения

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [onClose]);

  if (!mounted) {
    return null;
  }

  const toastContent = (
    <Box className={`toast ${isVisible ? 'toast--visible' : ''}`}>
      <Typography variant="body1" className="toast__message">
        {message}
      </Typography>
    </Box>
  );

  // Рендерим через Portal в body
  return createPortal(toastContent, document.body);
};

export default Toast;

