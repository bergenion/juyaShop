import sharp from 'sharp';
import { join } from 'path';

/**
 * Сжимает изображение при загрузке
 * @param inputPath - путь к исходному файлу
 * @param outputPath - путь для сохранения (если не указан, заменяет исходный файл)
 * @returns статистика сжатия
 */
export async function compressUploadedImage(
  inputPath: string,
  outputPath?: string,
): Promise<{ originalSize: number; compressedSize: number; saved: number }> {
  const fs = await import('fs/promises');
  const originalStats = await fs.stat(inputPath);
  const originalSize = originalStats.size;
  
  // Если outputPath не указан, заменяем исходный файл
  const targetPath = outputPath || inputPath;
  
  // Определяем формат по расширению
  const ext = inputPath.toLowerCase().split('.').pop();
  
  let sharpInstance = sharp(inputPath);
  
  // Получаем метаданные для определения размера
  const metadata = await sharp(inputPath).metadata();
  const maxWidth = 1920; // Максимальная ширина
  const maxHeight = 1920; // Максимальная высота
  
  // Уменьшаем размер, если изображение слишком большое
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }
  
  // Настройки сжатия в зависимости от формата
  if (ext === 'jpg' || ext === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ 
      quality: 85, // Качество 85% - хороший баланс между размером и качеством
      progressive: true, // Прогрессивная загрузка
      mozjpeg: true // Использовать mozjpeg для лучшего сжатия
    });
  } else if (ext === 'png') {
    // Для PNG пробуем конвертировать в WebP для лучшего сжатия, но оставляем PNG если нужно сохранить прозрачность
    if (metadata.hasAlpha) {
      // Если есть прозрачность, оставляем PNG
      sharpInstance = sharpInstance.png({ 
        quality: 85,
        compressionLevel: 9,
        palette: true 
      });
    } else {
      // Если нет прозрачности, конвертируем в JPEG для лучшего сжатия
      sharpInstance = sharpInstance.jpeg({ 
        quality: 85,
        progressive: true,
        mozjpeg: true 
      });
      // Меняем расширение на .jpg
      const newPath = targetPath.replace(/\.png$/i, '.jpg');
      await sharpInstance.toFile(newPath);
      // Удаляем старый PNG файл
      await fs.unlink(inputPath);
      const compressedStats = await fs.stat(newPath);
      return {
        originalSize,
        compressedSize: compressedStats.size,
        saved: originalSize - compressedStats.size,
      };
    }
  } else if (ext === 'webp') {
    sharpInstance = sharpInstance.webp({ 
      quality: 85 
    });
  }
  
  await sharpInstance.toFile(targetPath);
  
  const fsSync = await import('fs');
  const compressedStats = fsSync.statSync(targetPath);
  const compressedSize = compressedStats.size;
  const saved = originalSize - compressedSize;
  
  return {
    originalSize,
    compressedSize,
    saved,
  };
}

