import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Package, ChevronRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';

const statusMap: Record<string, { label: string; variant: any }> = {
  created: { label: 'Новий', variant: 'default' },
  accepted: { label: 'Прийнято', variant: 'secondary' },
  processing: { label: 'В обробці', variant: 'secondary' },
  awaiting_payment: { label: 'Очікує оплату', variant: 'warning' },
  paid: { label: 'Оплачено', variant: 'success' },
  assembled: { label: 'Зібрано', variant: 'secondary' },
  packed: { label: 'Запаковано', variant: 'secondary' },
  shipped: { label: 'Відправлено', variant: 'default' },
  in_transit: { label: 'В дорозі', variant: 'default' },
  arrived: { label: 'Прибуло', variant: 'default' },
  completed: { label: 'Виконано', variant: 'success' },
};

export default function UserOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const allOrders = await ordersAPI.getAll();
      // Фильтруем только заказы текущего пользователя
      // Для админов показываем все заказы, для обычных пользователей - только свои
      if (user?.role === 'admin') {
        return allOrders;
      }
      return allOrders.filter((order: any) => order.user_id === user?.id);
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="container max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Мої замовлення</h1>
          <Button variant="outline" onClick={() => navigate('/user/profile')}>
            Назад до профілю
          </Button>
        </div>

        {!orders || orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">У вас поки немає замовлень</h2>
              <p className="text-muted-foreground mb-6">
                Почніть покупки, щоб побачити свої замовлення тут
              </p>
              <Button onClick={() => navigate('/')}>
                Перейти до магазину
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const status = statusMap[order.status] || { label: order.status, variant: 'default' };
              const orderDate = new Date(order.createdAt);

              return (
                <Card 
                  key={order.id} 
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/user/orders/${order.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Замовлення №{order.orderNumber || order.id}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {orderDate.toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </CardDescription>
                      </div>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Сума</p>
                          <p className="font-semibold text-lg">
                            {formatPrice(order.total)} ₴
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Товарів</p>
                          <p className="font-semibold">
                            {order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation(); // Предотвращаем всплытие события
                          navigate(`/user/orders/${order.id}`);
                        }}
                      >
                        Деталі замовлення
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

