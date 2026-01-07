import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem, CartState } from '@/types/store';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { trackEvent, trackFunnel } from '@/lib/analytics';

interface CartContextType extends CartState {
  addToCart: (productId: string, selectedOptions: string[]) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateOptions: (itemId: string, selectedOptions: string[]) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getSubtotal: () => number;
  getDiscount: () => number;
  getDeliveryCost: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  amountToFreeDelivery: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: products = [] } = useProducts();
  const { data: settings = {} } = useSettings();
  
  const FREE_DELIVERY_THRESHOLD = parseInt(settings.free_delivery_threshold) || 1500;
  const DELIVERY_COST = parseInt(settings.delivery_cost) || 70;

  // Функция для генерации уникального ID
  const generateItemId = () => {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Функция для миграции старых данных (без id) в новый формат
  const migrateCartItems = (items: any[]): CartItem[] => {
    return items.map(item => {
      // Если у элемента уже есть id, возвращаем как есть
      if (item.id) {
        return item;
      }
      // Если нет id, генерируем новый
      return {
        ...item,
        id: generateItemId()
      };
    });
  };

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('fetr-cart');
    if (!saved) return [];
    
    try {
      const parsed = JSON.parse(saved);
      // Миграция старых данных
      return migrateCartItems(Array.isArray(parsed) ? parsed : []);
    } catch {
      return [];
    }
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('fetr-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((productId: string, selectedOptions: string[]) => {
    // Отслеживаем добавление в корзину
    trackEvent({
      eventType: 'add_to_cart',
      eventCategory: 'ecommerce',
      productId: parseInt(productId),
      eventData: { options: selectedOptions },
    });
    
    trackFunnel({ stage: 'added_to_cart' });
    
    setItems(prev => {
      // Сортируем опции для корректного сравнения
      const sortedOptions = [...selectedOptions].sort();
      
      // Ищем товар с таким же productId И такими же опциями
      const existing = prev.find(item => {
        if (item.productId !== productId) return false;
        const itemSortedOptions = [...item.selectedOptions].sort();
        return JSON.stringify(itemSortedOptions) === JSON.stringify(sortedOptions);
      });
      
      if (existing) {
        // Если нашли - увеличиваем количество
        return prev.map(item => {
          const itemSortedOptions = [...item.selectedOptions].sort();
          if (item.id === existing.id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
      }
      
      // Если не нашли - добавляем как новую позицию с уникальным id
      return [...prev, { 
        id: generateItemId(),
        productId, 
        quantity: 1, 
        selectedOptions 
      }];
    });
    
    // Открываем корзину сразу без всплывающего сообщения
    setIsOpen(true);
    
    // Track analytics
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { event: 'add_to_cart', productId, selectedOptions }
    }));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    const item = items.find(i => i.id === itemId);
    if (item) {
      trackEvent({
        eventType: 'remove_from_cart',
        eventCategory: 'ecommerce',
        productId: parseInt(item.productId),
      });
    }
    setItems(prev => prev.filter(item => item.id !== itemId));
  }, [items]);

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const updateOptions = useCallback((itemId: string, selectedOptions: string[]) => {
    setItems(prev =>
      prev.map(item =>
        item.id === itemId ? { ...item, selectedOptions } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  // Subtotal = сумма basePrice (цена БЕЗ скидки) + опции
  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.code === item.productId);
      if (!product) return total;
      
      const productPrice = product.basePrice; // Используем basePrice для subtotal
      const optionsPrice = item.selectedOptions.reduce((optTotal, optId) => {
        const option = product.options.find(o => o.code === optId);
        return optTotal + (option?.price || 0);
      }, 0);
      
      return total + (productPrice + optionsPrice) * item.quantity;
    }, 0);
  }, [items, products]);

  // Discount = разница между basePrice и salePrice
  const getDiscount = useCallback(() => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.code === item.productId);
      if (!product || !product.salePrice) return total;
      return total + (product.basePrice - product.salePrice) * item.quantity;
    }, 0);
  }, [items, products]);

  // Delivery cost based on final price (after discount)
  const getDeliveryCost = useCallback(() => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const finalSubtotal = subtotal - discount; // Цена после скидки
    return finalSubtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST;
  }, [getSubtotal, getDiscount]);

  // Total = Subtotal - Discount + Delivery
  const getTotal = useCallback(() => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const deliveryCost = getDeliveryCost();
    return subtotal - discount + deliveryCost;
  }, [getSubtotal, getDiscount, getDeliveryCost]);

  const getItemCount = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const amountToFreeDelivery = useCallback(() => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    const finalSubtotal = subtotal - discount; // Цена после скидки
    return Math.max(0, FREE_DELIVERY_THRESHOLD - finalSubtotal);
  }, [getSubtotal, getDiscount]);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateOptions,
        clearCart,
        toggleCart,
        openCart,
        closeCart,
        getSubtotal,
        getDiscount,
        getDeliveryCost,
        getTotal,
        getItemCount,
        amountToFreeDelivery,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
