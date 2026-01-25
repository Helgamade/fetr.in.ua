import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Order, OrderStatus } from '@/types/store';
import { useUpdateOrderStatus, useUpdateOrder } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { ordersAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

// Только рабочие статусы
const statusLabels: Record<OrderStatus, string> = {
  created: 'Замовлення оформлено',
  accepted: 'Прийнято',
  paid: 'Оплачено',
  packed: 'Спаковано',
  shipped: 'Відправлено',
  arrived: 'Прибуло',
  completed: 'Залишити відгук',
  // Старые статусы (для обратной совместимости, но не отображаются в UI)
  processing: 'В обробці',
  assembled: 'Зібрано',
  in_transit: 'В дорозі',
};

const statusColors: Record<OrderStatus, string> = {
  created: 'bg-blue-100 text-blue-800',
  accepted: 'bg-purple-100 text-purple-800',
  paid: 'bg-green-100 text-green-800',
  packed: 'bg-teal-100 text-teal-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  arrived: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-100 text-gray-800',
  // Старые статусы (для обратной совместимости)
  processing: 'bg-yellow-100 text-yellow-800',
  assembled: 'bg-cyan-100 text-cyan-800',
  in_transit: 'bg-violet-100 text-violet-800',
};

// Только рабочие статусы для отображения (автоматические статусы из orders.status)
// created не включаем, так как он всегда пропускается при создании заказа
const activeStatuses: OrderStatus[] = ['accepted', 'paid', 'packed', 'shipped', 'arrived', 'completed'];

const deliveryLabels = {
  nova_poshta: 'Нова Пошта',
  ukrposhta: 'Укрпошта',
  pickup: 'Самовивіз',
};

// Форматирование даты заказа в формате "12:57, 01.01.2026"
const formatOrderDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}, ${day}.${month}.${year}`;
};

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();
  const updateStatus = useUpdateOrderStatus();
  const updateOrder = useUpdateOrder();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryTtn, setDeliveryTtn] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'not_paid' | 'cash_on_delivery' | 'paid'>('not_paid');
  const [paidAmount, setPaidAmount] = useState<string>('');

  useEffect(() => {
    if (id) {
      ordersAPI.getOrder(id)
        .then((orderData) => {
          console.log('[OrderDetail] Order data received:', orderData);
          console.log('[OrderDetail] Analytics data:', (orderData as any).analytics);
          console.log('[OrderDetail] Has analytics:', !!(orderData as any).analytics);
          console.log('[OrderDetail] Analytics keys:', (orderData as any).analytics ? Object.keys((orderData as any).analytics) : 'none');
          setOrder(orderData);
          setDeliveryTtn(orderData.deliveryTtn || '');
          setPaymentStatus(orderData.payment?.status || 'not_paid');
          setPaidAmount(orderData.payment?.paidAmount?.toString() || '');
        })
        .catch((error) => {
          console.error('[OrderDetail] Error loading order:', error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!order) return;
    updateStatus.mutate(
      { id: order.id, status: newStatus },
      {
        onSuccess: () => {
          setOrder(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
        },
      }
    );
  };

  const handleDeliveryTtnSave = () => {
    if (!order) return;
    updateOrder.mutate(
      {
        id: order.id,
        data: {
          customer: order.customer,
          delivery: order.delivery,
          payment: order.payment,
          status: order.status,
          subtotal: order.subtotal,
          discount: order.discount,
          deliveryCost: order.deliveryCost,
          total: order.total,
          deliveryTtn: deliveryTtn || undefined,
        },
      },
      {
        onSuccess: () => {
          setOrder(prev => prev ? { ...prev, deliveryTtn: deliveryTtn || undefined } : null);
        },
      }
    );
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.code === productId)?.name || productId;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження замовлення...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Замовлення не знайдено</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/admin/orders')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Замовлення {order.id}</h1>
            {order.trackingToken && (
              <a
                href={`/thank-you?track=${order.trackingToken}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors inline-flex items-center"
                title="Відкрити сторінку відстеження замовлення"
              >
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24" focusable="false" aria-hidden="true" className="inline-block">
                  <path fill="currentColor" d="M12 4.929 9.879 7.05a1.003 1.003 0 0 0 0 1.415 1.003 1.003 0 0 0 1.414 0l2.121-2.122a3.009 3.009 0 0 1 4.243 0 3.009 3.009 0 0 1 0 4.243l-2.121 2.121a1.003 1.003 0 0 0 0 1.414 1.003 1.003 0 0 0 1.414 0l2.121-2.12a5.002 5.002 0 0 0 0-7.072 5.002 5.002 0 0 0-7.071 0Zm-2.828 9.9a1.003 1.003 0 0 0 1.414 0l4.242-4.243a1.003 1.003 0 0 0 0-1.414 1.003 1.003 0 0 0-1.414 0l-4.242 4.242a1.003 1.003 0 0 0 0 1.415Zm3.535.707-2.121 2.121a3.009 3.009 0 0 1-4.243 0 3.009 3.009 0 0 1 0-4.243l2.121-2.121a1.003 1.003 0 0 0 0-1.414 1.003 1.003 0 0 0-1.414 0L4.93 12a5.002 5.002 0 0 0 0 7.071 5.002 5.002 0 0 0 7.071 0l2.121-2.121a1.003 1.003 0 0 0 0-1.414 1.003 1.003 0 0 0-1.414 0Z"></path>
                </svg>
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
            {order.payment?.status === 'paid' ? (
              <Badge className="bg-green-100 text-green-800 text-xs">
                Оплачено
              </Badge>
            ) : order.payment?.status === 'cash_on_delivery' ? (
              <Badge className="bg-orange-100 text-orange-800 text-xs">
                Післяплата
              </Badge>
            ) : (
              <Badge className="bg-gray-100 text-gray-800 text-xs">
                Не оплачено
              </Badge>
            )}
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatOrderDate(order.createdAt)}
            </span>
          </div>
        </div>
        <Select
          value={order.status}
          onValueChange={(value) => handleStatusChange(value as OrderStatus)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {activeStatuses.map((status) => (
              <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Товари в замовленні ({order.items.length})</h2>
            <div className="space-y-4">
              {order.items.map((item, index) => {
                const product = products.find(p => p.code === item.productId);
                const basePrice = product?.basePrice || 0;
                const salePrice = product?.salePrice;
                const hasDiscount = salePrice && salePrice < basePrice;
                const productPrice = salePrice || basePrice;
                const discountPercent = hasDiscount ? Math.round(((basePrice - (salePrice || 0)) / basePrice) * 100) : 0;
                
                // Цена опций
                const optionsPrice = item.selectedOptions.reduce((total, optId) => {
                  const option = product?.options.find(o => o.code === optId);
                  return total + (option?.price || 0);
                }, 0);
                
                // Итоговая цена товара: ((Цена товара - Скидка) + Сумма опций) * Количество
                const totalPrice = (productPrice + optionsPrice) * item.quantity;
                
                // Создаем уникальный ключ на основе productId + опций + индекса
                const itemKey = `${item.productId}_${index}_${JSON.stringify([...item.selectedOptions].sort())}`;
                
                return (
                  <div key={itemKey} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    {/* Изображение */}
                    <div className="flex-shrink-0">
                      {product?.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-muted rounded flex items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Информация о товаре */}
                    <div className="flex-1 min-w-0">
                      {/* Название, скидка, количество, сумма опций и итоговая цена в одной строке */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {hasDiscount && (
                          <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                            -{discountPercent}%
                          </div>
                        )}
                        <div className="font-medium text-base flex-1 min-w-0">{getProductName(item.productId)}</div>
                        
                        {/* Сумма опций (оранжевым цветом) */}
                        {optionsPrice > 0 && (
                          <div className="text-base font-bold text-primary whitespace-nowrap ml-8">
                            +{optionsPrice} ₴
                          </div>
                        )}
                        
                        {/* Количество */}
                        <div className="text-base font-medium whitespace-nowrap ml-8">
                          {item.quantity} шт.
                        </div>
                        
                        {/* Итоговая цена */}
                        <div className="text-lg font-bold whitespace-nowrap ml-8">
                          {totalPrice.toFixed(0)} ₴
                        </div>
                      </div>
                      
                      {/* Статус */}
                      <div className="text-sm text-green-600 mb-2">Готово к отправке</div>
                      
                      {/* Цены */}
                      <div className="flex items-center gap-2 mb-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-base font-bold">{productPrice} ₴</span>
                            <span className="text-sm text-muted-foreground line-through">{basePrice} ₴</span>
                          </>
                        ) : (
                          <span className="text-base font-bold">{basePrice} ₴</span>
                        )}
                      </div>
                      
                      {/* Артикул */}
                      {product?.code && (
                        <div className="text-xs text-muted-foreground mb-1">
                          Артикул: {product.code}
                        </div>
                      )}
                      
                      {/* Остаток */}
                      {product && (
                        <div className="text-xs text-muted-foreground mb-2">
                          Остаток: {product.stock}
                        </div>
                      )}
                      
                      {/* Дополнительные опции */}
                      {item.selectedOptions.length > 0 && (
                        <div className="mb-2 mt-3">
                          <div className="text-sm font-semibold text-foreground mb-2">Дополнительные опции:</div>
                          <div className="space-y-2 max-w-md">
                            {item.selectedOptions.map((optId) => {
                              const option = product?.options.find(o => o.code === optId);
                              if (!option) return null;
                              return (
                                <div key={optId} className="flex items-center justify-between text-sm bg-primary/10 border border-primary/20 rounded-lg px-3 py-2">
                                  <span className="font-semibold text-foreground">{option.name}</span>
                                  <span className="font-bold text-primary">+{option.price} ₴</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Замовник
            </h2>
            <div className="space-y-2">
              <div className="font-medium">{order.customer.name}</div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                {order.customer.phone}
              </div>
              {order.promoCode && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Промокод:</span>
                  <span className="font-medium text-green-600">{order.promoCode}</span>
                </div>
              )}
            </div>
          </div>

          {/* Recipient (if different) */}
          {order.recipient && order.recipient.name && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Отримувач</h2>
              <div className="space-y-2">
                <div className="font-medium">{order.recipient.name}</div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4" />
                  {order.recipient.phone}
                </div>
              </div>
            </div>
          )}

          {/* Delivery */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Доставка
            </h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">{deliveryLabels[order.delivery.method]}</div>
                {order.delivery.city && (
                  <div className="text-sm">м. {order.delivery.city}</div>
                )}
                {order.delivery.warehouse && (
                  <div className="text-sm">{order.delivery.warehouse}</div>
                )}
                {order.delivery.address && (
                  <div className="text-sm">{order.delivery.address}</div>
                )}
                {order.delivery.postIndex && (
                  <div className="text-sm">Індекс: {order.delivery.postIndex}</div>
                )}
              </div>
              
              {/* ТТН поле - только для Нова Пошта и Укрпошта */}
              {(order.delivery.method === 'nova_poshta' || order.delivery.method === 'ukrposhta') && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium mb-2 block">ТТН (Трекінг-номер)</label>
                  <div className="flex gap-2">
                    <Input
                      value={deliveryTtn}
                      onChange={(e) => setDeliveryTtn(e.target.value)}
                      placeholder="Введіть номер ТТН"
                      className="flex-1"
                    />
                    <Button
                      onClick={handleDeliveryTtnSave}
                      variant="outline"
                      size="default"
                    >
                      Зберегти
                    </Button>
                  </div>
                  {order.deliveryTtn && (
                    <div className="text-xs text-muted-foreground mt-2">
                      Поточний ТТН: {order.deliveryTtn}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>


          {/* Comment */}
          {order.comment && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Коментар</h2>
              <div className="text-sm whitespace-pre-wrap">{order.comment}</div>
            </div>
          )}

          {/* Analytics Session Data */}
          {(() => {
            const hasAnalytics = !!(order as any).analytics;
            console.log('[OrderDetail Render] Has analytics:', hasAnalytics);
            console.log('[OrderDetail Render] Analytics object:', (order as any).analytics);
            if (!hasAnalytics) {
              return null;
            }
            return (
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-lg font-semibold mb-4">Аналітика сесії</h2>
                <div className="space-y-3 text-sm">
                {/* UTM параметры */}
                {((order as any).analytics.utmSource || (order as any).analytics.utmMedium || (order as any).analytics.utmCampaign) && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">UTM параметри:</div>
                    <div className="pl-4 space-y-1">
                      {(order as any).analytics.utmSource && (
                        <div>Джерело: <span className="font-medium">{(order as any).analytics.utmSource}</span></div>
                      )}
                      {(order as any).analytics.utmMedium && (
                        <div>Канал: <span className="font-medium">{(order as any).analytics.utmMedium}</span></div>
                      )}
                      {(order as any).analytics.utmCampaign && (
                        <div>Кампанія: <span className="font-medium">{(order as any).analytics.utmCampaign}</span></div>
                      )}
                      {(order as any).analytics.utmTerm && (
                        <div>Термін: <span className="font-medium">{(order as any).analytics.utmTerm}</span></div>
                      )}
                      {(order as any).analytics.utmContent && (
                        <div>Контент: <span className="font-medium">{(order as any).analytics.utmContent}</span></div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Referrer и Landing Page */}
                {((order as any).analytics.referrer || (order as any).analytics.landingPage) && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Джерела:</div>
                    <div className="pl-4 space-y-1">
                      {(order as any).analytics.referrer && (
                        <div>Реферер: <span className="font-medium break-all">{(order as any).analytics.referrer}</span></div>
                      )}
                      {(order as any).analytics.landingPage && (
                        <div>Вхідна сторінка: <span className="font-medium break-all">{(order as any).analytics.landingPage}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Device Info */}
                {((order as any).analytics.deviceType || (order as any).analytics.browser || (order as any).analytics.os) && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Пристрій:</div>
                    <div className="pl-4 space-y-1">
                      {(order as any).analytics.deviceType && (
                        <div>Тип: <span className="font-medium capitalize">{(order as any).analytics.deviceType}</span></div>
                      )}
                      {(order as any).analytics.browser && (
                        <div>Браузер: <span className="font-medium">{(order as any).analytics.browser}</span></div>
                      )}
                      {(order as any).analytics.os && (
                        <div>ОС: <span className="font-medium">{(order as any).analytics.os}</span></div>
                      )}
                      {(order as any).analytics.screenResolution && (
                        <div>Роздільність: <span className="font-medium">{(order as any).analytics.screenResolution}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Location */}
                {((order as any).analytics.ipAddress || (order as any).analytics.country || (order as any).analytics.city) && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Локація:</div>
                    <div className="pl-4 space-y-1">
                      {(order as any).analytics.ipAddress && (
                        <div>IP: <span className="font-mono font-medium">{(order as any).analytics.ipAddress.split(',')[0].trim()}</span></div>
                      )}
                      {(order as any).analytics.country && (
                        <div>Країна: <span className="font-medium">{(order as any).analytics.country}</span></div>
                      )}
                      {(order as any).analytics.city && (
                        <div>Місто: <span className="font-medium">{(order as any).analytics.city}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {/* Session Stats */}
                {(((order as any).analytics.pagesViewed !== null && (order as any).analytics.pagesViewed !== undefined) ||
                   ((order as any).analytics.totalTimeSpent !== null && (order as any).analytics.totalTimeSpent !== undefined) ||
                   ((order as any).analytics.cartItemsCount !== null && (order as any).analytics.cartItemsCount !== undefined)) && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Статистика сесії:</div>
                    <div className="pl-4 space-y-1">
                      {(order as any).analytics.pagesViewed !== null && (order as any).analytics.pagesViewed !== undefined && (
                        <div>Переглянуто сторінок: <span className="font-medium">{(order as any).analytics.pagesViewed}</span></div>
                      )}
                      {(order as any).analytics.totalTimeSpent !== null && (order as any).analytics.totalTimeSpent !== undefined && (
                        <div>Час на сайті: <span className="font-medium">{Math.floor((order as any).analytics.totalTimeSpent / 60)} хв {((order as any).analytics.totalTimeSpent % 60)} сек</span></div>
                      )}
                      {(order as any).analytics.cartItemsCount !== null && (order as any).analytics.cartItemsCount !== undefined && (
                        <div>Товарів у кошику: <span className="font-medium">{(order as any).analytics.cartItemsCount}</span></div>
                      )}
                    </div>
                  </div>
                )}

                {(order as any).analytics.language && (
                  <div className="space-y-1">
                    <div className="font-medium text-muted-foreground">Мова:</div>
                    <div className="pl-4">
                      <span className="font-medium">{(order as any).analytics.language}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Total */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Підсумок</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Товари ({order.items.length})</span>
                <span>₴{order.subtotal}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Знижка</span>
                  <span>-₴{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Доставка</span>
                <span>{order.deliveryCost > 0 ? `₴${order.deliveryCost}` : 'Безкоштовно'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Всього</span>
                <span>₴{order.total}</span>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Оплата
            </h2>
            <div className="space-y-4">
              <div className="text-sm">
                {order.payment.method === 'wayforpay' && 'Онлайн оплата (WayForPay)'}
                {order.payment.method === 'nalojka' && 'Накладений платіж'}
                {order.payment.method === 'fopiban' && 'Оплата на рахунок ФОП'}
              </div>
              
              {/* Статус оплаты */}
              <div className="pt-4 border-t">
                <label className="text-sm font-medium mb-2 block">Статус оплати</label>
                <Select
                  value={paymentStatus}
                  onValueChange={(value) => setPaymentStatus(value as 'not_paid' | 'cash_on_delivery' | 'paid')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_paid">Не оплачено</SelectItem>
                    <SelectItem value="cash_on_delivery">Післяплата</SelectItem>
                    <SelectItem value="paid">Оплачено</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Сумма оплаты */}
              <div className="pt-2">
                <label className="text-sm font-medium mb-2 block">Сума оплати (₴)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              
              {/* Кнопка сохранения */}
              <div className="pt-2">
                <Button
                  onClick={() => {
                    if (!order) return;
                    updateOrder.mutate(
                      {
                        id: order.id,
                        data: {
                          customer: order.customer,
                          delivery: order.delivery,
                          payment: {
                            ...order.payment,
                            status: paymentStatus,
                            paidAmount: paidAmount ? parseFloat(paidAmount) : null
                          },
                          status: order.status,
                          subtotal: order.subtotal,
                          discount: order.discount,
                          deliveryCost: order.deliveryCost,
                          total: order.total,
                          deliveryTtn: order.deliveryTtn,
                        },
                      },
                      {
                        onSuccess: () => {
                          setOrder(prev => prev ? {
                            ...prev,
                            payment: {
                              ...prev.payment,
                              status: paymentStatus,
                              paidAmount: paidAmount ? parseFloat(paidAmount) : null
                            }
                          } : null);
                          toast({
                            title: 'Збережено',
                            description: 'Дані оплати оновлено',
                          });
                        },
                        onError: (error: Error) => {
                          toast({
                            title: 'Помилка',
                            description: error.message || 'Не вдалося зберегти дані оплати',
                            variant: 'destructive',
                          });
                        },
                      }
                    );
                  }}
                  variant="outline"
                  size="default"
                  className="w-full"
                >
                  Зберегти зміни оплати
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

