import React from 'react';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, ArrowRight } from 'lucide-react';
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
    amountToFreeDelivery,
  } = useCart();

  const handleCheckout = () => {
    closeCart();
    navigate('/checkout');
  };

  // Calculate final total (with discounts applied, but without delivery)
  const getFinalTotal = () => {
    const subtotal = getSubtotal();
    const discount = getDiscount();
    return subtotal - discount;
  };

  const finalTotal = getFinalTotal();
  const hasFreeDelivery = finalTotal >= FREE_DELIVERY_THRESHOLD;

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
            {(() => {
              const freeDeliveryAmount = amountToFreeDelivery();
              const freeDeliveryProgress = Math.min(100, ((FREE_DELIVERY_THRESHOLD - freeDeliveryAmount) / FREE_DELIVERY_THRESHOLD) * 100);
              
              return freeDeliveryAmount > 0 ? (
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
              );
            })()}
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
                const product = products.find(p => p.code === item.productId);
                if (!product) return null;

                const currentPrice = product.salePrice || product.basePrice;
                const hasDiscount = !!product.salePrice;
                const optionsPrice = item.selectedOptions.reduce((sum, optId) => {
                  const option = product.options.find(o => o.code === optId);
                  return sum + (option?.price || 0);
                }, 0);
                
                // Price per unit (product + options)
                const unitPrice = currentPrice + optionsPrice;
                const unitBasePrice = product.basePrice + optionsPrice;
                const itemTotal = unitPrice * item.quantity;

                return (
                  <div key={item.productId} className="relative p-4 rounded-xl bg-muted/50">
                    {/* Delete button - top right */}
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      className="absolute top-2 right-2 h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="flex gap-4 pr-8">
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-heading font-semibold pr-6 mb-1">{product.name}</h4>
                        
                        {/* Availability */}
                        <p className="text-xs text-muted-foreground mb-2">В наявності</p>
                        
                        {/* Selected options */}
                        {item.selectedOptions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.selectedOptions.map(optId => {
                              const option = product.options.find(o => o.code === optId);
                              return option ? (
                                <span key={optId} className="text-xs px-2 py-0.5 bg-primary/10 rounded-full">
                                  {option.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}

                        {/* Quantity controls and price */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              className={cn(
                                "h-8 w-8",
                                item.quantity <= 1 && "opacity-50 cursor-not-allowed"
                              )}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <input
                              type="number"
                              value={item.quantity}
                              readOnly
                              className="w-12 h-8 text-center border border-border rounded-lg font-medium text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                              className="h-8 w-8"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {/* Price - aligned to right, stacked */}
                          <div className="flex flex-col items-end">
                            {hasDiscount ? (
                              <>
                                <span className="text-lg font-bold text-destructive">
                                  {unitPrice} ₴
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  {unitBasePrice} ₴
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-bold text-foreground">
                                {unitPrice} ₴
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-4 space-y-4">
            {/* Totals */}
            <div className="space-y-2">
              {hasFreeDelivery ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Доставка:</span>
                    <span className="font-medium">Безкоштовно</span>
                  </div>
                  <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-border">
                    <span>До оплати з доставкою:</span>
                    <span className="text-primary">{finalTotal} ₴</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between font-heading font-bold text-lg">
                  <span>До оплати без доставки:</span>
                  <span className="text-primary">{finalTotal} ₴</span>
                </div>
              )}
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
