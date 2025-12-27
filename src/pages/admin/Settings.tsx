import { useState } from 'react';
import { Save, Store, Truck, CreditCard, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export function Settings() {
  const { toast } = useToast();
  
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'FeltMagic',
    email: 'info@feltmagic.ua',
    phone: '+380501234567',
    address: 'м. Київ, вул. Урлівська 30',
    workingHours: 'Пн-Пт 10:00-18:00, Сб 10:00-14:00',
  });

  const [deliverySettings, setDeliverySettings] = useState({
    freeDeliveryThreshold: 1500,
    deliveryCost: 70,
    novaPoshtaEnabled: true,
    ukrposhtaEnabled: true,
    pickupEnabled: true,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    telegramNotifications: true,
    notifyOnNewOrder: true,
    notifyOnPayment: true,
    notifyOnDelivery: false,
  });

  const handleSave = () => {
    toast({
      title: 'Налаштування збережено',
      description: 'Всі зміни успішно збережено',
    });
  };

  return (
    <div className="space-y-6">
      {/* Store settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            Налаштування магазину
          </CardTitle>
          <CardDescription>
            Основна інформація про ваш магазин
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="storeName">Назва магазину</Label>
              <Input
                id="storeName"
                value={storeSettings.storeName}
                onChange={(e) => setStoreSettings({ ...storeSettings, storeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={storeSettings.email}
                onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={storeSettings.phone}
                onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workingHours">Години роботи</Label>
              <Input
                id="workingHours"
                value={storeSettings.workingHours}
                onChange={(e) => setStoreSettings({ ...storeSettings, workingHours: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Адреса</Label>
            <Textarea
              id="address"
              value={storeSettings.address}
              onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Delivery settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Налаштування доставки
          </CardTitle>
          <CardDescription>
            Способи доставки та вартість
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="freeDeliveryThreshold">Безкоштовна доставка від (₴)</Label>
              <Input
                id="freeDeliveryThreshold"
                type="number"
                value={deliverySettings.freeDeliveryThreshold}
                onChange={(e) => setDeliverySettings({ 
                  ...deliverySettings, 
                  freeDeliveryThreshold: parseInt(e.target.value) || 0 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryCost">Вартість доставки (₴)</Label>
              <Input
                id="deliveryCost"
                type="number"
                value={deliverySettings.deliveryCost}
                onChange={(e) => setDeliverySettings({ 
                  ...deliverySettings, 
                  deliveryCost: parseInt(e.target.value) || 0 
                })}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Способи доставки</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Нова Пошта</Label>
                  <p className="text-sm text-muted-foreground">Доставка у відділення або поштомат</p>
                </div>
                <Switch
                  checked={deliverySettings.novaPoshtaEnabled}
                  onCheckedChange={(checked) => setDeliverySettings({ 
                    ...deliverySettings, 
                    novaPoshtaEnabled: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Укрпошта</Label>
                  <p className="text-sm text-muted-foreground">Доставка Укрпоштою</p>
                </div>
                <Switch
                  checked={deliverySettings.ukrposhtaEnabled}
                  onCheckedChange={(checked) => setDeliverySettings({ 
                    ...deliverySettings, 
                    ukrposhtaEnabled: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Самовивіз</Label>
                  <p className="text-sm text-muted-foreground">Забрати з магазину</p>
                </div>
                <Switch
                  checked={deliverySettings.pickupEnabled}
                  onCheckedChange={(checked) => setDeliverySettings({ 
                    ...deliverySettings, 
                    pickupEnabled: checked 
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Сповіщення
          </CardTitle>
          <CardDescription>
            Налаштування сповіщень про замовлення
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h4 className="font-medium">Канали сповіщень</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Email сповіщення</Label>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ 
                    ...notificationSettings, 
                    emailNotifications: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS сповіщення</Label>
                <Switch
                  checked={notificationSettings.smsNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ 
                    ...notificationSettings, 
                    smsNotifications: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Telegram сповіщення</Label>
                <Switch
                  checked={notificationSettings.telegramNotifications}
                  onCheckedChange={(checked) => setNotificationSettings({ 
                    ...notificationSettings, 
                    telegramNotifications: checked 
                  })}
                />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="font-medium">Типи сповіщень</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Нове замовлення</Label>
                <Switch
                  checked={notificationSettings.notifyOnNewOrder}
                  onCheckedChange={(checked) => setNotificationSettings({ 
                    ...notificationSettings, 
                    notifyOnNewOrder: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Оплата отримана</Label>
                <Switch
                  checked={notificationSettings.notifyOnPayment}
                  onCheckedChange={(checked) => setNotificationSettings({ 
                    ...notificationSettings, 
                    notifyOnPayment: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Замовлення доставлено</Label>
                <Switch
                  checked={notificationSettings.notifyOnDelivery}
                  onCheckedChange={(checked) => setNotificationSettings({ 
                    ...notificationSettings, 
                    notifyOnDelivery: checked 
                  })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave}>
          <Save className="h-4 w-4 mr-2" />
          Зберегти всі налаштування
        </Button>
      </div>
    </div>
  );
}
