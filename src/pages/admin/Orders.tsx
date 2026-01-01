import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Eye, 
  Search,
  Filter,
  ChevronDown,
  Phone,
  MapPin,
  ShoppingCart,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Order, OrderStatus } from '@/types/store';
import { useOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { useProducts } from '@/hooks/useProducts';

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

export function Orders() {
  const navigate = useNavigate();
  const { data: orders = [], isLoading } = useOrders();
  const { data: products = [] } = useProducts();
  const updateStatus = useUpdateOrderStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      String(order.id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.phone.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateStatus.mutate(
      { id: orderId, status: newStatus },
      {
        onSuccess: () => {
          // Status updated
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
        <div className="text-muted-foreground">Завантаження замовлень...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Пошук за ID, ім'ям або телефоном..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Всі статуси</SelectItem>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders list - Table format */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Список замовлень
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Заказ</th>
                  <th className="text-left py-3 px-4 font-medium">Сумма</th>
                  <th className="text-left py-3 px-4 font-medium">Покупатель</th>
                  <th className="text-left py-3 px-4 font-medium">Доставка и оплата</th>
                  <th className="text-left py-3 px-4 font-medium">Статус</th>
                  <th className="text-right py-3 px-4 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const firstItem = order.items[0];
                  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
                  const product = products.find(p => p.code === firstItem?.productId);
                  
                  return (
                    <tr
                      key={order.id}
                      className="border-b hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/admin/orders/${order.id}`)}
                    >
                      {/* Заказ */}
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0">
                            {product?.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                                <Package className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-bold text-sm">{order.id}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {formatOrderDate(order.createdAt)}
                            </div>
                            <div className="text-sm font-medium mt-1 truncate">
                              {firstItem ? getProductName(firstItem.productId) : 'Товар'}
                            </div>
                            {order.items.length > 1 && (
                              <div className="text-xs text-muted-foreground mt-1">
                                +{order.items.length - 1} товарів в замовленні
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Сумма */}
                      <td className="py-4 px-4">
                        <div className="font-bold">₴{order.total}</div>
                        <div className="text-sm text-muted-foreground">
                          {totalItems} {totalItems === 1 ? 'шт.' : 'шт.'}
                        </div>
                      </td>

                      {/* Покупатель */}
                      <td className="py-4 px-4">
                        <div className="font-medium">{order.customer.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" />
                          {order.customer.phone}
                        </div>
                      </td>

                      {/* Доставка и оплата */}
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {deliveryLabels[order.delivery.method]}
                          </div>
                          {order.delivery.city && (
                            <div className="text-xs text-muted-foreground">
                              {order.delivery.city}
                              {order.delivery.warehouse && `, ${order.delivery.warehouse}`}
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {order.payment.method === 'card' && 'Онлайн оплата'}
                            {order.payment.method === 'cod' && 'Накладений платіж'}
                            {order.payment.method === 'fop' && 'Оплата на рахунок ФОП'}
                          </div>
                        </div>
                      </td>

                      {/* Статус */}
                      <td className="py-4 px-4">
                        <div className="space-y-2">
                          <Select
                            value={order.status}
                            onValueChange={(value) => {
                              handleStatusChange(order.id, value as OrderStatus);
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statusLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {order.status === 'paid' && (
                            <Badge className="bg-green-100 text-green-800 text-xs">
                              Оплачено
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* Действия */}
                      <td className="py-4 px-4 text-right">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/orders/${order.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Замовлення не знайдено
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
