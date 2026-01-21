import { useState, useEffect, useRef } from 'react';
import { Save, Store, Truck, CreditCard, Bell, Upload, Image as ImageIcon, X, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSettings, useUpdateSettings } from '@/hooks/useSettings';
import { useTexts, SiteText } from '@/hooks/useTexts';
import { settingsAPI } from '@/lib/api';

export function Settings() {
  const { toast } = useToast();
  const { data: settings = {}, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const { data: textsData = [] } = useTexts();
  const texts: SiteText[] = Array.isArray(textsData) ? textsData : [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingHeroImage, setUploadingHeroImage] = useState(false);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  
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
      if (settings.hero_background_image) {
        setHeroImagePreview(settings.hero_background_image);
      }
    }
  }, [isLoading, settings]);

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: 'Помилка',
        description: 'Тільки зображення (jpeg, jpg, png, gif, webp) дозволені!',
        variant: 'destructive',
      });
      return;
    }

    // Проверка размера файла (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'Помилка',
        description: 'Розмір файлу не повинен перевищувати 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploadingHeroImage(true);
    try {
      const result = await settingsAPI.uploadHeroBackground(file);
      setHeroImagePreview(result.url);
      toast({
        title: 'Успіх',
        description: 'Фонове зображення hero секції завантажено',
      });
      // Обновляем настройки для отображения нового изображения
      updateSettings.mutate({ hero_background_image: result.url });
    } catch (error: any) {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося завантажити зображення',
        variant: 'destructive',
      });
    } finally {
      setUploadingHeroImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = () => {
    const allSettings = {
      store_name: localStoreSettings.storeName,
      store_email: localStoreSettings.email,
      store_phone: localStoreSettings.phone,
      store_address: localStoreSettings.address,
      store_working_hours_weekdays: localStoreSettings.workingHoursWeekdays,
      store_working_hours_weekend: localStoreSettings.workingHoursWeekend,
      free_delivery_threshold: localDeliverySettings.freeDeliveryThreshold,
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
      <div>
        <h1 className="text-3xl font-bold">Налаштування</h1>
        <p className="text-muted-foreground mt-2">
          Керування налаштуваннями магазину
        </p>
      </div>

      <Tabs defaultValue="store" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="store">
            <Store className="h-4 w-4 mr-2" />
            Налаштування магазину
          </TabsTrigger>
          <TabsTrigger value="background">
            <ImageIcon className="h-4 w-4 mr-2" />
            Фонове зображення
          </TabsTrigger>
          <TabsTrigger value="delivery">
            <Truck className="h-4 w-4 mr-2" />
            Доставка
          </TabsTrigger>
          <TabsTrigger value="payment">
            <CreditCard className="h-4 w-4 mr-2" />
            Оплата
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            Налаштування Email
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Сповіщення
          </TabsTrigger>
        </TabsList>

        {/* Налаштування магазину */}
        <TabsContent value="store" className="space-y-6 mt-6">
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
        </TabsContent>

        {/* Фонове зображення */}
        <TabsContent value="background" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Фонове зображення Hero секції
              </CardTitle>
              <CardDescription>
                Завантажте фонове зображення для головної секції сайту
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Рекомендовані параметри:</Label>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Розмір: 1920×1080px або більше (16:9)</li>
                  <li>Формат: JPG, PNG, WebP</li>
                  <li>Максимальний розмір файлу: 10MB</li>
                  <li>Рекомендовано використовувати WebP для кращої оптимізації</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label>Поточне зображення:</Label>
                {heroImagePreview ? (
                  <div className="relative w-full max-w-2xl">
                    <img 
                      src={heroImagePreview} 
                      alt="Hero background preview" 
                      className="w-full h-auto rounded-lg border border-border"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setHeroImagePreview(null);
                        updateSettings.mutate({ hero_background_image: '' });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                    Зображення не завантажено
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroImageUpload">Завантажити нове зображення</Label>
                <Input
                  id="heroImageUpload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  ref={fileInputRef}
                  onChange={handleHeroImageUpload}
                  disabled={uploadingHeroImage}
                  className="cursor-pointer"
                />
                {uploadingHeroImage && (
                  <p className="text-sm text-muted-foreground">Завантаження...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Доставка */}
        <TabsContent value="delivery" className="space-y-6 mt-6">
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

          <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Способи доставки</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{texts.find(t => t.key === 'checkout.delivery.nova_poshta.title')?.value || 'Нова Пошта'}</Label>
                      <p className="text-sm text-muted-foreground">{texts.find(t => t.key === 'checkout.delivery.nova_poshta.description')?.value || 'Доставка у відділення або поштомат'}</p>
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
                      <Label>{texts.find(t => t.key === 'checkout.delivery.ukrposhta.title')?.value || 'Укрпошта'}</Label>
                      <p className="text-sm text-muted-foreground">{texts.find(t => t.key === 'checkout.delivery.ukrposhta.description')?.value || 'Доставка Укрпоштою'}</p>
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
                      <Label>{texts.find(t => t.key === 'checkout.delivery.pickup.title')?.value || 'Самовивіз'}</Label>
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
        </TabsContent>

        {/* Оплата */}
        <TabsContent value="payment" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Налаштування оплати
              </CardTitle>
              <CardDescription>
                Налаштування способів оплати та платіжних систем
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Способи оплати</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{texts.find(t => t.key === 'checkout.payment.wayforpay.title')?.value || 'WayForPay'}</Label>
                      <p className="text-sm text-muted-foreground">{texts.find(t => t.key === 'checkout.payment.wayforpay.description')?.value || 'Онлайн оплата через WayForPay'}</p>
                    </div>
                    <Switch
                      checked={true}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{texts.find(t => t.key === 'checkout.payment.nalojka.title')?.value || 'Накладений платіж'}</Label>
                      <p className="text-sm text-muted-foreground">{texts.find(t => t.key === 'checkout.payment.nalojka.description')?.value || 'Оплата при отриманні'}</p>
                    </div>
                    <Switch
                      checked={true}
                      disabled
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>{texts.find(t => t.key === 'checkout.payment.fop.title')?.value || 'Переказ на карту ФОП'}</Label>
                      <p className="text-sm text-muted-foreground">{texts.find(t => t.key === 'checkout.payment.fop.description')?.value || 'Переказ на банківську картку'}</p>
                    </div>
                    <Switch
                      checked={true}
                      disabled
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>Примітка:</strong> Всі способи оплати активні за замовчуванням. 
                Відключення способів оплати доступне через налаштування системи.
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        {/* Налаштування Email */}
        <TabsContent value="email" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Налаштування SMTP для Email
              </CardTitle>
              <CardDescription>
                Налаштування для відправки email сповіщень
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">SMTP Хост</Label>
                  <Input
                    id="smtp_host"
                    value={settings.smtp_host || ''}
                    onChange={(e) => updateSettings.mutate({ smtp_host: e.target.value })}
                    placeholder="smtp.gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">SMTP Порт</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={settings.smtp_port || '587'}
                    onChange={(e) => updateSettings.mutate({ smtp_port: e.target.value })}
                    placeholder="587"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">SMTP Користувач</Label>
                  <Input
                    id="smtp_user"
                    value={settings.smtp_user || ''}
                    onChange={(e) => updateSettings.mutate({ smtp_user: e.target.value })}
                    placeholder="your-email@gmail.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">SMTP Пароль</Label>
                  <Input
                    id="smtp_password"
                    type="password"
                    value={settings.smtp_password || ''}
                    onChange={(e) => updateSettings.mutate({ smtp_password: e.target.value })}
                    placeholder="Пароль або App Password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_email">Email відправника</Label>
                  <Input
                    id="smtp_from_email"
                    type="email"
                    value={settings.smtp_from_email || ''}
                    onChange={(e) => updateSettings.mutate({ smtp_from_email: e.target.value })}
                    placeholder="noreply@fetr.in.ua"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_name">Ім'я відправника</Label>
                  <Input
                    id="smtp_from_name"
                    value={settings.smtp_from_name || 'Fetr.in.ua'}
                    onChange={(e) => updateSettings.mutate({ smtp_from_name: e.target.value })}
                    placeholder="Fetr.in.ua"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Використовувати SSL/TLS</Label>
                  <p className="text-sm text-muted-foreground">Увімкнути для портів 465 (SSL) або 587 (TLS)</p>
                </div>
                <Switch
                  checked={settings.smtp_secure === 'true'}
                  onCheckedChange={(checked) => updateSettings.mutate({ smtp_secure: checked.toString() })}
                />
              </div>
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <strong>Примітка:</strong> Для Gmail використовуйте App Password замість звичайного пароля. 
                Для інших провайдерів перевірте документацію щодо налаштувань SMTP.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Налаштування DNS для безпеки пошти (SPF, DKIM, DMARC)
              </CardTitle>
              <CardDescription>
                Інструкції з налаштування DNS записів для покращення доставки та безпеки email
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Важливо!</h4>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Ці DNS записи потрібно додати в панелі управління вашим хостингом (ukraine.com.ua) або у вашого DNS провайдера. 
                    Зміни можуть набути чинності протягом 24-48 годин.
                  </p>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">1</span>
                      SPF (Sender Policy Framework)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      SPF дозволяє вказати, які сервери мають право відправляти листи від імені вашого домену.
                    </p>
                    <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2">
                      <div>
                        <span className="text-muted-foreground">Тип:</span> <span className="font-semibold">TXT</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ім'я (субдомен):</span> <span className="font-semibold">@</span> або залишити порожнім
                      </div>
                      <div>
                        <span className="text-muted-foreground">Значення:</span>
                        <div className="mt-1 bg-background p-2 rounded border">
                          <code className="text-primary">v=spf1 include:_spf.ukraine.com.ua ~all</code>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Ця запис дозволяє відправку листів з серверів хостингу Ukraine.com.ua та позначає листи від інших серверів як підозрілі.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">2</span>
                      DKIM (DomainKeys Identified Mail)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      DKIM додає цифровий підпис до ваших листів, підтверджуючи їх справжність та цілісність.
                    </p>
                    <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-3">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Крок 1:</strong> Увійдіть в панель управління хостингом ukraine.com.ua та перейдіть в розділ управління поштовими доменами.
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                        <strong>Крок 2:</strong> Увімкніть DKIM для вашого домену <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">fetr.in.ua</code>. 
                        Після активації система автоматично додасть DKIM запис в DNS.
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                        <strong>Селектор DKIM:</strong> <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">hosting</code>
                      </p>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-2">
                        <strong>Запис буде додана для:</strong> <code className="bg-yellow-100 dark:bg-yellow-900 px-1 rounded">hosting._domainkey.fetr.in.ua</code>
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Якщо домен обслуговується на NS серверах хостингу, DKIM запис додається автоматично. 
                      Для доменів на сторонніх NS потрібно додати запис вручну.
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">3</span>
                      DMARC (Domain-based Message Authentication, Reporting, and Conformance)
                    </h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      DMARC визначає, як вчиняти з листами, які не пройшли перевірки SPF і DKIM, а також дозволяє отримувати звіти.
                    </p>
                    <div className="bg-muted rounded-lg p-4 font-mono text-sm space-y-2">
                      <div>
                        <span className="text-muted-foreground">Тип:</span> <span className="font-semibold">TXT</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ім'я (субдомен):</span> <span className="font-semibold">_dmarc</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Значення:</span>
                        <div className="mt-1 bg-background p-2 rounded border">
                          <code className="text-primary">v=DMARC1; p=none; rua=mailto:{settings.store_email || 'admin@fetr.in.ua'}</code>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                      <p><strong>Параметри:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><code>v=DMARC1</code> — версія протоколу DMARC</li>
                        <li><code>p=none</code> — політика: листи не відхиляються, тільки збираються звіти (рекомендовано для початку)</li>
                        <li><code>rua=mailto:...</code> — адреса для отримання агрегованих звітів про перевірки DMARC</li>
                      </ul>
                      <p className="mt-2">
                        <strong>Рекомендації:</strong> Почніть з політики <code>p=none</code> для моніторингу. 
                        Після аналізу звітів можна змінити на <code>p=quarantine</code> (поміщення в спам) або <code>p=reject</code> (відхилення).
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-2">Корисні посилання:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>
                        <a href="https://www.ukraine.com.ua/ru/wiki/mail/security/spf/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          📖 Документація по SPF
                        </a>
                      </li>
                      <li>
                        <a href="https://www.ukraine.com.ua/ru/wiki/mail/security/dkim/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          📖 Документація по DKIM
                        </a>
                      </li>
                      <li>
                        <a href="https://www.ukraine.com.ua/ru/wiki/mail/security/dmarc/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          📖 Документація по DMARC
                        </a>
                      </li>
                      <li>
                        <a href="https://mxtoolbox.com/spf.aspx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                          🔍 Перевірка SPF записів (MxToolbox)
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Сповіщення */}
        <TabsContent value="notifications" className="space-y-6 mt-6">
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
        </TabsContent>
      </Tabs>

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
