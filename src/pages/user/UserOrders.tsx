import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Loader2, Package, ChevronRight, CreditCard, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '@/lib/utils';
import { Helmet } from 'react-helmet-async';
import { useProducts } from '@/hooks/useProducts';

const statusMap: Record<string, { label: string; color: string }> = {
  created:    { label: 'Оформлено',       color: 'bg-blue-100 text-blue-700' },
  accepted:   { label: 'Прийнято',        color: 'bg-purple-100 text-purple-700' },
  paid:       { label: 'Оплачено',        color: 'bg-green-100 text-green-700' },
  packed:     { label: 'Спаковано',       color: 'bg-teal-100 text-teal-700' },
  shipped:    { label: 'Відправлено',     color: 'bg-indigo-100 text-indigo-700' },
  arrived:    { label: 'Прибуло',         color: 'bg-emerald-100 text-emerald-700' },
  completed:  { label: 'Залишити відгук', color: 'bg-gray-100 text-gray-700' },
  processing: { label: 'В обробці',       color: 'bg-yellow-100 text-yellow-700' },
  assembled:  { label: 'Зібрано',         color: 'bg-cyan-100 text-cyan-700' },
  in_transit: { label: 'В дорозі',        color: 'bg-violet-100 text-violet-700' },
};

export default function UserOrders() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: products = [] } = useProducts();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', user?.id],
    queryFn: async () => {
      const allOrders = await ordersAPI.getAll();
      if (user?.role === 'admin') return allOrders;
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
    <>
      <Helmet>
        <title>Мої замовлення | FetrInUA</title>
        <meta property="og:title" content="Мої замовлення | FetrInUA" />
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        <div className="container max-w-4xl mx-auto space-y-6 p-4">

          {/* Page header — same pattern as Profile */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Мої замовлення</h1>
            <Button variant="outline" onClick={() => navigate('/user/profile')}>
              До профілю
            </Button>
          </div>

          {/* Orders list */}
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
                const status = statusMap[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
                const orderDate = new Date(order.createdAt);
                const itemCount = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

                // Collect unique product images (up to 4)
                const productImages: string[] = [];
                if (order.items && products.length > 0) {
                  for (const item of order.items) {
                    const product = products.find((p: any) => p.code === item.productId);
                    if (product?.images?.[0] && !productImages.includes(product.images[0])) {
                      productImages.push(product.images[0]);
                    }
                    if (productImages.length >= 4) break;
                  }
                }

                return (
                  <Card
                    key={order.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/user/orders/${order.id}`)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">
                            №{order.orderNumber || order.id}
                          </span>
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {orderDate.toLocaleDateString('uk-UA', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Product thumbnails */}
                      {productImages.length > 0 && (
                        <div className="flex gap-2">
                          {productImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-muted"
                            >
                              <img
                                src={img}
                                alt=""
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      <Separator />

                      {/* Bottom row: price + count + arrow */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <span className="flex items-center gap-2 text-foreground">
                            <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-base font-semibold">{formatPrice(order.total)} ₴</span>
                          </span>
                          <span className="flex items-center gap-2 text-muted-foreground">
                            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                            <span className="text-base">
                              {itemCount}{' '}
                              {itemCount === 1 ? 'товар' : itemCount >= 2 && itemCount <= 4 ? 'товари' : 'товарів'}
                            </span>
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Footer — same as Profile */}
          <Separator className="my-8" />
          <footer className="text-center space-y-2 pb-8">
            <p className="text-sm text-muted-foreground">© 2026 FetrInUA. Всі права захищені</p>
            <p className="text-sm text-muted-foreground">Зроблено з ❤️ в Україні</p>
          </footer>
        </div>
      </div>
    </>
  );
}
