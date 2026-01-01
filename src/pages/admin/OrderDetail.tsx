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
        .then(setOrder)
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
          <h1 className="text-2xl font-bold">Замовлення {order.id}</h1>
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
                const productPrice = product?.salePrice || product?.basePrice || 0;
                const basePrice = product?.basePrice || 0;
                const hasDiscount = product?.salePrice && product.salePrice < product.basePrice;
                const discountPerItem = hasDiscount ? basePrice - (product.salePrice || 0) : 0;
                const optionsPrice = item.selectedOptions.reduce((total, optId) => {
                  const option = product?.options.find(o => o.code === optId);
                  return total + (option?.price || 0);
                }, 0);
                const itemSubtotal = (productPrice + optionsPrice) * item.quantity;
                const itemDiscount = discountPerItem * item.quantity;
                const itemTotal = itemSubtotal - itemDiscount;
                
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
                      <div className="font-medium text-base">{getProductName(item.productId)}</div>
                      
                      {/* Статус (если есть) */}
                      <div className="text-sm text-green-600 mt-1">Готово к отправке</div>
                      
                      {/* Цена и количество */}
                      <div className="flex items-center gap-3 mt-2">
                        {hasDiscount ? (
                          <>
                            <span className="text-lg font-bold">{productPrice} ₴</span>
                            <span className="text-sm text-muted-foreground line-through">{basePrice} ₴</span>
                            <span className="text-sm text-green-600">-{discountPerItem.toFixed(0)} ₴</span>
                          </>
                        ) : (
                          <span className="text-lg font-bold">{productPrice} ₴</span>
                        )}
                      </div>
                      
                      {/* Артикул */}
                      {product?.code && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Артикул: {product.code}
                        </div>
                      )}
                      
                      {/* Остаток */}
                      {product && (
                        <div className="text-xs text-muted-foreground">
                          Остаток: {product.stock}
                        </div>
                      )}
                      
                      {/* Количество */}
                      <div className="text-sm mt-2">
                        {item.quantity} {item.quantity === 1 ? 'шт.' : 'шт.'}
                      </div>
                      
                      {/* Дополнительные опции */}
                      {item.selectedOptions.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Дополнительные опции:</div>
                          <div className="space-y-1">
                            {item.selectedOptions.map((optId) => {
                              const option = product?.options.find(o => o.code === optId);
                              if (!option) return null;
                              return (
                                <div key={optId} className="flex items-center justify-between text-sm bg-muted/50 rounded px-2 py-1">
                                  <span className="font-medium">{option.name}</span>
                                  <span className="text-muted-foreground">+{option.price} ₴</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Итого за товар */}
                      <div className="flex justify-between items-center mt-3 pt-3 border-t">
                        <span className="text-sm font-medium">Итого за товар:</span>
                        <span className="text-lg font-bold">{itemTotal.toFixed(0)} ₴</span>
                      </div>
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
              {order.payment.method === 'card' && 'Онлайн оплата (WayForPay)'}
              {order.payment.method === 'cod' && 'Накладений платіж'}
              {order.payment.method === 'fop' && 'Оплата на рахунок ФОП'}
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

