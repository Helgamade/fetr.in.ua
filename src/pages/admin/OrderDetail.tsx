import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Calendar,
  User,
  Pencil,
  Trash2,
  Plus,
  CheckCircle
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
import { Order, OrderStatus, CartItem, CustomerInfo, RecipientInfo, DeliveryInfo, PaymentInfo } from '@/types/store';
import { useUpdateOrderStatus, useUpdateOrder } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';
import { ordersAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CustomerRecipientForm } from '@/components/checkout/CustomerRecipientForm';
import { DeliveryForm } from '@/components/checkout/DeliveryForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { NovaPoshtaLogo, UkrposhtaLogo, PickupLogo } from '@/components/DeliveryLogos';
import { CODPaymentLogo, WayForPayLogo, FOPPaymentLogo } from '@/components/PaymentLogos';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useTexts, SiteText } from '@/hooks/useTexts';

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
  const { data: storeSettings = {} } = usePublicSettings();
  const { data: textsData } = useTexts();
  const texts: SiteText[] = Array.isArray(textsData) ? textsData : [];
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deliveryTtn, setDeliveryTtn] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'not_paid' | 'cash_on_delivery' | 'paid'>('not_paid');
  const [paidAmount, setPaidAmount] = useState<string>('');
  
  // Состояния для редактирования
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState(false);
  const [editingPayment, setEditingPayment] = useState(false);
  const [editingItems, setEditingItems] = useState(false);
  const [localItems, setLocalItems] = useState<CartItem[]>([]);
  
  // Состояние валидации доставки из DeliveryForm
  const [deliveryValidation, setDeliveryValidation] = useState<boolean | null>(null);
  
  // Флаг завершенности контактов (как в Checkout - formData.contactInfoCompleted)
  const [contactInfoCompleted, setContactInfoCompleted] = useState(false);

  // Получаем тексты способов доставки
  const deliveryNovaPoshtaTitle = texts.find(t => t.key === 'checkout.delivery.nova_poshta.title')?.value || 'Нова Пошта';
  const deliveryUkrposhtaTitle = texts.find(t => t.key === 'checkout.delivery.ukrposhta.title')?.value || 'Укрпошта';
  const deliveryPickupTitle = texts.find(t => t.key === 'checkout.delivery.pickup.title')?.value || 'Самовивіз';

  // Получаем тексты способов оплаты
  const paymentWayForPayTitle = texts.find(t => t.key === 'checkout.payment.wayforpay.title')?.value || 'Онлайн оплата';
  const paymentWayForPayDescription = texts.find(t => t.key === 'checkout.payment.wayforpay.description')?.value || 'Безпечна оплата карткою через WayForPay';
  const paymentNalojkaTitle = texts.find(t => t.key === 'checkout.payment.nalojka.title')?.value || 'Оплата при отриманні';
  const paymentFopTitle = texts.find(t => t.key === 'checkout.payment.fop.title')?.value || 'Оплата на рахунок ФОП';
  const paymentFopDescription = texts.find(t => t.key === 'checkout.payment.fop.description')?.value || 'Оплата на банківський рахунок ФОП';

  // Функции валидации (ОБЯЗАТЕЛЬНО ПЕРЕД использованием!)
  const validateCyrillic = (value: string): boolean => {
    const cyrillicRegex = /^[а-яА-ЯіІїЇєЄґҐ\s-]+$/;
    return cyrillicRegex.test(value);
  };

  useEffect(() => {
    if (id) {
      ordersAPI.getOrder(id)
        .then((orderData) => {
          console.log('[OrderDetail] Order data received:', orderData);
          console.log('[OrderDetail] Analytics data:', (orderData as any).analytics);
          console.log('[OrderDetail] Has analytics:', !!(orderData as any).analytics);
          console.log('[OrderDetail] Analytics keys:', (orderData as any).analytics ? Object.keys((orderData as any).analytics) : 'none');
          setOrder(orderData);
          setLocalItems(orderData.items.map((item, index) => ({
            ...item,
            id: item.id || `item_${index}_${Date.now()}`
          })));
          setDeliveryTtn(orderData.deliveryTtn || '');
          setPaymentStatus(orderData.payment?.status || 'not_paid');
          setPaidAmount(orderData.payment?.paidAmount?.toString() || '');
          
          // Инициализация валидации доставки при загрузке заказа
          if (orderData.delivery) {
            if (orderData.delivery.method === 'pickup') {
              setDeliveryValidation(true);
            } else if (orderData.delivery.method === 'nova_poshta') {
              const hasCity = !!(orderData.delivery.city && orderData.delivery.cityRef);
              const hasWarehouse = !!(orderData.delivery.warehouse && orderData.delivery.warehouseRef);
              setDeliveryValidation(hasCity && hasWarehouse);
            } else if (orderData.delivery.method === 'ukrposhta') {
              const hasCity = !!(orderData.delivery.city && orderData.delivery.cityRef);
              const hasBranch = !!(orderData.delivery.warehouse && orderData.delivery.warehouseRef);
              setDeliveryValidation(hasCity && hasBranch);
            } else {
              setDeliveryValidation(false);
            }
          }
          
          // Инициализация состояния редактирования контактов (как в Checkout)
          // В Checkout валидация вычисляется на каждый рендер, здесь тоже
          // Просто устанавливаем флаг завершенности если данные валидны
          if (orderData.customer) {
            const phone = orderData.customer.phone || '';
            const cleanPhone = phone === "" || phone === "+380" ? "" : phone;
            const isPhoneValid = cleanPhone.replace(/\D/g, '').length === 12 && cleanPhone.replace(/\D/g, '').startsWith('380');
            const lastName = orderData.customer.lastName || '';
            const isLastNameValid = lastName.trim() !== "" && validateCyrillic(lastName);
            const firstName = orderData.customer.firstName || '';
            const isFirstNameValid = firstName.trim() !== "" && validateCyrillic(firstName);
            
            // Проверка получателя (если указан)
            let isRecipientValid = true;
            if (orderData.recipient) {
              const recipientPhone = orderData.recipient.phone || '';
              const cleanRecipientPhone = recipientPhone === "" || recipientPhone === "+380" ? "" : recipientPhone;
              const isRecipientPhoneValid = cleanRecipientPhone.replace(/\D/g, '').length === 12 && cleanRecipientPhone.replace(/\D/g, '').startsWith('380');
              const recipientLastName = orderData.recipient.lastName || '';
              const isRecipientLastNameValid = recipientLastName.trim() !== "" && validateCyrillic(recipientLastName);
              const recipientFirstName = orderData.recipient.firstName || '';
              const isRecipientFirstNameValid = recipientFirstName.trim() !== "" && validateCyrillic(recipientFirstName);
              isRecipientValid = isRecipientPhoneValid && isRecipientLastNameValid && isRecipientFirstNameValid;
            }
            
            const contactValid = isPhoneValid && isLastNameValid && isFirstNameValid && isRecipientValid;
            
            // Устанавливаем флаг завершенности (как в Checkout - formData.contactInfoCompleted)
            setContactInfoCompleted(contactValid);
            
            // Если валидно, блок свернут по умолчанию (как в Checkout)
            if (contactValid) {
              setEditingCustomer(false);
            }
          }
        })
        .catch((error) => {
          console.error('[OrderDetail] Error loading order:', error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  // Валидация контактов (ТОЧНО КАК В CHECKOUT - без useMemo, просто вычисления)
  // В Checkout строка 513-524 - валидация вычисляется прямо в теле компонента
  const isPhoneValid = order?.customer?.phone 
    ? ((order.customer.phone === "" || order.customer.phone === "+380" ? "" : order.customer.phone).replace(/\D/g, '').length === 12 && (order.customer.phone === "" || order.customer.phone === "+380" ? "" : order.customer.phone).replace(/\D/g, '').startsWith('380'))
    : false;
  
  const isLastNameValid = order?.customer?.lastName 
    ? (order.customer.lastName.trim() !== "" && validateCyrillic(order.customer.lastName))
    : false;
    
  const isFirstNameValid = order?.customer?.firstName 
    ? (order.customer.firstName.trim() !== "" && validateCyrillic(order.customer.firstName))
    : false;
  
  // Валидация для полей получателя (только если указан получатель)
  const isRecipientPhoneValid = !order?.recipient || ((order.recipient.phone === "" || order.recipient.phone === "+380" ? "" : order.recipient.phone).replace(/\D/g, '').length === 12 && (order.recipient.phone === "" || order.recipient.phone === "+380" ? "" : order.recipient.phone).replace(/\D/g, '').startsWith('380'));
  const isRecipientLastNameValid = !order?.recipient || (order.recipient.lastName.trim() !== "" && validateCyrillic(order.recipient.lastName));
  const isRecipientFirstNameValid = !order?.recipient || (order.recipient.firstName.trim() !== "" && validateCyrillic(order.recipient.firstName));
  const isRecipientInfoValid = !order?.recipient || (isRecipientPhoneValid && isRecipientLastNameValid && isRecipientFirstNameValid);
  
  const isContactInfoValid = isPhoneValid && isLastNameValid && isFirstNameValid && isRecipientInfoValid;

  // Пересчет цены заказа
  const recalculateOrder = useMemo(() => {
    if (!order || localItems.length === 0) return null;

    let subtotal = 0; // Сумма БЕЗ скидки (basePrice)
    let discount = 0; // Общая скидка

    localItems.forEach(item => {
      const product = products.find(p => p.code === item.productId);
      if (!product) return;

      const basePrice = product.basePrice || 0;
      const salePrice = product.salePrice;
      const productPrice = salePrice || basePrice; // Цена товара (со скидкой если есть)
      
      // Цена опций
      const optionsPrice = item.selectedOptions.reduce((total, optId) => {
        const option = product.options.find(o => o.code === optId);
        return total + (option?.price || 0);
      }, 0);

      // Subtotal считаем по базовой цене (БЕЗ скидки)
      const itemSubtotal = (basePrice + optionsPrice) * item.quantity;
      subtotal += itemSubtotal;

      // Скидка на товар (разница между базовой и скидочной ценой)
      if (salePrice && salePrice < basePrice) {
        discount += (basePrice - salePrice) * item.quantity;
      }
    });

    // Стоимость доставки (пока используем существующую)
    const deliveryCost = order.deliveryCost || 0;
    // Total = subtotal (базовая цена) - discount (скидка) + deliveryCost
    const total = subtotal - discount + deliveryCost;

    return {
      subtotal,
      discount,
      deliveryCost,
      total,
    };
  }, [order, localItems, products]);

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

  const handleSaveOrder = async (updates: Partial<Order>) => {
    if (!order) return;

    const newOrder = {
      ...order,
      ...updates,
      items: localItems,
      ...(recalculateOrder ? {
        subtotal: recalculateOrder.subtotal,
        discount: recalculateOrder.discount,
        total: recalculateOrder.total,
      } : {}),
    };

    try {
      await updateOrder.mutateAsync({
        id: order.id,
        data: {
          customer: newOrder.customer,
          recipient: newOrder.recipient,
          delivery: newOrder.delivery,
          payment: newOrder.payment,
          status: newOrder.status,
          subtotal: newOrder.subtotal,
          discount: newOrder.discount,
          deliveryCost: newOrder.deliveryCost,
          total: newOrder.total,
          deliveryTtn: newOrder.deliveryTtn,
          items: localItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            selectedOptions: item.selectedOptions,
          })),
        },
      });
      
      setOrder(newOrder);
      setEditingCustomer(false);
      setEditingDelivery(false);
      setEditingPayment(false);
      setEditingItems(false);
      
      toast({
        title: 'Збережено',
        description: 'Замовлення оновлено',
      });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося зберегти зміни',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setLocalItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleUpdateItemQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    setLocalItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  // Проверка частичной заполненности контактов (для оранжевой иконки)
  const isContactInfoPartiallyFilled = useMemo(() => {
    if (!order?.customer) return false;
    const phone = order.customer.phone || '';
    const firstName = order.customer.firstName || '';
    const lastName = order.customer.lastName || '';
    return !!(phone || firstName || lastName);
  }, [order?.customer]);

  // Получить текущие данные доставки (как в Checkout)
  const getCurrentDeliveryData = useMemo(() => {
    if (!order?.delivery) return null;
    
    if (order.delivery.method === 'nova_poshta') {
      // Для Новой Почты проверяем наличие всех необходимых полей
      // Используем валидацию из DeliveryForm если доступна, иначе проверяем базовые поля
      const hasCity = !!(order.delivery.city && order.delivery.cityRef);
      const hasWarehouse = !!(order.delivery.warehouse && order.delivery.warehouseRef);
      const completed = deliveryValidation !== null ? deliveryValidation : (hasCity && hasWarehouse);
      return {
        city: order.delivery.city,
        warehouse: order.delivery.warehouse,
        completed,
      };
    } else if (order.delivery.method === 'ukrposhta') {
      // Для Укрпошта проверяем наличие всех необходимых полей
      const hasCity = !!(order.delivery.city && order.delivery.cityRef);
      const hasBranch = !!(order.delivery.warehouse && order.delivery.warehouseRef);
      const completed = deliveryValidation !== null ? deliveryValidation : (hasCity && hasBranch);
      return {
        city: order.delivery.city,
        branch: order.delivery.warehouse,
        postalCode: order.delivery.postIndex,
        address: order.delivery.address,
        completed,
      };
    } else if (order.delivery.method === 'pickup') {
      return {
        completed: true,
      };
    }
    return null;
  }, [order?.delivery, deliveryValidation]);

  // Проверка валидности доставки (как в Checkout - используем completed флаг)
  const isDeliveryValid = useMemo(() => {
    // Если есть валидация из DeliveryForm, используем её
    if (deliveryValidation !== null) {
      return deliveryValidation;
    }
    // Иначе проверяем базовые поля
    return getCurrentDeliveryData?.completed || false;
  }, [getCurrentDeliveryData, deliveryValidation]);


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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Товари в замовленні ({localItems.length})</h2>
              <div className="flex gap-2">
                {!editingItems ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItems(true)}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Редагувати
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setLocalItems(order.items.map((item, index) => ({
                          ...item,
                          id: item.id || `item_${index}_${Date.now()}`
                        })));
                        setEditingItems(false);
                      }}
                    >
                      Скасувати
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleSaveOrder({ items: localItems })}
                    >
                      Зберегти
                    </Button>
                  </>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {localItems.map((item, index) => {
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

                      {/* Кнопки редактирования */}
                      {editingItems && (
                        <div className="flex gap-2 mt-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const newQuantity = item.quantity - 1;
                                if (newQuantity >= 1) {
                                  handleUpdateItemQuantity(item.id, newQuantity);
                                }
                              }}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                handleUpdateItemQuantity(item.id, qty);
                              }}
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUpdateItemQuantity(item.id, item.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {editingItems && (
              <div className="mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    // TODO: Открыть модальное окно для добавления товара
                    toast({
                      title: 'Увага',
                      description: 'Функція додавання товарів буде реалізована наступним кроком',
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Додати товар
                </Button>
              </div>
            )}
          </div>

          {/* Contact Info - объединенный блок для Замовник и Отримувач */}
          <div className="bg-card rounded-lg border p-6">
            <h2 
              className="text-lg font-bold flex items-center gap-2 cursor-pointer mb-4"
              onClick={() => {
                // Всегда сворачиваем/разворачиваем при клике (как в Checkout и других блоках)
                setEditingCustomer(!editingCustomer);
              }}
            >
              {isContactInfoValid && contactInfoCompleted ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (isContactInfoPartiallyFilled ? (
                <span className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-medium">1</span>
              ) : (
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">1</span>
              ))}
              Контактні дані *
            </h2>
            {isContactInfoValid && contactInfoCompleted && !editingCustomer ? (
              // Свернутый вид с информацией (как в Checkout)
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Замовник</div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm">{order.customer?.lastName} {order.customer?.firstName}</div>
                    <button
                      type="button"
                      onClick={() => setEditingCustomer(true)}
                      className="text-muted-foreground hover:text-primary"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm">{order.customer?.phone}</div>
                </div>
                {order.recipient && (
                  <div className="space-y-1 pt-2 border-t">
                    <div className="text-xs text-muted-foreground">Отримувач</div>
                    <div className="text-sm">{order.recipient.lastName} {order.recipient.firstName}</div>
                    <div className="text-sm">{order.recipient.phone}</div>
                  </div>
                )}
              </div>
            ) : (
              <CustomerRecipientForm
                customer={order.customer}
                recipient={order.recipient}
                onSave={(customer, recipient) => {
                  handleSaveOrder({ customer, recipient });
                  // Устанавливаем флаг после сохранения (ТОЧНО как в Checkout строка 1478)
                  setContactInfoCompleted(true);
                  setEditingCustomer(false);
                }}
                onCancel={() => setEditingCustomer(false)}
                mode="view"
                defaultExpanded={editingCustomer}
                isCompleted={isContactInfoValid}
                onToggleExpanded={() => setEditingCustomer(!editingCustomer)}
              />
            )}
            {order.promoCode && (
              <div className="flex items-center gap-2 text-sm mt-4 pt-4 border-t">
                <span className="text-muted-foreground">Промокод:</span>
                <span className="font-medium text-green-600">{order.promoCode}</span>
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="bg-card rounded-lg border p-6">
            <h2 
              className="text-lg font-bold flex items-center gap-2 cursor-pointer mb-4"
              onClick={() => {
                if (isDeliveryValid) {
                  setEditingDelivery(!editingDelivery);
                }
              }}
            >
              {isDeliveryValid ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">2</span>
              )}
              Доставка *
            </h2>
            {editingDelivery ? (
              <DeliveryForm
                delivery={order.delivery}
                onSave={(delivery) => {
                  handleSaveOrder({ delivery });
                }}
                onCancel={() => setEditingDelivery(false)}
                mode="edit"
                defaultExpanded={true}
                orderTotal={recalculateOrder?.total || order.total}
                isCompleted={isDeliveryValid}
                onToggleExpanded={() => setEditingDelivery(!editingDelivery)}
                onValidationChange={(isValid) => setDeliveryValidation(isValid)}
              />
            ) : (
              // Свернутый вид (как в Checkout)
              <div className="space-y-2">
                {(() => {
                  const deliveryData = getCurrentDeliveryData;
                  if (order.delivery.method === 'nova_poshta' && deliveryData) {
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <NovaPoshtaLogo className="w-5 h-5" />
                            {deliveryNovaPoshtaTitle}
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingDelivery(true)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                        {deliveryData.city && <div className="text-sm">{deliveryData.city}</div>}
                        {deliveryData.warehouse && <div className="text-sm">{deliveryData.warehouse}</div>}
                      </>
                    );
                  } else if (order.delivery.method === 'ukrposhta' && deliveryData) {
                    const cityDisplayName = deliveryData.city || '';
                    const fullAddress = deliveryData.postalCode && deliveryData.address
                      ? `${deliveryData.postalCode} ${cityDisplayName.replace(/\s*\([^)]*\)\s*$/, '')}, ${deliveryData.address}`
                      : deliveryData.branch || '';
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <UkrposhtaLogo className="w-5 h-5" />
                            {deliveryUkrposhtaTitle}
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingDelivery(true)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                        {cityDisplayName && <div className="text-sm">{cityDisplayName}</div>}
                        {fullAddress && <div className="text-sm">{fullAddress}</div>}
                      </>
                    );
                  } else if (order.delivery.method === 'pickup') {
                    return (
                      <>
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <PickupLogo className="w-5 h-5" />
                            {deliveryPickupTitle}
                          </div>
                          <button
                            type="button"
                            onClick={() => setEditingDelivery(true)}
                            className="text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="text-sm">{storeSettings.store_address || 'м. Київ, вул. Урлівська 30'}</div>
                      </>
                    );
                  }
                  return null;
                })()}
              </div>
            )}
          </div>

          {/* Payment */}
          <div className="bg-card rounded-lg border p-6">
            <h2 
              className="text-lg font-bold flex items-center gap-2 cursor-pointer mb-4"
              onClick={() => {
                if (order.payment?.method) {
                  setEditingPayment(!editingPayment);
                }
              }}
            >
              {order.payment?.method ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-sm">3</span>
              )}
              Спосіб оплати *
            </h2>
            {order.payment?.method && !editingPayment ? (
              // Свернутый вид блока оплаты (как в Checkout)
              <div className="space-y-2">
                {order.payment.method === 'wayforpay' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <WayForPayLogo className="w-5 h-5" />
                        {paymentWayForPayTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingPayment(true)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">{paymentWayForPayDescription}</div>
                  </>
                )}
                {order.payment.method === 'nalojka' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <CODPaymentLogo className="w-5 h-5" />
                        {paymentNalojkaTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingPayment(true)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.delivery.method === 'nova_poshta' && 'Післяплата (комісія 2% + 20 грн)'}
                      {order.delivery.method === 'ukrposhta' && 'Післяплата (комісія 2% + 15 грн)'}
                      {order.delivery.method === 'pickup' && 'Оплата готівкою при отриманні замовлення'}
                    </div>
                  </>
                )}
                {order.payment.method === 'fopiban' && (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium flex items-center gap-2">
                        <FOPPaymentLogo className="w-5 h-5" />
                        {paymentFopTitle}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditingPayment(true)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground">{paymentFopDescription}</div>
                  </>
                )}
              </div>
            ) : (
              <PaymentForm
                payment={order.payment}
                deliveryMethod={order.delivery.method}
                onSave={(payment) => {
                  handleSaveOrder({ payment });
                }}
                onCancel={() => setEditingPayment(false)}
                mode="edit"
                defaultExpanded={editingPayment}
                isCompleted={!!order.payment?.method}
                onToggleExpanded={() => setEditingPayment(!editingPayment)}
              />
            )}
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
                <span>Товари ({localItems.length})</span>
                <span>₴{recalculateOrder?.subtotal.toFixed(2) || order.subtotal.toFixed(2)}</span>
              </div>
              {(recalculateOrder?.discount || order.discount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Знижка</span>
                  <span>-₴{(recalculateOrder?.discount || order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Доставка</span>
                <span>{order.deliveryCost > 0 ? `₴${order.deliveryCost.toFixed(2)}` : 'Безкоштовно'}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <span>Всього</span>
                <span>₴{recalculateOrder?.total.toFixed(2) || order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* ТТН (Трекінг-номер) */}
          {(order.delivery.method === 'nova_poshta' || order.delivery.method === 'ukrposhta') && (
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                ТТН (Трекінг-номер)
              </h2>
              <div className="space-y-2">
                <Input
                  value={deliveryTtn}
                  onChange={(e) => setDeliveryTtn(e.target.value)}
                  placeholder="Введіть номер ТТН"
                  className="w-full"
                />
                <Button
                  onClick={handleDeliveryTtnSave}
                  variant="outline"
                  size="default"
                  className="w-full"
                >
                  Зберегти
                </Button>
                {order.deliveryTtn && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Поточний ТТН: {order.deliveryTtn}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Payment Status & Amount */}
          <div className="bg-card rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Статус та сума оплати
            </h2>
            <div className="space-y-4">
              {/* Статус оплаты */}
              <div>
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
              <div>
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
              <div>
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

