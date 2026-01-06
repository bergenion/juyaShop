/**
 * Получает правильный URL для изображения товара
 * В разработке использует прокси Vite, в продакшене - полный URL бэкенда
 */
export const getImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) {
    return '/placeholder.jpg';
  }

  // Если это уже полный URL (http/https), возвращаем как есть
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Если путь начинается с /uploads, используем его напрямую (прокси Vite обработает)
  if (imagePath.startsWith('/uploads')) {
    return imagePath;
  }

  // В остальных случаях возвращаем как есть
  return imagePath;
};

