import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Сжимает изображение с помощью sharp
 */
async function compressImage(inputPath: string, outputPath?: string): Promise<{ originalSize: number; compressedSize: number; saved: number }> {
  const originalStats = await stat(inputPath);
  const originalSize = originalStats.size;
  
  // Если outputPath не указан, заменяем исходный файл
  const targetPath = outputPath || inputPath;
  
  // Определяем формат по расширению
  const ext = inputPath.toLowerCase().split('.').pop();
  
  let sharpInstance = sharp(inputPath);
  
  // Настройки сжатия в зависимости от формата
  if (ext === 'jpg' || ext === 'jpeg') {
    sharpInstance = sharpInstance.jpeg({ 
      quality: 85, 
      progressive: true,
      mozjpeg: true 
    });
  } else if (ext === 'png') {
    sharpInstance = sharpInstance.png({ 
      quality: 85,
      compressionLevel: 9,
      palette: true 
    });
  } else if (ext === 'webp') {
    sharpInstance = sharpInstance.webp({ 
      quality: 85 
    });
  }
  
  // Оптимизация: уменьшаем размер если изображение слишком большое
  const metadata = await sharp(inputPath).metadata();
  const maxWidth = 1920;
  const maxHeight = 1920;
  
  if (metadata.width && metadata.height) {
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
  }
  
  await sharpInstance.toFile(targetPath);
  
  const compressedStats = await stat(targetPath);
  const compressedSize = compressedStats.size;
  const saved = originalSize - compressedSize;
  
  return {
    originalSize,
    compressedSize,
    saved,
  };
}

/**
 * Рекурсивно обрабатывает все изображения в директории
 */
async function processDirectory(dirPath: string, recursive: boolean = true): Promise<void> {
  if (!existsSync(dirPath)) {
    console.error(`Директория не найдена: ${dirPath}`);
    return;
  }
  
  const files = await readdir(dirPath);
  let totalOriginal = 0;
  let totalCompressed = 0;
  let processed = 0;
  
  for (const file of files) {
    const filePath = join(dirPath, file);
    const stats = await stat(filePath);
    
    if (stats.isDirectory() && recursive) {
      await processDirectory(filePath, recursive);
      continue;
    }
    
    // Проверяем, что это изображение
    const ext = file.toLowerCase().split('.').pop();
    if (!['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
      continue;
    }
    
    try {
      console.log(`Обработка: ${filePath}`);
      const result = await compressImage(filePath);
      totalOriginal += result.originalSize;
      totalCompressed += result.compressedSize;
      processed++;
      
      const savedPercent = ((result.saved / result.originalSize) * 100).toFixed(1);
      console.log(`  ✅ Сжато: ${(result.originalSize / 1024).toFixed(2)} KB → ${(result.compressedSize / 1024).toFixed(2)} KB (сэкономлено ${savedPercent}%)`);
    } catch (error) {
      console.error(`  ❌ Ошибка при обработке ${filePath}:`, error);
    }
  }
  
  if (processed > 0) {
    const totalSaved = totalOriginal - totalCompressed;
    const totalSavedPercent = ((totalSaved / totalOriginal) * 100).toFixed(1);
    console.log(`\n📊 Итого обработано: ${processed} файлов`);
    console.log(`📦 Общий размер до: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📦 Общий размер после: ${(totalCompressed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`💰 Сэкономлено: ${(totalSaved / 1024 / 1024).toFixed(2)} MB (${totalSavedPercent}%)`);
  }
}

// Запуск скрипта
async function main() {
  const args = process.argv.slice(2);
  const targetPath = args[0] || join(process.cwd(), 'uploads', 'products');
  
  console.log(`🚀 Начинаем сжатие изображений в: ${targetPath}\n`);
  
  await processDirectory(targetPath);
  
  console.log('\n✅ Сжатие завершено!');
}

main().catch(console.error);

