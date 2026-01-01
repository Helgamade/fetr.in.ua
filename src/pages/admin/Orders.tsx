import { useState } from 'react';
import { 
  Eye, 
  Search,
  Filter,
  ChevronDown,
  Phone,
  MapPin
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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

export function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const { data: products = [] } = useProducts();
  const updateStatus = useUpdateOrderStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
          if (selectedOrder?.id === orderId) {
            setSelectedOrder(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date() } : null);
          }
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

      {/* Orders list */}
      <Card>
        <CardHeader>
          <CardTitle>Замовлення ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Order info */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold">{order.id}</span>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {order.customer.name} • {order.customer.phone}
                    </div>
                    <div className="text-sm">
                      {order.items.map(item => (
                        <span key={item.productId}>
                          {getProductName(item.productId)} x{item.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Order total */}
                  <div className="text-right">
                    <div className="text-lg font-bold">₴{order.total}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('uk-UA')}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Select
                      value={order.status}
                      onValueChange={(value) => handleStatusChange(order.id, value as OrderStatus)}
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
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {filteredOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Замовлення не знайдено
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Order details dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Замовлення {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Status */}
              <div className="flex items-center justify-between">
                <Badge className={statusColors[selectedOrder.status]}>
                  {statusLabels[selectedOrder.status]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Створено: {new Date(selectedOrder.createdAt).toLocaleString('uk-UA')}
                </span>
              </div>

              {/* Customer */}
              <div className="space-y-2">
                <h4 className="font-semibold">Клієнт</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="font-medium">{selectedOrder.customer.name}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    {selectedOrder.customer.phone}
                  </div>
                  {selectedOrder.promoCode && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Промокод:</span>
                      <span className="font-medium text-green-600">{selectedOrder.promoCode}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery */}
              <div className="space-y-2">
                <h4 className="font-semibold">Доставка</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {deliveryLabels[selectedOrder.delivery.method]}
                  </div>
                  {selectedOrder.delivery.city && (
                    <div className="text-sm">м. {selectedOrder.delivery.city}</div>
                  )}
                  {selectedOrder.delivery.warehouse && (
                    <div className="text-sm">{selectedOrder.delivery.warehouse}</div>
                  )}
                  {selectedOrder.delivery.address && (
                    <div className="text-sm">{selectedOrder.delivery.address}</div>
                  )}
                </div>
              </div>

              {/* Comment */}
              {selectedOrder.comment && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Коментар</h4>
                  <div className="bg-muted/50 rounded-lg p-4">
                    <div className="text-sm whitespace-pre-wrap">{selectedOrder.comment}</div>
                  </div>
                </div>
              )}

              {/* Items */}
              <div className="space-y-2">
                <h4 className="font-semibold">Товари</h4>
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.productId} className="flex justify-between">
                      <div>
                        <div className="font-medium">{getProductName(item.productId)}</div>
                        <div className="text-sm text-muted-foreground">
                          Кількість: {item.quantity}
                        </div>
                        {item.selectedOptions.length > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Опції: {item.selectedOptions.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Підсумок</span>
                  <span>₴{selectedOrder.subtotal}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Знижка</span>
                    <span>-₴{selectedOrder.discount}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Доставка</span>
                  <span>{selectedOrder.deliveryCost > 0 ? `₴${selectedOrder.deliveryCost}` : 'Безкоштовно'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Всього</span>
                  <span>₴{selectedOrder.total}</span>
                </div>
              </div>

              {/* Change status */}
              <div className="border-t pt-4">
                <label className="text-sm font-medium mb-2 block">Змінити статус</label>
                <Select
                  value={selectedOrder.status}
                  onValueChange={(value) => handleStatusChange(selectedOrder.id, value as OrderStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
