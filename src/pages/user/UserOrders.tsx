import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { ordersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ChevronRight, CreditCard, ShoppingCart, ArrowLeft } from 'lucide-react';
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

  const ordersCount = orders?.length ?? 0;

  return (
    <>
      <Helmet>
        <title>Мої замовлення | FetrInUA</title>
        <meta property="og:title" content="Мої замовлення | FetrInUA" />
      </Helmet>

      <div className="min-h-screen bg-muted/30">
        <div className="container max-w-2xl mx-auto px-4 pb-12">

          {/* Gradient header banner */}
          <div className="bg-gradient-to-br from-primary to-accent rounded-2xl px-6 py-6 mt-6 mb-6">
            <button
              onClick={() => navigate('/user/profile')}
              className="flex items-center gap-1 text-primary-foreground/80 hover:text-primary-foreground text-sm mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              До профілю
            </button>
            <h1 className="text-2xl font-bold text-primary-foreground">
              Мої замовлення
            </h1>
            <p className="text-primary-foreground/80 text-sm mt-1">
              {ordersCount} {ordersCount === 1 ? 'замовлення' : ordersCount >= 2 && ordersCount <= 4 ? 'замовлення' : 'замовлень'}
            </p>
          </div>

          {/* Orders list */}
          {!orders || orders.length === 0 ? (
            <div className="bg-card rounded-2xl p-10 text-center shadow-sm">
              <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">У вас поки немає замовлень</h2>
              <p className="text-muted-foreground mb-6">
                Почніть покупки, щоб побачити свої замовлення тут
              </p>
              <Button onClick={() => navigate('/')}>
                Перейти до магазину
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order: any) => {
                const status = statusMap[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700' };
                const orderDate = new Date(order.createdAt);
                const itemCount = order.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

                // Collect unique product images from order items (up to 4)
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
                  <div
                    key={order.id}
                    className="bg-card rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
                    onClick={() => navigate(`/user/orders/${order.id}`)}
                  >
                    <div className="p-4">
                      {/* Top row: number + status + date */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">
                            №{order.orderNumber || order.id}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
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

                      {/* Product thumbnails */}
                      {productImages.length > 0 && (
                        <div className="flex gap-2 mb-4">
                          {productImages.map((img, idx) => (
                            <div
                              key={idx}
                              className="w-[72px] h-[72px] rounded-xl overflow-hidden border border-border flex-shrink-0 bg-muted"
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

                      {/* Bottom row: price + count + arrow */}
                      <div className="flex items-center justify-between pt-3 border-t border-border">
                        <div className="flex items-center gap-4 text-sm text-foreground">
                          <span className="flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="font-semibold">{formatPrice(order.total)} ₴</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                            <span>{itemCount} {itemCount === 1 ? 'товар' : itemCount >= 2 && itemCount <= 4 ? 'товари' : 'товарів'}</span>
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border mt-10 pt-6 text-center space-y-1">
            <p className="text-sm text-muted-foreground">© 2026 FetrInUA. Всі права захищені</p>
            <p className="text-sm text-muted-foreground">Зроблено з ❤️ в Україні</p>
          </div>
        </div>
      </div>
    </>
  );
}
