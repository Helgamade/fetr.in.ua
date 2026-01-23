import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  Package,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrders } from '@/hooks/useOrders';
import { useTexts } from '@/hooks/useTexts';
import { useProducts } from '@/hooks/useProducts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const statusLabels: Record<string, string> = {
  created: 'Замовлення оформлено',
  accepted: 'Прийнято',
  paid: 'Оплачено',
  packed: 'Спаковано',
  shipped: 'Відправлено',
  arrived: 'Прибуло',
  completed: 'Залишити відгук',
};

export function Dashboard() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: products = [] } = useProducts();
  const { data: texts = [] } = useTexts();
  
  // Calculate stats from real orders
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const repeatCustomers = new Set(orders.map(o => o.customer?.phone).filter(Boolean)).size;
  
  const statsCards = [
    {
      title: 'Загальний дохід',
      value: `₴${Number(totalRevenue).toFixed(2)}`,
      change: '+0%',
      trend: 'up' as const,
      icon: DollarSign,
    },
    {
      title: 'Замовлень',
      value: totalOrders,
      change: '+0%',
      trend: 'up' as const,
      icon: ShoppingCart,
    },
    {
      title: 'Середній чек',
      value: `₴${Number(averageOrderValue).toFixed(2)}`,
      change: '+0%',
      trend: 'up' as const,
      icon: TrendingUp,
    },
    {
      title: 'Постійних клієнтів',
      value: repeatCustomers,
      change: '+0%',
      trend: 'up' as const,
      icon: Users,
    },
  ];
  
  // Group orders by status (только активные статусы)
  const activeStatuses = ['created', 'accepted', 'paid', 'packed', 'shipped', 'arrived', 'completed'];
  const ordersByStatus = orders.reduce((acc, order) => {
    // Показываем только активные статусы
    if (activeStatuses.includes(order.status)) {
      acc[order.status] = (acc[order.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  
  // Сортируем статусы в правильном порядке
  const sortedStatuses = activeStatuses.filter(status => ordersByStatus[status] !== undefined);
  
  // Group orders by payment method
  const ordersByPayment = orders.reduce((acc, order) => {
    const method = order.payment?.method || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Group orders by delivery method
  const ordersByDelivery = orders.reduce((acc, order) => {
    const method = order.delivery?.method || 'unknown';
    acc[method] = (acc[method] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const deliveryLabels: Record<string, string> = {
    nova_poshta: 'Нова Пошта',
    ukrposhta: 'Укрпошта',
    pickup: 'Самовивіз',
    unknown: 'Невідомо',
  };
  
  // Получаем названия способов оплаты из базы данных
  const paymentWayForPayTitle = texts.find(t => t.key === 'checkout.payment.wayforpay.title')?.value || 'Онлайн оплата';
  const paymentNalojkaTitle = texts.find(t => t.key === 'checkout.payment.nalojka.title')?.value || 'Накладений платіж';
  const paymentFopTitle = texts.find(t => t.key === 'checkout.payment.fop.title')?.value || 'Оплата на рахунок ФОП';
  
  const paymentLabels: Record<string, string> = {
    wayforpay: paymentWayForPayTitle,
    nalojka: paymentNalojkaTitle,
    fopiban: paymentFopTitle,
    unknown: 'Невідомо',
  };
  
  // Get top products from orders (только фактическое количество продаж)
  const productStats = new Map<string, { name: string; count: number }>();
  
  orders.forEach(order => {
    order.items?.forEach(item => {
      const product = products.find(p => p.code === item.productId);
      const productName = product?.name || item.productId;
      
      if (productStats.has(item.productId)) {
        const stats = productStats.get(item.productId)!;
        stats.count += item.quantity;
      } else {
        productStats.set(item.productId, {
          name: productName,
          count: item.quantity,
        });
      }
    });
  });
  
  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Daily revenue (last 7 days)
  const dailyRevenue = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt);
      return orderDate.toDateString() === date.toDateString();
    });
    return {
      date: date.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }),
      revenue: dayOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0),
      orders: dayOrders.length,
    };
  });
  
  if (isLoading) {
    return <div className="p-6">Завантаження...</div>;
  }
  
  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className={`flex items-center text-sm ${
                stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                {stat.trend === 'up' ? (
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                )}
                {stat.change} за місяць
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue chart */}
        <Card>
          <CardHeader>
            <CardTitle>Дохід за тиждень</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`₴${Number(value).toFixed(2)}`, 'Дохід']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Orders chart */}
        <Card>
          <CardHeader>
            <CardTitle>Замовлення за тиждень</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value, 'Замовлень']}
                  />
                  <Bar 
                    dataKey="orders" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <Card>
          <CardHeader>
            <CardTitle>Топ товари</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? topProducts.map((product, index) => (
                <div key={product.name} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {product.count} продажів
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{product.count} шт.</div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-muted-foreground py-8">
                  Немає даних про топ товари
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders by status */}
        <Card>
          <CardHeader>
            <CardTitle>Замовлення за статусом</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sortedStatuses.map((status) => {
                const count = ordersByStatus[status] || 0;
                return (
                  <div key={status} className="flex items-center gap-4">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="text-sm">{statusLabels[status] || status}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-8 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Orders by payment method */}
        <Card>
          <CardHeader>
            <CardTitle>Замовлення за способом оплати</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ordersByPayment).map(([method, count]) => (
                <div key={method} className="flex items-center gap-4">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm">{paymentLabels[method] || method}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Orders by delivery method */}
        <Card>
          <CardHeader>
            <CardTitle>Замовлення за способом доставки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(ordersByDelivery).map(([method, count]) => (
                <div key={method} className="flex items-center gap-4">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm">{deliveryLabels[method] || method}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${totalOrders > 0 ? (count / totalOrders) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
