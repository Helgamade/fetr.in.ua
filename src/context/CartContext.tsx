import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CartItem, CartState } from '@/types/store';
import { products, FREE_DELIVERY_THRESHOLD, DELIVERY_COST } from '@/data/products';
import { toast } from 'sonner';

interface CartContextType extends CartState {
  addToCart: (productId: string, selectedOptions: string[]) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateOptions: (productId: string, selectedOptions: string[]) => void;
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
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('fetr-cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('fetr-cart', JSON.stringify(items));
  }, [items]);

  const addToCart = useCallback((productId: string, selectedOptions: string[]) => {
    setItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1, selectedOptions }
            : item
        );
      }
      return [...prev, { productId, quantity: 1, selectedOptions }];
    });
    
    const product = products.find(p => p.id === productId);
    toast.success(`${product?.name} додано до кошика!`, {
      description: 'Перейдіть до оформлення замовлення',
      action: {
        label: 'Кошик',
        onClick: () => setIsOpen(true),
      },
    });
    
    // Track analytics
    window.dispatchEvent(new CustomEvent('analytics', {
      detail: { event: 'add_to_cart', productId, selectedOptions }
    }));
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems(prev => prev.filter(item => item.productId !== productId));
    toast.info('Товар видалено з кошика');
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, [removeFromCart]);

  const updateOptions = useCallback((productId: string, selectedOptions: string[]) => {
    setItems(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, selectedOptions } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const getSubtotal = useCallback(() => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product) return total;
      
      const productPrice = product.salePrice || product.basePrice;
      const optionsPrice = item.selectedOptions.reduce((optTotal, optId) => {
        const option = product.options.find(o => o.id === optId);
        return optTotal + (option?.price || 0);
      }, 0);
      
      return total + (productPrice + optionsPrice) * item.quantity;
    }, 0);
  }, [items]);

  const getDiscount = useCallback(() => {
    return items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      if (!product || !product.salePrice) return total;
      return total + (product.basePrice - product.salePrice) * item.quantity;
    }, 0);
  }, [items]);

  const getDeliveryCost = useCallback(() => {
    const subtotal = getSubtotal();
    return subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_COST;
  }, [getSubtotal]);

  const getTotal = useCallback(() => {
    return getSubtotal() + getDeliveryCost();
  }, [getSubtotal, getDeliveryCost]);

  const getItemCount = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  const amountToFreeDelivery = useCallback(() => {
    const subtotal = getSubtotal();
    return Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  }, [getSubtotal]);

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
