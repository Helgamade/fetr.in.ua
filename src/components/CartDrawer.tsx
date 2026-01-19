import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { X, Plus, Minus, Trash2, ShoppingBag, Truck, ArrowRight, Clock, Zap } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn, getNextShippingDate } from '@/lib/utils';
import { analytics } from '@/lib/analytics';

export const CartDrawer: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
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
    getItemCount,
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

  // Shipping info
  const shippingInfo = useMemo(() => getNextShippingDate(), []);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [timeLeftForNext, setTimeLeftForNext] = useState({ hours: 0, minutes: 0 });

  // Таймер для сегодняшней отправки (до 16:00) - обновляется каждую секунду
  useEffect(() => {
    if (!shippingInfo.deadlineDate) return;
    
    const calculateTimeLeft = () => {
      const difference = shippingInfo.deadlineDate!.getTime() - new Date().getTime();
      if (difference > 0) {
        const totalSeconds = Math.floor(difference / 1000);
        const totalMinutes = Math.floor(totalSeconds / 60);
        setTimeLeft({
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
          seconds: totalSeconds % 60,
        });
      } else {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000); // Обновляем каждую секунду
    return () => clearInterval(timer);
  }, [shippingInfo.deadlineDate]);

  // Таймер для завтрашней/будущей отправки (до 16:00 следующего рабочего дня)
  useEffect(() => {
    if (shippingInfo.isToday || !shippingInfo.date) return;
    
    const calculateTimeLeftForNext = () => {
      const now = new Date();
      const shippingDate = shippingInfo.date;
      
      // Вычисляем 16:00 дня отправки в киевском времени
      const shippingDateKyiv = shippingDate.toLocaleDateString('en-CA', { timeZone: 'Europe/Kyiv' });
      const [year, month, day] = shippingDateKyiv.split('-').map(Number);
      
      const testDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
      const kyivNoonParts = new Intl.DateTimeFormat('en', {
        timeZone: 'Europe/Kyiv',
        hour: '2-digit',
        hour12: false
      }).formatToParts(testDate);
      const kyivHour = parseInt(kyivNoonParts.find(p => p.type === 'hour')!.value);
      const offsetHours = kyivHour - 12;
      
      const deadlineNext = new Date(Date.UTC(year, month - 1, day, 16 - offsetHours, 0, 0, 0));
      
      const difference = deadlineNext.getTime() - now.getTime();
      if (difference > 0) {
        const totalMinutes = Math.floor(difference / (1000 * 60));
        setTimeLeftForNext({
          hours: Math.floor(totalMinutes / 60),
          minutes: totalMinutes % 60,
        });
      } else {
        setTimeLeftForNext({ hours: 0, minutes: 0 });
      }
    };
    
    calculateTimeLeftForNext();
    const timer = setInterval(calculateTimeLeftForNext, 60000); // Обновляем каждую минуту
    return () => clearInterval(timer);
  }, [shippingInfo.isToday, shippingInfo.date]);

  // Отслеживаем, была ли корзина открыта ранее (чтобы не логировать при первой загрузке)
  const wasOpenRef = useRef<boolean>(false);

  // Отслеживаем открытие/закрытие корзины - НЕ меняем title вообще
  useEffect(() => {
    // Пропускаем первую загрузку (когда компонент монтируется с isOpen = false)
    if (!isOpen && !wasOpenRef.current) {
      return; // Не делаем ничего при первой загрузке
    }

    if (isOpen) {
      wasOpenRef.current = true; // Отмечаем, что корзина была открыта
      
      // НЕ меняем document.title - пусть остается title текущей страницы!
      // Только отправляем событие в аналитику с правильным названием корзины

      // ОДИН лог при открытии
      console.log('🛒 [CartDrawer] Корзина открыта');

      // Отправляем событие просмотра страницы "Кошик" в аналитику
      const sessionId = sessionStorage.getItem('analytics_session_id');
      if (sessionId) {
        fetch('/api/analytics/page-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            pageUrl: '/cart',
            pageTitle: 'Кошик | FetrInUA', // Хардкодим название для аналитики
            pageType: 'cart',
          }),
        }).catch(() => {
          // Игнорируем ошибки
        });
      }
    } else {
      // При закрытии корзины обновляем страницу в аналитике
      if (wasOpenRef.current) {
        // ОДИН лог при закрытии
        console.log('🛒 [CartDrawer] Корзина закрыта');
        
        // Обновляем текущую страницу в аналитике (возвращаемся к реальной странице)
        // Корзина открывается только с главной страницы, поэтому после закрытия мы на главной
        const currentPath = window.location.pathname;
        if (currentPath === '/' || currentPath === '') {
          // Вызываем trackPageView чтобы обновить страницу в аналитике
          analytics.trackPageView().catch(() => {
            // Игнорируем ошибки
          });
        }
      }
      // Сбрасываем флаг при закрытии
      wasOpenRef.current = false;
    }
  }, [isOpen]);

  return (
    <>
      {/* Backdrop - только когда корзина открыта */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 transition-opacity duration-300"
          onClick={closeCart}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 w-full sm:w-[420px] bg-card z-50 transition-transform duration-300 flex flex-col',
          'rounded-l-2xl',
          isOpen ? 'translate-x-0 shadow-large' : 'translate-x-full shadow-none'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-primary" />
            <span className="font-heading font-bold text-lg">Кошик</span>
            <span className="text-sm text-muted-foreground">({getItemCount()})</span>
          </div>
          <Button variant="ghost" size="icon" onClick={closeCart}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Free delivery progress */}
        {items.length > 0 && (
          <div className="p-4 bg-sage/50 min-h-[56px] flex flex-col justify-center">
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
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <ShoppingBag className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="font-heading font-bold text-lg mb-2">Кошик порожній</h3>
              <p className="text-muted-foreground mb-4">Додайте товари для оформлення замовлення</p>
              <Button variant="hero" onClick={() => {
                closeCart();
                if (location.pathname === '/') {
                  // На главной - скроллим к якорю
                  window.location.href = '#products';
                } else {
                  // На другой странице - переходим на главную с якорем
                  window.location.href = '/#products';
                }
              }}>
                Перейти до наборів
              </Button>
            </div>
          ) : (
            <div className="bg-muted/50">
              <div className="p-3">
                {/* Items list */}
                <ul className="space-y-0">
                {items.map((item, index) => {
                  const product = products.find(p => p.code === item.productId);
                  if (!product) return null;

                  const currentPrice = product.salePrice || product.basePrice;
                  const hasDiscount = !!product.salePrice;
                  const optionsPrice = item.selectedOptions.reduce((sum, optId) => {
                    const option = product.options.find(o => o.code === optId);
                    return sum + (option?.price || 0);
                  }, 0);
                  
                  // Total price (product + options) * quantity - показываем общую цену
                  const unitPrice = currentPrice + optionsPrice;
                  const unitBasePrice = product.basePrice + optionsPrice;
                  const itemTotalPrice = unitPrice * item.quantity;
                  const itemTotalBasePrice = unitBasePrice * item.quantity;

                  const isFirst = index === 0;

                  return (
                    <li key={item.id}>
                      <div className={cn(
                        "flex gap-4 bg-card p-3",
                        isFirst && "rounded-t-lg",
                        !isFirst && "border-t border-border"
                      )}>
                        {/* Image */}
                        <div className="flex-shrink-0">
                          <div className="w-20 h-20 rounded-lg overflow-hidden">
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>

                        {/* Product info and controls */}
                        <div className="flex-1 min-w-0 relative">
                          {/* Delete button - absolute top right */}
                          <div className="absolute top-0 right-0 z-[5]">
                            <button
                              type="button"
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Name */}
                          <div className="mb-1">
                            <h4 className="font-medium text-sm leading-tight">{product.name}</h4>
                          </div>

                          {/* Selected options */}
                          <div className="mb-3 flex flex-wrap" style={{ gap: '0.3rem' }}>
                            {item.selectedOptions.length > 0 ? (
                              item.selectedOptions.map((optId) => {
                                const option = product.options.find(o => o.code === optId);
                                if (!option) return null;
                                return (
                                  <span 
                                    key={optId} 
                                    className="inline-flex items-center rounded-full border border-border text-muted-foreground" 
                                    style={{ 
                                      fontSize: '0.75rem',
                                      paddingTop: '0.1rem',
                                      paddingBottom: '0.1rem',
                                      paddingLeft: '0.6rem',
                                      paddingRight: '0.6rem'
                                    }}
                                  >
                                    {option.name}
                                  </span>
                                );
                              })
                            ) : (
                              <span className="text-muted-foreground" style={{ fontSize: '0.85rem' }}>В наявності</span>
                            )}
                          </div>

                          {/* Quantity and price row */}
                          <div className="flex items-center justify-between gap-4">
                            {/* Quantity controls */}
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className={cn(
                                  "h-8 w-8 flex items-center justify-center rounded-xl border border-border transition-colors text-sm font-medium",
                                  item.quantity <= 1 
                                    ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground" 
                                    : "hover:bg-muted hover:border-primary text-foreground"
                                )}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-sm font-medium">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="h-8 w-8 flex items-center justify-center rounded-xl border border-border hover:bg-muted hover:border-primary transition-colors text-foreground text-sm font-medium"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            
                            {/* Price - aligned to right, stacked, same column as delete button */}
                            <div className="flex flex-col items-end">
                              {hasDiscount ? (
                                <>
                                  <span className="text-sm text-muted-foreground line-through">
                                    {itemTotalBasePrice} ₴
                                  </span>
                                  <span className="text-base font-bold text-destructive">
                                    {itemTotalPrice} ₴
                                  </span>
                                </>
                              ) : (
                                <span className="text-base font-bold text-foreground">
                                  {itemTotalPrice} ₴
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Totals and checkout button */}
              <div className="bg-card rounded-b-lg p-4 space-y-4 border-t border-border">
                {/* Totals */}
                {hasFreeDelivery ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-sm text-muted-foreground">Доставка:</span>
                      <span className="text-sm font-medium">Безкоштовно</span>
                    </div>
                    <div className="flex items-center justify-between w-full">
                      <span className="text-base font-bold text-foreground">До оплати з доставкою:</span>
                      <span className="text-base font-bold text-foreground">{finalTotal} ₴</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <span className="text-base font-bold text-foreground">До оплати без доставки:</span>
                    <span className="text-base font-bold text-foreground">{finalTotal} ₴</span>
                  </div>
                )}

                {/* Checkout button */}
                <Button size="lg" className="w-full rounded-xl" onClick={handleCheckout}>
                  Оформити замовлення
                </Button>
              </div>

              {/* Shipping info - отдельный блок после кнопки, внутри скроллируемой области */}
              <div className="px-3 pt-4 pb-4">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary text-sm">
                  {shippingInfo.isToday ? (
                    <>
                      <div className="flex items-center gap-2 font-semibold">
                        <Truck className="w-4 h-4" />
                        <span>Ваше замовлення може поїхати ще сьогодні</span>
                      </div>
                      <p className="mt-1 text-secondary/80">
                        ⚡ Встигніть оплатити за {timeLeft.hours > 0 ? `${timeLeft.hours} год ` : ''}{timeLeft.minutes} хв {timeLeft.seconds} с
                      </p>
                    </>
                  ) : shippingInfo.isTomorrow ? (
                    <>
                      <div className="flex items-center gap-2 font-semibold">
                        <Truck className="w-4 h-4" />
                        <span>Замовлення може поїхати завтра</span>
                      </div>
                      <p className="mt-1 text-secondary/80">
                        ⏳ Залишилось {timeLeftForNext.hours} год {timeLeftForNext.minutes} хв для оплати
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 font-semibold">
                        <Truck className="w-4 h-4" />
                        <span>Найближча відправка – у {shippingInfo.dayName}</span>
                      </div>
                      <p className="mt-1 text-secondary/80">
                        ⏳ Залишилось {timeLeftForNext.hours} год {timeLeftForNext.minutes} хв для оплати
                      </p>
                    </>
                  )}
                </div>
              </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
