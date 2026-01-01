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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Order, OrderStatus } from '@/types/store';
import { useUpdateOrderStatus } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { ordersAPI } from '@/lib/api';

const statusLabels: Record<OrderStatus, string> = {
  created: 'Новий',
  accepted: 'Прийнято',
  processing: 'В обробці',
  awaiting_payment: 'Очікує оплату',
  paid: 'Оплачено',
  assembled: 'Зібрано',
  packed: 'Запаковано',
  shipped: 'Відправлено',
  in_transit: 'В дорозі',
  arrived: 'Прибуло',
  completed: 'Виконано',
};

const statusColors: Record<OrderStatus, string> = {
  created: 'bg-blue-100 text-blue-800',
  accepted: 'bg-purple-100 text-purple-800',
  processing: 'bg-yellow-100 text-yellow-800',
  awaiting_payment: 'bg-orange-100 text-orange-800',
  paid: 'bg-green-100 text-green-800',
  assembled: 'bg-cyan-100 text-cyan-800',
  packed: 'bg-teal-100 text-teal-800',
  shipped: 'bg-indigo-100 text-indigo-800',
  in_transit: 'bg-violet-100 text-violet-800',
  arrived: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-gray-100 text-gray-800',
};

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
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      ordersAPI.getOrder(id)
        .then((orderData) => {
          console.log('[OrderDetail] Order data received:', orderData);
          console.log('[OrderDetail] trackingToken:', orderData.trackingToken);
          setOrder(orderData);
        })
        .catch(console.error)
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
            {(order.trackingToken || (order as any).tracking_token) && (
              <a
                href={`/thank-you?track=${order.trackingToken || (order as any).tracking_token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors text-sm underline"
                title="Відкрити сторінку відстеження замовлення"
              >
                [Відстежити]
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={statusColors[order.status]}>
              {statusLabels[order.status]}
            </Badge>
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
            {Object.entries(statusLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
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
              {order.items.map((item) => {
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
                
                return (
                  <div key={item.productId} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
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
          </div>

          {/* Payment */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Оплата
            </h2>
            <div className="text-sm">
              {order.payment.method === 'wayforpay' && 'Онлайн оплата (WayForPay)'}
              {order.payment.method === 'nalojka' && 'Накладений платіж'}
              {order.payment.method === 'fopiban' && 'Оплата на рахунок ФОП'}
            </div>
          </div>

          {/* Comment */}
          {order.comment && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4">Коментар</h2>
              <div className="text-sm whitespace-pre-wrap">{order.comment}</div>
            </div>
          )}
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
        </div>
      </div>
    </div>
  );
}

