import { cartApi, CartResponse } from '../api/cart';
import {
  getLocalCart,
  clearLocalCart,
} from './localCart';

/**
 * Синхронизировать локальную корзину с серверной корзиной через Redux
 * При авторизации все товары из локальной корзины добавляются в серверную
 * @returns Синхронизированная корзина с сервера для обновления Redux store
 */
export const syncLocalCartToServer = async (): Promise<CartResponse> => {
  const localCart = getLocalCart();
  
  // Если локальная корзина пуста, просто возвращаем серверную корзину
  if (localCart.items.length === 0) {
    try {
      return await cartApi.getCart();
    } catch (error) {
      // Если ошибка - возвращаем пустую корзину
      return { items: [], total: 0 };
    }
  }

  try {
    // Получаем текущую серверную корзину
    let serverCart: CartResponse;
    try {
      serverCart = await cartApi.getCart();
    } catch (error) {
      // Если ошибка получения корзины - создаем пустую
      serverCart = { items: [], total: 0 };
    }
    
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
          // Обновляем Set для следующей итерации
          serverProductIds.add(localItem.productId);
        } catch (error) {
          console.error(`Ошибка при добавлении товара ${localItem.productId} в серверную корзину:`, error);
          // Продолжаем синхронизацию других товаров
        }
      } else {
        // Если товар уже есть в серверной корзине, обновляем количество
        const serverItem = serverCart.items.find((item) => item.productId === localItem.productId);
        if (serverItem) {
          // Объединяем количества (суммируем)
          const totalQuantity = serverItem.quantity + localItem.quantity;
          try {
            await cartApi.updateQuantity(serverItem.id, totalQuantity);
          } catch (error) {
            console.error(`Ошибка при обновлении количества товара ${localItem.productId}:`, error);
          }
        }
      }
    }

    // Получаем обновленную серверную корзину после синхронизации
    const updatedCart = await cartApi.getCart();

    // Очищаем локальную корзину после успешной синхронизации
    clearLocalCart();

    // Возвращаем синхронизированную корзину для обновления Redux store
    return updatedCart;
  } catch (error) {
    console.error('Ошибка при синхронизации корзины:', error);
    // Не очищаем локальную корзину, если синхронизация не удалась
    // Пользователь сможет попробовать позже
    // Возвращаем локальную корзину, преобразованную в формат CartResponse
    const localItems = localCart.items.map((item, index) => ({
      id: `local_${item.productId}_${index}`,
      productId: item.productId,
      product: item.product,
      quantity: item.quantity,
    }));
    return {
      items: localItems,
      total: localItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    };
  }
};

