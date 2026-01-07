import { CartItem } from '../api/cart';

const LOCAL_CART_KEY = 'juyashop_local_cart';

export interface LocalCartItem {
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image?: string;
  };
}

export interface LocalCart {
  items: LocalCartItem[];
}

/**
 * Получить локальную корзину из localStorage
 */
export const getLocalCart = (): LocalCart => {
  try {
    const cartJson = localStorage.getItem(LOCAL_CART_KEY);
    if (cartJson) {
      return JSON.parse(cartJson);
    }
  } catch (error) {
    console.error('Ошибка при чтении локальной корзины:', error);
  }
  return { items: [] };
};

/**
 * Сохранить локальную корзину в localStorage
 */
export const saveLocalCart = (cart: LocalCart): void => {
  try {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error('Ошибка при сохранении локальной корзины:', error);
  }
};

/**
 * Добавить товар в локальную корзину
 */
export const addToLocalCart = (product: {
  id: string;
  name: string;
  price: number;
  image?: string;
}, quantity: number): void => {
  const cart = getLocalCart();
  const existingItem = cart.items.find((item) => item.productId === product.id);

  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    cart.items.push({
      productId: product.id,
      quantity,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
    });
  }

  saveLocalCart(cart);
};

/**
 * Обновить количество товара в локальной корзине
 */
export const updateLocalCartQuantity = (productId: string, quantity: number): void => {
  const cart = getLocalCart();
  const item = cart.items.find((item) => item.productId === productId);

  if (item) {
    if (quantity <= 0) {
      cart.items = cart.items.filter((item) => item.productId !== productId);
    } else {
      item.quantity = quantity;
    }
    saveLocalCart(cart);
  }
};

/**
 * Удалить товар из локальной корзины
 */
export const removeFromLocalCart = (productId: string): void => {
  const cart = getLocalCart();
  cart.items = cart.items.filter((item) => item.productId !== productId);
  saveLocalCart(cart);
};

/**
 * Очистить локальную корзину
 */
export const clearLocalCart = (): void => {
  localStorage.removeItem(LOCAL_CART_KEY);
};

/**
 * Получить общую стоимость локальной корзины
 */
export const getLocalCartTotal = (): number => {
  const cart = getLocalCart();
  return cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
};

/**
 * Преобразовать локальную корзину в формат CartItem с временными ID
 */
export const getLocalCartAsCartItems = (): CartItem[] => {
  const cart = getLocalCart();
  return cart.items.map((item, index) => ({
    id: `local_${item.productId}_${index}`, // Временный ID для локальной корзины
    productId: item.productId,
    product: item.product,
    quantity: item.quantity,
  }));
};

