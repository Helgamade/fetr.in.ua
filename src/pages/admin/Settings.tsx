import { useState, useEffect } from 'react';
import { Save, Store, Truck, CreditCard, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';

export function Settings() {
  const { toast } = useToast();
  const { data: settings = {}, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  
  const storeSettings = {
    storeName: settings.store_name || 'FeltMagic',
    email: settings.store_email || 'info@feltmagic.ua',
    phone: settings.store_phone || '+380501234567',
    address: settings.store_address || 'м. Київ, вул. Урлівська 30',
    workingHoursWeekdays: settings.store_working_hours_weekdays || 'Пн–Пт: 10:00 – 18:00',
    workingHoursWeekend: settings.store_working_hours_weekend || 'Сб: 10:00 – 14:00',
  };

  const deliverySettings = {
    freeDeliveryThreshold: settings.free_delivery_threshold || 1500,
    deliveryCost: settings.delivery_cost || 70,
    novaPoshtaEnabled: settings.nova_poshta_enabled ?? true,
    ukrposhtaEnabled: settings.ukrposhta_enabled ?? true,
    pickupEnabled: settings.pickup_enabled ?? true,
  };

  const notificationSettings = {
    emailNotifications: settings.email_notifications ?? true,
    smsNotifications: settings.sms_notifications ?? false,
    telegramNotifications: settings.telegram_notifications ?? true,
    notifyOnNewOrder: settings.notify_on_new_order ?? true,
    notifyOnPayment: settings.notify_on_payment ?? true,
    notifyOnDelivery: settings.notify_on_delivery ?? false,
  };

  const [localStoreSettings, setLocalStoreSettings] = useState(storeSettings);
  const [localDeliverySettings, setLocalDeliverySettings] = useState(deliverySettings);
  const [localNotificationSettings, setLocalNotificationSettings] = useState(notificationSettings);

  // Update local state when settings load
  useEffect(() => {
    if (!isLoading && Object.keys(settings).length > 0) {
      setLocalStoreSettings(storeSettings);
      setLocalDeliverySettings(deliverySettings);
      setLocalNotificationSettings(notificationSettings);
    }
  }, [isLoading, settings]);

  const handleSave = () => {
    const allSettings = {
      store_name: localStoreSettings.storeName,
      store_email: localStoreSettings.email,
      store_phone: localStoreSettings.phone,
      store_address: localStoreSettings.address,
      store_working_hours_weekdays: localStoreSettings.workingHoursWeekdays,
      store_working_hours_weekend: localStoreSettings.workingHoursWeekend,
      free_delivery_threshold: localDeliverySettings.freeDeliveryThreshold,
      delivery_cost: localDeliverySettings.deliveryCost,
      nova_poshta_enabled: localDeliverySettings.novaPoshtaEnabled,
      ukrposhta_enabled: localDeliverySettings.ukrposhtaEnabled,
      pickup_enabled: localDeliverySettings.pickupEnabled,
      email_notifications: localNotificationSettings.emailNotifications,
      sms_notifications: localNotificationSettings.smsNotifications,
      telegram_notifications: localNotificationSettings.telegramNotifications,
      notify_on_new_order: localNotificationSettings.notifyOnNewOrder,
      notify_on_payment: localNotificationSettings.notifyOnPayment,
      notify_on_delivery: localNotificationSettings.notifyOnDelivery,
    };

    updateSettings.mutate(allSettings, {
      onSuccess: () => {
        toast({
          title: 'Налаштування збережено',
          description: 'Всі зміни успішно збережено',
        });
      },
      onError: (error: Error) => {
        toast({
          title: 'Помилка',
          description: error.message || 'Не вдалося зберегти налаштування',
          variant: 'destructive',
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження налаштувань...</div>
      </div>
    );
  }

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
                value={localStoreSettings.storeName}
                onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, storeName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={localStoreSettings.email}
                onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Телефон</Label>
              <Input
                id="phone"
                value={localStoreSettings.phone}
                onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="workingHoursWeekdays">Години роботи (робочі дні)</Label>
            <Textarea
              id="workingHoursWeekdays"
              value={localStoreSettings.workingHoursWeekdays}
              onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, workingHoursWeekdays: e.target.value })}
              rows={2}
              placeholder="Пн–Пт: 10:00 – 18:00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workingHoursWeekend">Години роботи (вихідні дні)</Label>
            <Textarea
              id="workingHoursWeekend"
              value={localStoreSettings.workingHoursWeekend}
              onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, workingHoursWeekend: e.target.value })}
              rows={2}
              placeholder="Сб: 10:00 – 14:00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Адреса</Label>
            <Textarea
              id="address"
              value={localStoreSettings.address}
              onChange={(e) => setLocalStoreSettings({ ...localStoreSettings, address: e.target.value })}
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
                value={localDeliverySettings.freeDeliveryThreshold}
                onChange={(e) => setLocalDeliverySettings({ 
                  ...localDeliverySettings, 
                  freeDeliveryThreshold: parseInt(e.target.value) || 0 
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deliveryCost">Вартість доставки (₴)</Label>
              <Input
                id="deliveryCost"
                type="number"
                value={localDeliverySettings.deliveryCost}
                onChange={(e) => setLocalDeliverySettings({ 
                  ...localDeliverySettings, 
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
                  checked={localDeliverySettings.novaPoshtaEnabled}
                  onCheckedChange={(checked) => setLocalDeliverySettings({ 
                    ...localDeliverySettings, 
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
                  checked={localDeliverySettings.ukrposhtaEnabled}
                  onCheckedChange={(checked) => setLocalDeliverySettings({ 
                    ...localDeliverySettings, 
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
                  checked={localDeliverySettings.pickupEnabled}
                  onCheckedChange={(checked) => setLocalDeliverySettings({ 
                    ...localDeliverySettings, 
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
                  checked={localNotificationSettings.emailNotifications}
                  onCheckedChange={(checked) => setLocalNotificationSettings({ 
                    ...localNotificationSettings, 
                    emailNotifications: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>SMS сповіщення</Label>
                <Switch
                  checked={localNotificationSettings.smsNotifications}
                  onCheckedChange={(checked) => setLocalNotificationSettings({ 
                    ...localNotificationSettings, 
                    smsNotifications: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Telegram сповіщення</Label>
                <Switch
                  checked={localNotificationSettings.telegramNotifications}
                  onCheckedChange={(checked) => setLocalNotificationSettings({ 
                    ...localNotificationSettings, 
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
                  checked={localNotificationSettings.notifyOnNewOrder}
                  onCheckedChange={(checked) => setLocalNotificationSettings({ 
                    ...localNotificationSettings, 
                    notifyOnNewOrder: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Оплата отримана</Label>
                <Switch
                  checked={localNotificationSettings.notifyOnPayment}
                  onCheckedChange={(checked) => setLocalNotificationSettings({ 
                    ...localNotificationSettings, 
                    notifyOnPayment: checked 
                  })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Замовлення доставлено</Label>
                <Switch
                  checked={localNotificationSettings.notifyOnDelivery}
                  onCheckedChange={(checked) => setLocalNotificationSettings({ 
                    ...localNotificationSettings, 
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
