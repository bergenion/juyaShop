import { cartApi } from '../api/cart';
import {
  getLocalCart,
  clearLocalCart,
  LocalCartItem,
} from './localCart';

/**
 * Синхронизировать локальную корзину с серверной корзиной
 * При авторизации все товары из локальной корзины добавляются в серверную
 */
export const syncLocalCartToServer = async (): Promise<void> => {
  const localCart = getLocalCart();
  
  if (localCart.items.length === 0) {
    return;
  }

  try {
    // Получаем текущую серверную корзину
    const serverCart = await cartApi.getCart();
    const serverProductIds = new Set(serverCart.items.map((item) => item.productId));

    // Добавляем все товары из локальной корзины, которых нет в серверной
    for (const localItem of localCart.items) {
      // Проверяем, есть ли уже этот товар в серверной корзине
      if (!serverProductIds.has(localItem.productId)) {
        try {
          await cartApi.addToCart({
            productId: localItem.productId,
            quantity: localItem.quantity,
          });
        } catch (error) {
          console.error(`Ошибка при добавлении товара ${localItem.productId} в серверную корзину:`, error);
          // Продолжаем синхронизацию других товаров
        }
      } else {
        // Если товар уже есть в серверной корзине, обновляем количество
        const serverItem = serverCart.items.find((item) => item.productId === localItem.productId);
        if (serverItem) {
          // Объединяем количества
          const totalQuantity = serverItem.quantity + localItem.quantity;
          try {
            await cartApi.updateQuantity(serverItem.id, totalQuantity);
          } catch (error) {
            console.error(`Ошибка при обновлении количества товара ${localItem.productId}:`, error);
          }
        }
      }
    }

    // Очищаем локальную корзину после успешной синхронизации
    clearLocalCart();
  } catch (error) {
    console.error('Ошибка при синхронизации корзины:', error);
    // Не очищаем локальную корзину, если синхронизация не удалась
    // Пользователь сможет попробовать позже
  }
};

