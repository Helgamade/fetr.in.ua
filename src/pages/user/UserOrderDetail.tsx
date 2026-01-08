import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  CheckCircle2,
  Circle,
  Copy,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Order, OrderStatus } from '@/types/store';
import { ordersAPI } from '@/lib/api';
import { useProducts } from '@/hooks/useProducts';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { Helmet } from 'react-helmet-async';

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
  created: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  accepted: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  awaiting_payment: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  assembled: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  packed: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  shipped: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  in_transit: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200',
  arrived: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

const deliveryLabels = {
  nova_poshta: 'Нова Пошта',
  ukrposhta: 'Укрпошта',
  pickup: 'Самовивіз',
};

// Форматирование даты в формате "09:43, 05.01.2026"
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${hours}:${minutes}, ${day}.${month}.${year}`;
};

// Генерация базовой истории заказа (если нет истории из БД)
const generateDefaultHistory = (order: Order) => {
  const history: Array<{ date: Date; text: string; completed: boolean; user?: string | null }> = [];
  
  const createdAt = typeof order.createdAt === 'string' ? new Date(order.createdAt) : order.createdAt;
  
  // Создание заказа
  history.push({
    date: createdAt,
    text: 'Статус изменен: Новый',
    completed: true,
  });
  
  return history;
};

export default function UserOrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: products = [] } = useProducts();
  const { toast } = useToast();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Получаем историю заказа
  const { data: orderHistory = [] } = useQuery({
    queryKey: ['order-history', id],
    queryFn: () => ordersAPI.getHistory(id!),
    enabled: !!id,
  });

  useEffect(() => {
    if (id) {
      ordersAPI.getOrder(id)
        .then((orderData: any) => {
          // Проверяем доступ: админы могут видеть все заказы, обычные пользователи - только свои
          if (user?.role !== 'admin' && orderData.user_id && orderData.user_id !== user?.id) {
            navigate('/user/orders');
            return;
          }
          setOrder(orderData);
        })
        .catch((error) => {
          console.error('Error loading order:', error);
          navigate('/user/orders');
        })
        .finally(() => setIsLoading(false));
    }
  }, [id, user, navigate]);

  const getProductName = (productId: string) => {
    return products.find(p => p.code === productId)?.name || productId;
  };

  const handleCopyTTN = async () => {
    if (!order?.deliveryTtn) return;
    
    try {
      await navigator.clipboard.writeText(order.deliveryTtn);
      setCopied(true);
      toast({
        title: 'Скопійовано',
        description: 'ТТН скопійовано в буфер обміну',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося скопіювати ТТН',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-muted-foreground">Завантаження замовлення...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-muted-foreground">Замовлення не знайдено</div>
      </div>
    );
  }

  // Используем историю из БД, если есть, иначе генерируем базовую
  const history = orderHistory.length > 0 
    ? orderHistory.map(h => ({
        date: typeof h.date === 'string' ? new Date(h.date) : h.date,
        text: h.text,
        completed: h.completed,
        user: h.user || null,
      }))
    : generateDefaultHistory(order);

  const orderNumber = order.orderNumber || order.id || id || '';

  return (
    <>
      <Helmet>
        <title>Замовлення {orderNumber} | FetrInUA</title>
        <meta property="og:title" content={`Замовлення ${orderNumber} | FetrInUA`} />
      </Helmet>
      <div className="min-h-screen bg-muted/30">
      <div className="container max-w-7xl mx-auto space-y-6 p-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/user/orders')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">Замовлення {order.id}</h1>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(order.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Товари в замовленні ({order.items.length})</CardTitle>
              </CardHeader>
              <CardContent>
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
                    
                    // Итоговая цена товара
                    const totalPrice = (productPrice + optionsPrice) * item.quantity;
                    
                    const itemKey = `${item.productId}_${index}_${JSON.stringify([...item.selectedOptions].sort())}`;
                    
                    return (
                      <div key={itemKey} className="pb-4 border-b last:border-0 last:pb-0">
                        <div className="flex gap-3 sm:gap-4">
                          {/* Изображение */}
                          <div className="flex-shrink-0">
                            {product?.images && product.images.length > 0 ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded flex items-center justify-center">
                                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Информация о товаре */}
                          <div className="flex-1 min-w-0">
                            {/* Название и бейдж скидки */}
                            <div className="flex items-start gap-2 mb-2">
                              {hasDiscount && (
                                <div className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                                  -{discountPercent}%
                                </div>
                              )}
                              <div className="font-medium text-base sm:text-lg flex-1 min-w-0">{getProductName(item.productId)}</div>
                            </div>
                            
                            {/* Цена товара и количество */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="text-sm sm:text-base text-muted-foreground">
                                Кількість: <span className="font-semibold text-foreground">{item.quantity} шт.</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {hasDiscount ? (
                                  <>
                                    <span className="text-sm text-muted-foreground line-through">{basePrice} ₴</span>
                                    <span className="text-base sm:text-lg font-bold">{productPrice} ₴</span>
                                  </>
                                ) : (
                                  <span className="text-base sm:text-lg font-bold">{basePrice} ₴</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Дополнительные опции */}
                            {item.selectedOptions.length > 0 && (
                              <div className="mb-2 mt-2">
                                <div className="text-xs sm:text-sm font-semibold text-foreground mb-2">Додаткові опції:</div>
                                <div className="space-y-1.5">
                                  {item.selectedOptions.map((optId) => {
                                    const option = product?.options.find(o => o.code === optId);
                                    if (!option) return null;
                                    return (
                                      <div key={optId} className="flex items-center justify-between text-xs sm:text-sm bg-primary/10 border border-primary/20 rounded-lg px-2 sm:px-3 py-1.5 sm:py-2">
                                        <span className="font-medium text-foreground">{option.name}</span>
                                        <span className="font-bold text-primary">+{option.price} ₴</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Итоговая цена товара */}
                            <div className="mt-3 pt-3 border-t border-border">
                              <div className="flex items-center justify-between">
                                <span className="text-sm sm:text-base font-medium">Сума за товар:</span>
                                <span className="text-lg sm:text-xl font-bold text-primary">{totalPrice.toFixed(0)} ₴</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Delivery */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Доставка
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                  {/* ТТН показываем только для Нова Пошта и Укрпошта */}
                  {order.deliveryTtn && (order.delivery.method === 'nova_poshta' || order.delivery.method === 'ukrposhta') && (
                    <div className="mt-4 pt-4 border-t">
                      <label className="text-sm font-medium mb-2 block">ТТН</label>
                      <div className="flex gap-2">
                        <Input
                          value={order.deliveryTtn}
                          readOnly
                          className="flex-1 font-mono"
                        />
                        <Button
                          onClick={handleCopyTTN}
                          variant="outline"
                          size="icon"
                          className="flex-shrink-0"
                        >
                          {copied ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Оплата
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">
                  {order.payment.method === 'wayforpay' && 'Онлайн оплата (WayForPay)'}
                  {order.payment.method === 'nalojka' && 'Накладений платіж'}
                  {order.payment.method === 'fopiban' && 'Оплата на рахунок ФОП'}
                </div>
              </CardContent>
            </Card>

            {/* Order History Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Історія замовлення</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  {history.map((item, index) => (
                    <div key={index} className="relative pl-8 pb-6 last:pb-0">
                      {/* Линия */}
                      {index < history.length - 1 && (
                        <div className="absolute left-3 top-6 bottom-0 w-0.5 bg-border" />
                      )}
                      
                      {/* Точка */}
                      <div className="absolute left-0 top-1">
                        {item.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-primary fill-primary/20" />
                        ) : (
                          <Circle className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Контент */}
                      <div>
                        <div className="text-sm font-medium text-foreground">
                          {formatDate(item.date)}
                          {item.user && (
                            <span className="text-muted-foreground ml-2">, {item.user}</span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {item.text}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Total */}
            <Card>
              <CardHeader>
                <CardTitle>Підсумок</CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border my-8" />
        <footer className="text-center space-y-2 pb-8">
          <p className="text-sm text-muted-foreground">
            © 2026 FetrInUA. Всі права захищені
          </p>
          <p className="text-sm text-muted-foreground">
            Зроблено з ❤️ в Україні
          </p>
        </footer>
      </div>
    </div>
    </>
  );
}

