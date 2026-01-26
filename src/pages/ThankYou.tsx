import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Package, CreditCard, Cog, Box, Truck, MapPin, Home, Star, ArrowRight, User, Phone, MessageCircle, Send, Instagram, Copy, XCircle } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { ordersAPI } from "@/lib/api";
import { usePublicSettings } from "@/hooks/usePublicSettings";
import { OrderStatus } from "@/types/store";
import { NovaPoshtaLogo, UkrposhtaLogo, PickupLogo } from "@/components/DeliveryLogos";
import { CODPaymentLogo, WayForPayLogo, FOPPaymentLogo } from "@/components/PaymentLogos";
import { LottieAnimation } from "@/components/LottieAnimation";
import { getViberLink, getTelegramLink, getWhatsAppLink } from "@/lib/messengerLinks";
import { useToast } from "@/hooks/use-toast";

interface TimelineStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: "completed" | "current" | "pending";
}

const ThankYou = () => {
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get("order"); // Старый способ (для обратной совместимости)
  const trackingTokenParam = searchParams.get("track"); // Безопасная ссылка отслеживания (tracking_token)
  const { data: storeSettings } = usePublicSettings();
  const { toast } = useToast();
  
  // searchParams.get() возвращает null, если параметра нет - нормализуем в undefined
  // Также проверяем, что параметр не равен строке 'undefined' или 'null'
  const trackingToken = (trackingTokenParam && trackingTokenParam !== 'undefined' && trackingTokenParam !== 'null') ? trackingTokenParam : undefined;
  const orderId = (orderIdParam && orderIdParam !== 'undefined' && orderIdParam !== 'null') ? orderIdParam : undefined;
  
  // Используем trackingToken если есть, иначе orderId (для обратной совместимости)
  const identifier = trackingToken || orderId || "";
  
  const { data: order, isLoading: orderLoading, refetch } = useQuery({
    queryKey: ['order', identifier, trackingToken ? 'track' : 'id'],
    queryFn: () => {
      if (trackingToken) {
        return ordersAPI.getByTrackingToken(trackingToken);
      } else if (orderId) {
        return ordersAPI.getOrder(orderId);
      }
      return Promise.reject(new Error('No valid order identifier'));
    },
    enabled: !!identifier && identifier !== 'undefined' && identifier !== 'null',
  });

  // Определяем статус оплаты на основе payment_status
  // Если payment_status = 'paid' - оплата прошла
  // Если payment_status = 'not_paid' или отсутствует - оплата не прошла
  const isPaymentPending = order?.payment?.method === 'wayforpay' && order?.payment?.status !== 'paid';
  const isPaymentPaid = order?.payment?.status === 'paid' || (order?.payment?.method !== 'wayforpay' && order?.status === 'paid');
  
  // Если заказ найден, но нет trackingToken в URL - это может быть возврат от WayForPay
  // В этом случае показываем статус на основе данных заказа
  useEffect(() => {
    if (order && !trackingToken && order.payment?.method === 'wayforpay') {
      console.warn('[ThankYou] Order found but no trackingToken in URL. This might be a WayForPay return without token.');
      console.log('[ThankYou] Order status:', order.status);
    }
  }, [order, trackingToken]);

  // Принудительно обновляем данные при возврате с WayForPay (если есть trackingToken)
  useEffect(() => {
    if (trackingToken && !orderLoading) {
      // Небольшая задержка, чтобы дать серверу время обновить статус после callback
      const timer = setTimeout(() => {
        refetch();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [trackingToken, orderLoading, refetch]);

  // Debug: log order data
  useEffect(() => {
    if (order) {
      console.log('[ThankYou] Order data:', order);
      console.log('[ThankYou] Payment method:', order.payment?.method);
      console.log('[ThankYou] Order status:', order.status);
      console.log('[ThankYou] Is payment pending:', isPaymentPending);
    }
  }, [order, isPaymentPending]);

  // Моментальный скролл наверх при открытии страницы
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  // Определяем статусы на основе текущего статуса заказа
  const getTimelineSteps = (): TimelineStep[] => {
    if (!order) return [];

    // Определяем порядок статусов в зависимости от способа оплаты
    let statusOrder: OrderStatus[];
    
    if (order.payment?.method === 'nalojka') {
      // Оплата при отриманні: created → accepted → packed → shipped → arrived → completed (БЕЗ paid)
      statusOrder = ['created', 'accepted', 'packed', 'shipped', 'arrived', 'completed'];
    } else {
      // WayForPay и ФОП: created → accepted → paid → packed → shipped → arrived → completed
      statusOrder = ['created', 'accepted', 'paid', 'packed', 'shipped', 'arrived', 'completed'];
    }
    
    const currentStatusIndex = statusOrder.indexOf(order.status);
    
    // Логирование для отладки
    console.log('[ThankYou Timeline] Payment method:', order.payment?.method);
    console.log('[ThankYou Timeline] Order status from DB:', order.status);
    console.log('[ThankYou Timeline] Status order:', statusOrder);
    console.log('[ThankYou Timeline] Current status index:', currentStatusIndex);
    
    // Все возможные шаги таймлайна
    const allPossibleSteps: Record<string, Omit<TimelineStep, 'status'>> = {
      created: {
        id: "created",
        title: "Замовлення оформлено",
        description: "Ваше замовлення успішно створено",
        icon: <CheckCircle className="w-5 h-5" />
      },
      accepted: {
        id: "accepted",
        title: "Прийнято",
        description: "Замовлення прийнято в обробку",
        icon: <Package className="w-5 h-5" />
      },
      paid: {
        id: "paid",
        title: "Оплачено",
        description: "Оплату успішно отримано, дякуємо!",
        icon: <CreditCard className="w-5 h-5" />
      },
      packed: {
        id: "packed",
        title: "Спаковано",
        description: "Замовлення зібране та очікує відправлення",
        icon: <Box className="w-5 h-5" />
      },
      shipped: {
        id: "shipped",
        title: "Відправлено",
        description: "Посилка вже в дорозі до вас",
        icon: <Truck className="w-5 h-5" />
      },
      arrived: {
        id: "arrived",
        title: "Прибуло",
        description: "Посилка чекає на отримання",
        icon: <MapPin className="w-5 h-5" />
      },
      completed: {
        id: "completed",
        title: "Залишити відгук",
        description: "Нам важлива ваша думка 💛",
        icon: <Star className="w-5 h-5" />
      }
    };

    // Формируем шаги таймлайна только для нужных статусов
    const allSteps: Omit<TimelineStep, 'status'>[] = statusOrder.map(status => allPossibleSteps[status]);
    
    // currentStatusIndex может быть -1, если статус не найден (не должно быть, но на всякий случай)
    if (currentStatusIndex === -1) {
      console.warn('[ThankYou Timeline] Status not found in statusOrder:', order.status);
      // Если статус не найден, показываем все как pending
      return allSteps.map((step) => ({ ...step, status: "pending" as const }));
    }

    // Используем order.status напрямую из базы
    return allSteps.map((step, index) => {
      let status: "completed" | "current" | "pending" = "pending";
      
      if (index < currentStatusIndex) {
        status = "completed";
      } else if (index === currentStatusIndex) {
        status = "current";
      } else {
        status = "pending";
      }

      return {
        ...step,
        status
      };
    });
  };

  const timelineSteps = getTimelineSteps();

  const getStatusColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "current":
        return "bg-primary text-primary-foreground animate-pulse";
      case "pending":
        return "bg-muted text-muted-foreground";
    }
  };

  const getLineColor = (status: TimelineStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "current":
        return "bg-gradient-to-b from-green-500 to-muted";
      case "pending":
        return "bg-muted";
    }
  };

  // Если нет идентификатора заказа, показываем сообщение
  if (!identifier && !orderLoading) {
    return (
      <>
        <Helmet>
          <title>Помилка | FetrInUA</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="min-h-screen bg-gradient-to-b from-red-50 to-background flex items-center justify-center">
          <div className="container mx-auto px-4 text-center">
            <div className="bg-card rounded-2xl p-8 shadow-elegant max-w-md">
              <h1 className="text-2xl font-bold mb-4 text-red-600">Помилка</h1>
              <p className="text-muted-foreground mb-4">
                Не вдалося знайти замовлення. Перевірте посилання або зверніться до підтримки.
              </p>
              <Link to="/">
                <Button>Повернутися на головну</Button>
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{isPaymentPending ? 'Очікуємо на оплату' : 'Дякуємо за замовлення!'} | FetrInUA</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <div className={`min-h-screen bg-gradient-to-b ${isPaymentPending ? 'from-yellow-50' : 'from-green-50'} to-background`}>
        {/* Header - зеленый для успешной оплаты, желтый для ожидающей */}
        <div className={`bg-gradient-to-r ${isPaymentPending ? 'from-yellow-500 to-yellow-600' : 'from-green-500 to-green-600'} text-white py-12`}>
          <div className="container mx-auto px-4 text-center">
            <div className="w-32 h-32 mx-auto mb-4 animate-scale-in drop-shadow-none shadow-none">
              {isPaymentPending ? (
                <div className="w-full h-full flex items-center justify-center">
                  <XCircle className="w-32 h-32 text-white" />
                </div>
              ) : (
                <LottieAnimation
                  jsonPath="/animations/loading.json"
                  className="w-full h-full"
                  loop={false}
                  autoplay={true}
                />
              )}
            </div>
            {isPaymentPending ? (
              <>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Оплата не пройшла</h1>
                <p className="text-yellow-100">Ваше замовлення оформлено, але оплата не була завершена. Будь ласка, спробуйте оплатити ще раз.</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Дякуємо за замовлення!</h1>
                <p className="text-green-100">Ваше замовлення успішно оформлено</p>
              </>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Order Info Card */}
          <div className="bg-card rounded-2xl p-6 shadow-elegant -mt-8 relative z-10 mb-8">
            <div className="flex flex-row justify-between items-center gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Номер замовлення</div>
                <div className="flex items-center gap-2">
                  <div className="text-xl font-bold font-mono">{order?.id || orderId || ''}</div>
                  <button
                    onClick={async () => {
                      try {
                        const orderNumber = order?.id || orderId || '';
                        await navigator.clipboard.writeText(orderNumber);
                        toast({ title: 'Скопійовано!', description: 'Номер замовлення скопійовано в буфер обміну' });
                      } catch (error) {
                        toast({ title: 'Помилка', description: 'Не вдалося скопіювати', variant: 'destructive' });
                      }
                    }}
                    className="p-1.5 rounded-lg transition-all duration-200 hover:bg-muted text-muted-foreground hover:text-foreground"
                    title="Копіювати номер замовлення"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Статус оплати</div>
                {order && (() => {
                  const paymentStatusLabels: Record<string, string> = {
                    'not_paid': 'Не оплачено',
                    'cash_on_delivery': 'Післяплата',
                    'paid': 'Оплачено',
                  };
                  
                  // Используем payment_status если есть, иначе определяем по order.status
                  const paymentStatus = order.payment?.status;
                  let displayLabel = paymentStatus 
                    ? (paymentStatusLabels[paymentStatus] || 'Не оплачено')
                    : (order.status === 'paid' ? 'Оплачено' : 'Не оплачено');
                  
                  const isPaid = paymentStatus === 'paid' || (!paymentStatus && order.status === 'paid');
                  
                  return (
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                      isPaid
                        ? 'bg-green-100 text-green-800'
                        : paymentStatus === 'cash_on_delivery'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {displayLabel}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Order Details */}
          {order && (
            <div className="bg-card rounded-2xl p-6 shadow-soft mb-8 space-y-6">
              {/* Customer Info */}
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Дані замовника
                </h2>
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Ім'я:</span>
                    <span className="font-medium">{order.customer.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Телефон:</span>
                    <span className="font-medium">{order.customer.phone}</span>
                  </div>
                  {order.recipient && (
                    <>
                      <div className="pt-2 border-t">
                        <div className="text-sm text-muted-foreground mb-2">Отримувач замовлення:</div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Ім'я:</span>
                          <span className="font-medium">{order.recipient.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Телефон:</span>
                          <span className="font-medium">{order.recipient.phone}</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery Info */}
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Доставка
                </h2>
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    {order.delivery.method === 'nova_poshta' && <NovaPoshtaLogo className="w-5 h-5" />}
                    {order.delivery.method === 'ukrposhta' && <UkrposhtaLogo className="w-5 h-5" />}
                    {order.delivery.method === 'pickup' && <PickupLogo className="w-5 h-5" />}
                    <span className="font-medium">
                      {order.delivery.method === 'nova_poshta' && 'Нова Пошта'}
                      {order.delivery.method === 'ukrposhta' && 'Укрпошта'}
                      {order.delivery.method === 'pickup' && 'Самовивіз'}
                    </span>
                  </div>
                  {order.delivery.city && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Місто:</span> {order.delivery.city}
                    </div>
                  )}
                  {order.delivery.warehouse && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Відділення:</span> {order.delivery.warehouse}
                    </div>
                  )}
                  {order.delivery.postIndex && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Індекс:</span> {order.delivery.postIndex}
                    </div>
                  )}
                  {order.delivery.address && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Адреса:</span> {order.delivery.address}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Оплата
                </h2>
                <div className="bg-muted/30 rounded-xl p-4">
                  {order.payment && order.payment.method ? (
                    <>
                      <div className="flex items-center gap-2">
                        {order.payment.method === 'wayforpay' && <WayForPayLogo className="w-5 h-5" />}
                        {order.payment.method === 'nalojka' && <CODPaymentLogo className="w-5 h-5" />}
                        {order.payment.method === 'fopiban' && <FOPPaymentLogo className="w-5 h-5" />}
                        <span className="font-medium">
                          {order.payment.method === 'wayforpay' && 'Онлайн оплата (WayForPay)'}
                          {order.payment.method === 'nalojka' && 'Оплата при отриманні'}
                          {order.payment.method === 'fopiban' && 'Оплата на рахунок ФОП'}
                          {!['wayforpay', 'nalojka', 'fopiban'].includes(order.payment.method) && `Спосіб оплати: ${order.payment.method}`}
                        </span>
                      </div>
                      {isPaymentPending && order.payment.method === 'wayforpay' && (
                        <div className="mt-4 pt-4 border-t">
                          <Button
                            onClick={async () => {
                              try {
                                // Приоритет 1: Используем repayUrl если он есть (от WayForPay при неуспешной оплате)
                                if (order.payment.repayUrl) {
                                  console.log('[ThankYou] Using repayUrl from WayForPay:', order.payment.repayUrl);
                                  window.location.href = order.payment.repayUrl;
                                  return;
                                }
                                
                                // ВАЖНО: WayForPay НЕ позволяет повторно использовать тот же orderReference
                                // Даже если сохранен paymentData, нужно создавать новый платеж с уникальным orderReference
                                // Поэтому НЕ используем сохраненный paymentData, а всегда создаем новый платеж
                                
                                // Создаем новый платеж с уникальным orderReference
                                // Сервер автоматически добавит суффикс -2, -3 и т.д. при необходимости
                                console.log('[ThankYou] Creating new payment with unique orderReference');
                                const { wayforpayAPI } = await import("@/lib/api");
                                const paymentResponse = await wayforpayAPI.createPayment(order.id);
                                
                                if (!paymentResponse.paymentUrl || !paymentResponse.paymentData) {
                                  throw new Error('Invalid payment response from server');
                                }
                                
                                const form = document.createElement('form');
                                form.method = 'POST';
                                form.action = paymentResponse.paymentUrl;
                                
                                Object.entries(paymentResponse.paymentData).forEach(([key, value]) => {
                                  if (Array.isArray(value)) {
                                    value.forEach((item, index) => {
                                      const input = document.createElement('input');
                                      input.type = 'hidden';
                                      input.name = `${key}[]`;
                                      input.value = String(item);
                                      form.appendChild(input);
                                    });
                                  } else {
                                    const input = document.createElement('input');
                                    input.type = 'hidden';
                                    input.name = key;
                                    input.value = String(value);
                                    form.appendChild(input);
                                  }
                                });
                                
                                document.body.appendChild(form);
                                form.submit();
                              } catch (error) {
                                console.error('[ThankYou] Error creating payment:', error);
                                alert('Не вдалося створити платіж. Спробуйте пізніше.');
                              }
                            }}
                            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-lg py-6"
                            size="lg"
                          >
                            <CreditCard className="w-5 h-5 mr-2" />
                            ПОВТОРНО ОПЛАТИТЬ
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground">Спосіб оплати не вказано</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Payment Details for FOP */}
          {order && order.payment && order.payment.method === 'fopiban' && (
            <div className="bg-card rounded-2xl shadow-soft mb-8 overflow-hidden">
              <div className="flex">
                <div className="w-2 bg-gradient-to-b from-green-400 to-emerald-600"></div>
                <div className="flex-1 p-6">
                  <h2 className="text-lg font-bold flex items-center gap-2 mb-5">
                    <CreditCard className="w-5 h-5 text-green-600" />
                    Платіжні реквізити
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Номер рахунку у форматі IBAN</label>
                      <div className="flex items-center gap-2 mt-1.5 border border-border rounded-lg px-4 py-2.5 bg-muted/30">
                        <span className="flex-1 font-mono text-sm break-all">UA383052990000026008046715224</span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText('UA383052990000026008046715224');
                              toast({ title: 'Скопійовано!', description: 'IBAN скопійовано в буфер обміну' });
                            } catch (error) {
                              toast({ title: 'Помилка', description: 'Не вдалося скопіювати', variant: 'destructive' });
                            }
                          }}
                          className="p-2 rounded-lg transition-all duration-200 flex-shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Копіювати"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">ЄДРПОУ, ІНН</label>
                      <div className="flex items-center gap-2 mt-1.5 border border-border rounded-lg px-4 py-2.5 bg-muted/30">
                        <span className="flex-1 font-mono text-sm">3078718311</span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText('3078718311');
                              toast({ title: 'Скопійовано!', description: 'ІНН скопійовано в буфер обміну' });
                            } catch (error) {
                              toast({ title: 'Помилка', description: 'Не вдалося скопіювати', variant: 'destructive' });
                            }
                          }}
                          className="p-2 rounded-lg transition-all duration-200 flex-shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Копіювати"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Отримувач платежу</label>
                      <div className="flex items-center gap-2 mt-1.5 border border-border rounded-lg px-4 py-2.5 bg-muted/30">
                        <span className="flex-1 text-sm">ФОП Пітальов О.М</span>
                        <button
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText('ФОП Пітальов О.М');
                              toast({ title: 'Скопійовано!', description: 'Отримувач скопійовано в буфер обміну' });
                            } catch (error) {
                              toast({ title: 'Помилка', description: 'Не вдалося скопіювати', variant: 'destructive' });
                            }
                          }}
                          className="p-2 rounded-lg transition-all duration-200 flex-shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Копіювати"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Призначення платежу</label>
                      <div className="flex items-center gap-2 mt-1.5 border border-border rounded-lg px-4 py-2.5 bg-muted/30">
                        <span className="flex-1 text-sm">
                          Оплата за замовлення {order?.id || orderId || ''}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              const paymentPurpose = `Оплата за замовлення ${order?.id || orderId || ''}`;
                              await navigator.clipboard.writeText(paymentPurpose);
                              toast({ title: 'Скопійовано!', description: 'Призначення скопійовано в буфер обміну' });
                            } catch (error) {
                              toast({ title: 'Помилка', description: 'Не вдалося скопіювати', variant: 'destructive' });
                            }
                          }}
                          className="p-2 rounded-lg transition-all duration-200 flex-shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Копіювати"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Сума до сплати</label>
                      <div className="flex items-center gap-2 mt-1.5 border border-border rounded-lg px-4 py-2.5 bg-muted/30">
                        <span className="flex-1 text-sm font-semibold">
                          {order && order.total ? Math.round(parseFloat(order.total)) : '0'}
                        </span>
                        <button
                          onClick={async () => {
                            try {
                              const totalAmount = order && order.total ? Math.round(parseFloat(order.total)).toString() : '0';
                              await navigator.clipboard.writeText(totalAmount);
                              toast({ title: 'Скопійовано!', description: 'Сума скопійовано в буфер обміну' });
                            } catch (error) {
                              toast({ title: 'Помилка', description: 'Не вдалося скопіювати', variant: 'destructive' });
                            }
                          }}
                          className="p-2 rounded-lg transition-all duration-200 flex-shrink-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                          title="Копіювати"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-green-800 dark:text-green-200 text-sm font-medium">🏦 Банк: ПриватБанк</p>
                    <p className="text-green-600 dark:text-green-300 text-xs mt-1">Повідомте, будь ласка, про оплату</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="bg-card rounded-2xl p-6 shadow-soft mb-8">
            <h2 className="font-bold text-lg mb-6">Статус замовлення</h2>
            
            <div className="space-y-0">
              {timelineSteps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  {/* Icon & Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(step.status)}`}>
                      {step.icon}
                    </div>
                    {index < timelineSteps.length - 1 && (
                      <div className={`w-0.5 h-12 ${getLineColor(step.status)}`} />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="pb-8">
                    <div className={`font-medium ${step.status === "pending" ? "text-muted-foreground" : ""}`}>
                      {step.title}
                    </div>
                    <div className="text-sm text-muted-foreground">{step.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-card rounded-2xl p-6 shadow-soft mb-8">
            <h2 className="font-bold text-lg mb-4">Що далі?</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span className="text-sm">
                  {order?.payment?.method === 'wayforpay' && 'Оплатіть замовлення онлайн через WayForPay'}
                  {order?.payment?.method === 'nalojka' && 'Оплатіть замовлення при отриманні на відділенні'}
                  {order?.payment?.method === 'fopiban' && 'Оплатіть замовлення на рахунок ФОП (реквізити нижче)'}
                  {order?.payment?.method && !['wayforpay', 'nalojka', 'fopiban'].includes(order.payment.method) && 'Оплатіть замовлення (якщо обрали передоплату)'}
                  {!order?.payment?.method && 'Оплатіть замовлення (якщо обрали передоплату)'}
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span className="text-sm">Очікуйте SMS або дзвінок від нашого менеджера</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span className="text-sm">Отримайте ТТН для відстеження посилки</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span className="text-sm">Заберіть набір та творіть з задоволенням! 🎨</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-contact-mint to-contact-mint-dark p-8 md:p-12 mb-8">
            {/* Glass blur circles */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-contact-orange/20 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-contact-telegram/20 blur-3xl" />
            
            <div className="relative backdrop-blur-sm">
              <div className="text-center">
                <h3 className="mb-2 text-2xl font-heading font-bold text-foreground md:text-3xl">
                  Маєте питання?
                </h3>
                <p className="mb-8 text-muted-foreground">
                  Зв'яжіться з нами у зручний спосіб
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3">
                {storeSettings?.store_phone && (
                  <>
                    <a
                      href={`tel:${storeSettings.store_phone}`}
                      className="flex items-center gap-2 rounded-full border border-contact-orange bg-card/60 px-4 py-2 text-sm font-medium text-contact-orange backdrop-blur-md transition-all hover:bg-contact-orange hover:text-primary-foreground"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {storeSettings.store_phone}
                    </a>
                    <a
                      href={getViberLink(storeSettings.store_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-contact-viber bg-card/60 px-4 py-2 text-sm font-medium text-contact-viber backdrop-blur-md transition-all hover:bg-contact-viber hover:text-primary-foreground"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Viber
                    </a>
                    <a
                      href={getTelegramLink(storeSettings.store_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-contact-telegram bg-card/60 px-4 py-2 text-sm font-medium text-contact-telegram backdrop-blur-md transition-all hover:bg-contact-telegram hover:text-primary-foreground"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Telegram
                    </a>
                    <a
                      href={getWhatsAppLink(storeSettings.store_phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-contact-whatsapp bg-card/60 px-4 py-2 text-sm font-medium text-contact-whatsapp backdrop-blur-md transition-all hover:bg-contact-whatsapp hover:text-primary-foreground"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      WhatsApp
                    </a>
                    <a
                      href="https://instagram.com/helgamade_ua"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-full border border-contact-instagram-pink bg-card/60 px-4 py-2 text-sm font-medium text-contact-instagram-pink backdrop-blur-md transition-all hover:bg-gradient-to-r hover:from-contact-instagram-purple hover:via-contact-instagram-pink hover:to-contact-instagram-orange hover:text-primary-foreground"
                    >
                      <span className="text-xs">📷</span>
                      Instagram
                    </a>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* Back to Shop */}
          <div className="text-center">
            <Link to="/">
              <Button className="rounded-full" size="lg">
                Повернутися до магазину
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="bg-muted/50 py-6 mt-8">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm text-muted-foreground">
              Дякуємо, що обрали FetrInUA! 💝<br />
              Ми цінуємо вашу довіру
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ThankYou;
