import React from 'react';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, Clock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const { data: settings = {} } = useSettings();
  const FREE_DELIVERY_THRESHOLD = parseInt(settings.free_delivery_threshold) || 1500;
  
  const {
    items,
    isOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    getSubtotal,
    getDiscount,
    getDeliveryCost,
    getTotal,
    amountToFreeDelivery,
  } = useCart();

  const getDeliveryMessage = () => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    
    // Weekend
    if (day === 0 || day === 6) {
      return { text: 'Найближча відправка — у понеділок', highlight: false };
    }
    
    // Weekday before 16:00
    if (hour < 16) {
      return { text: 'Оплатіть протягом 15 хв — відправимо сьогодні!', highlight: true };
    }
    
    // Weekday after 16:00
    return { text: 'Відправимо завтра о 17:00', highlight: false };
  };

  const deliveryMessage = getDeliveryMessage();
  const freeDeliveryAmount = amountToFreeDelivery();
  const freeDeliveryProgress = Math.min(100, ((FREE_DELIVERY_THRESHOLD - freeDeliveryAmount) / FREE_DELIVERY_THRESHOLD) * 100);

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
      />

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-card z-50 transition-transform duration-300 shadow-large flex flex-col',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold text-lg">Кошик</span>
            <span className="text-sm text-muted-foreground">({items.length})</span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Free delivery progress */}
        {items.length > 0 && (
          <div className="p-4 bg-sage/50">
            {freeDeliveryAmount > 0 ? (
              <>
                <p className="text-sm mb-2">
                  До безкоштовної доставки: <span className="font-bold text-primary">{freeDeliveryAmount} ₴</span>
                </p>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500 rounded-full"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 text-success">
                <Truck className="w-5 h-5" />
                <span className="font-medium">Безкоштовна доставка!</span>
              </div>
            )}
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">Кошик порожній</h3>
              <p className="text-muted-foreground mb-4">Додайте товари для оформлення замовлення</p>
              <Button variant="hero" onClick={closeCart}>
                Перейти до наборів
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const product = products.find(p => p.id === item.productId);
                if (!product) return null;

                const price = product.salePrice || product.basePrice;
                const optionsPrice = item.selectedOptions.reduce((sum, optId) => {
                  const option = product.options.find(o => o.id === optId);
                  return sum + (option?.price || 0);
                }, 0);
                const itemTotal = (price + optionsPrice) * item.quantity;

                return (
                  <div key={item.productId} className="flex gap-4 p-4 rounded-xl bg-muted/50">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-heading font-semibold truncate">{product.name}</h4>
                      
                      {/* Selected options */}
                      {item.selectedOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {item.selectedOptions.map(optId => {
                            const option = product.options.find(o => o.id === optId);
                            return option ? (
                              <span key={optId} className="text-xs px-2 py-0.5 bg-primary/10 rounded-full">
                                {option.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-medium w-6 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="font-bold text-primary">{itemTotal} ₴</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeFromCart(item.productId)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-4">
            {/* Delivery info */}
            <div className={cn(
              'flex items-center gap-2 p-3 rounded-lg text-sm',
              deliveryMessage.highlight ? 'bg-success/10 text-success' : 'bg-muted'
            )}>
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span>{deliveryMessage.text}</span>
            </div>

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Підсумок</span>
                <span>{getSubtotal()} ₴</span>
              </div>
              {getDiscount() > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span>Знижка</span>
                  <span>-{getDiscount()} ₴</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Доставка</span>
                <span>{getDeliveryCost() === 0 ? 'Безкоштовно' : `${getDeliveryCost()} ₴`}</span>
              </div>
              <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-border">
                <span>Разом</span>
                <span className="text-primary">{getTotal()} ₴</span>
              </div>
            </div>

            {/* Checkout button */}
            <Button variant="cta" size="xl" className="w-full" onClick={handleCheckout}>
              Оформити замовлення
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
    </>
  );
};
