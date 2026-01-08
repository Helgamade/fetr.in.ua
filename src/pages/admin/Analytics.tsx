import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Eye, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  Monitor, 
  Smartphone, 
  Tablet,
  Globe,
  MousePointer,
  Activity
} from 'lucide-react';

export function Analytics() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Получаем онлайн пользователей
  const { data: realtimeDataRaw = [], refetch: refetchRealtime } = useQuery({
    queryKey: ['analytics-realtime'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/realtime');
      if (!response.ok) throw new Error('Failed to fetch realtime data');
      return response.json();
    },
    refetchInterval: 10000, // обновляем каждые 10 секунд
  });

  // Функция дедупликации активных пользователей
  const deduplicateUsers = (sessions: any[]) => {
    if (!sessions || sessions.length === 0) return [];

    // Сортируем по времени активности (самые свежие первыми)
    const sorted = [...sessions].sort((a, b) => 
      new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime()
    );

    const seen = new Map<string, any>();
    const result: any[] = [];

    for (const session of sorted) {
      const email = session.user_email?.toLowerCase().trim();
      const ip = session.ip_address?.split(',')[0]?.trim() || null;
      
      // 1. Если есть email - проверяем по email (один пользователь)
      if (email) {
        const key = `email:${email}`;
        if (seen.has(key)) {
          continue; // Пропускаем дубликат по email
        }
        seen.set(key, session);
        result.push(session);
        continue;
      }

      // 2. Если нет email, но есть IP - проверяем по IP + дополнительные параметры
      if (ip) {
        // Создаем ключ из IP + browser + os + device_type + fingerprint + screen_resolution
        const fingerprint = session.visitor_fingerprint || null;
        const browser = session.browser || null;
        const os = session.os || null;
        const deviceType = session.device_type || null;
        const screenResolution = session.screen_resolution || null;
        
        // Создаем составной ключ для идентификации
        const compositeKey = `ip:${ip}|browser:${browser}|os:${os}|device:${deviceType}|fingerprint:${fingerprint}|screen:${screenResolution}`;
        
        // Проверяем, есть ли уже пользователь с таким же ключом
        if (seen.has(compositeKey)) {
          continue; // Пропускаем дубликат
        }
        
        seen.set(compositeKey, session);
        result.push(session);
        continue;
      }

      // 3. Если нет ни email, ни IP - используем session_id как уникальный идентификатор
      const sessionKey = `session:${session.session_id}`;
      if (!seen.has(sessionKey)) {
        seen.set(sessionKey, session);
        result.push(session);
      }
    }

    return result;
  };

  // Применяем дедупликацию с мемоизацией
  const realtimeData = useMemo(() => deduplicateUsers(realtimeDataRaw), [realtimeDataRaw]);

  // Получаем общую статистику
  const { data: stats } = useQuery({
    queryKey: ['analytics-stats', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      });
      const response = await fetch(`/api/analytics/stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
  });

  // Получаем статистику воронки
  const { data: funnelStats } = useQuery({
    queryKey: ['analytics-funnel', dateRange],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      });
      const response = await fetch(`/api/analytics/funnel-stats?${params}`);
      if (!response.ok) throw new Error('Failed to fetch funnel stats');
      return response.json();
    },
  });

  // Получаем настройки аналитики
  const { data: analyticsSettings } = useQuery({
    queryKey: ['analytics-settings'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
  });

  const handleSaveSettings = async (settings: Record<string, string>) => {
    try {
      const response = await fetch('/api/analytics/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!response.ok) throw new Error('Failed to save settings');
      alert('Настройки сохранены');
    } catch (error) {
      alert('Ошибка сохранения настроек');
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatPercent = (value: number, total: number) => {
    if (!total) return '0%';
    return `${Math.round((value / total) * 100)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Аналітика</h1>
          <p className="text-muted-foreground">Відстеження відвідувачів та конверсій</p>
        </div>
      </div>

      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList>
          <TabsTrigger value="realtime">
            <Activity className="mr-2 h-4 w-4" />
            В реальному часі
          </TabsTrigger>
          <TabsTrigger value="overview">
            <TrendingUp className="mr-2 h-4 w-4" />
            Огляд
          </TabsTrigger>
          <TabsTrigger value="funnel">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Воронка продажів
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Globe className="mr-2 h-4 w-4" />
            Налаштування
          </TabsTrigger>
        </TabsList>

        {/* Реальний час */}
        <TabsContent value="realtime" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Онлайн зараз</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{realtimeData.length}</div>
                <p className="text-xs text-muted-foreground">
                  активних користувачів
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">З товарами в кошику</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {realtimeData.filter((s: any) => s.cart_items_count > 0).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  користувачів з кошиком
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Авторизовані</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {realtimeData.filter((s: any) => s.user_id).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  зареєстрованих користувачів
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Мобільні</CardTitle>
                <Smartphone className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {realtimeData.filter((s: any) => s.device_type === 'mobile').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  з мобільних пристроїв
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Активні користувачі</CardTitle>
              <CardDescription>Користувачі онлайн прямо зараз</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realtimeData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Немає активних користувачів
                  </p>
                ) : (
                  realtimeData.map((session: any) => (
                    <div key={session.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {session.device_type === 'mobile' && <Smartphone className="h-4 w-4 text-muted-foreground" />}
                          {session.device_type === 'tablet' && <Tablet className="h-4 w-4 text-muted-foreground" />}
                          {session.device_type === 'desktop' && <Monitor className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-medium">
                            {session.user_name || 'Гість'}
                          </span>
                          {session.user_email && (
                            <span className="text-sm text-muted-foreground">
                              ({session.user_email})
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {session.current_page_title || session.current_page}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <span>{session.browser} • {session.os}</span>
                          {session.ip_address && (
                            <span className="font-mono">IP: {session.ip_address.split(',')[0].trim()}</span>
                          )}
                          {session.city && <span>{session.city}</span>}
                          {session.utm_source && (
                            <Badge variant="outline" className="text-xs">
                              {session.utm_source}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {session.cart_items_count > 0 && (
                          <Badge variant="secondary">
                            <ShoppingCart className="mr-1 h-3 w-3" />
                            {session.cart_items_count}
                          </Badge>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {Math.floor((Date.now() - new Date(session.last_activity_at).getTime()) / 1000 / 60)} хв тому
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Огляд */}
        <TabsContent value="overview" className="space-y-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="from">Від</Label>
              <Input
                id="from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="to">До</Label>
              <Input
                id="to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>

          {stats && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Всього сесій</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.general.total_sessions}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.general.total_users} унікальних користувачів
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Переглядів сторінок</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.general.total_page_views}</div>
                    <p className="text-xs text-muted-foreground">
                      {stats.general.avg_pages_per_session?.toFixed(1)} на сесію
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Середній час</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatTime(Math.round(stats.general.avg_time_spent || 0))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      на сесію
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Події</CardTitle>
                    <MousePointer className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.events.reduce((sum: number, e: any) => sum + e.count, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      всього подій
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Топ сторінок</CardTitle>
                    <CardDescription>Найпопулярніші сторінки за період</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.topPages.slice(0, 10).map((page: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{page.page_title || page.page_url}</div>
                            <div className="text-sm text-muted-foreground truncate">{page.page_url}</div>
                          </div>
                          <div className="text-right ml-4">
                            <div className="font-medium">{page.views}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(Math.round(page.avg_time_spent || 0))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Джерела трафіку</CardTitle>
                    <CardDescription>Звідки приходять користувачі</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {stats.trafficSources.map((source: any, index: number) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{source.source}</Badge>
                            {source.medium && (
                              <span className="text-sm text-muted-foreground">/ {source.medium}</span>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{source.sessions}</div>
                            <div className="text-xs text-muted-foreground">
                              {source.users} користувачів
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Пристрої</CardTitle>
                  <CardDescription>Розподіл за типами пристроїв</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {stats.devices.map((device: any) => (
                      <div key={device.device_type} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {device.device_type === 'mobile' && <Smartphone className="h-5 w-5" />}
                            {device.device_type === 'tablet' && <Tablet className="h-5 w-5" />}
                            {device.device_type === 'desktop' && <Monitor className="h-5 w-5" />}
                            <span className="font-medium capitalize">{device.device_type}</span>
                          </div>
                          <span className="text-2xl font-bold">{device.sessions}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {device.avg_pages?.toFixed(1)} сторінок • {formatTime(Math.round(device.avg_time || 0))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Воронка продажів */}
        <TabsContent value="funnel" className="space-y-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label htmlFor="funnel-from">Від</Label>
              <Input
                id="funnel-from"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="funnel-to">До</Label>
              <Input
                id="funnel-to"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>

          {funnelStats && funnelStats[0] && (
            <Card>
              <CardHeader>
                <CardTitle>Воронка конверсії</CardTitle>
                <CardDescription>Етапи оформлення замовлення</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { key: 'visited_site', label: 'Зайшли на сайт' },
                    { key: 'viewed_product', label: 'Переглянули товар' },
                    { key: 'added_to_cart', label: 'Додали в кошик' },
                    { key: 'started_checkout', label: 'Почали оформлення' },
                    { key: 'filled_name', label: 'Заповнили ім\'я' },
                    { key: 'filled_phone', label: 'Заповнили телефон' },
                    { key: 'selected_delivery', label: 'Вибрали доставку' },
                    { key: 'filled_delivery', label: 'Заповнили доставку' },
                    { key: 'selected_payment', label: 'Вибрали оплату' },
                    { key: 'clicked_submit', label: 'Натиснули "Оформити"' },
                    { key: 'completed_order', label: 'Завершили замовлення' },
                    { key: 'paid_order', label: 'Оплатили замовлення' },
                  ].map((stage, index) => {
                    const count = funnelStats[0][stage.key] || 0;
                    const total = funnelStats[0].visited_site || 1;
                    const prevCount = index > 0 ? (funnelStats[0][[
                      'visited_site', 'viewed_product', 'added_to_cart', 'started_checkout',
                      'filled_name', 'filled_phone', 'selected_delivery', 'filled_delivery',
                      'selected_payment', 'clicked_submit', 'completed_order'
                    ][index - 1]] || 0) : total;
                    
                    const conversionFromPrev = prevCount > 0 ? (count / prevCount * 100).toFixed(1) : '0';
                    const conversionFromStart = (count / total * 100).toFixed(1);

                    return (
                      <div key={stage.key} className="relative">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{stage.label}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {conversionFromPrev}% від попереднього • {conversionFromStart}% від початку
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{count}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatPercent(count, total)}
                            </div>
                          </div>
                        </div>
                        {index < 11 && (
                          <div className="absolute left-1/2 -translate-x-1/2 w-0.5 h-4 bg-border" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {funnelStats[0].avg_cart_value && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Середня сума кошика</div>
                    <div className="text-2xl font-bold">{funnelStats[0].avg_cart_value.toFixed(2)} ₴</div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Налаштування */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Налаштування інтеграцій</CardTitle>
              <CardDescription>Підключення Google Analytics, Google Ads та інших сервісів</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="gtm">Google Tag Manager ID</Label>
                <Input
                  id="gtm"
                  placeholder="GTM-XXXXXXX"
                  defaultValue={analyticsSettings?.google_tag_manager_id}
                />
                <p className="text-xs text-muted-foreground">
                  Формат: GTM-XXXXXXX
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ga4">Google Analytics 4 ID</Label>
                <Input
                  id="ga4"
                  placeholder="G-XXXXXXXXXX"
                  defaultValue={analyticsSettings?.google_analytics_id}
                />
                <p className="text-xs text-muted-foreground">
                  Формат: G-XXXXXXXXXX
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gads">Google Ads ID</Label>
                <Input
                  id="gads"
                  placeholder="AW-XXXXXXXXXX"
                  defaultValue={analyticsSettings?.google_ads_id}
                />
                <p className="text-xs text-muted-foreground">
                  Формат: AW-XXXXXXXXXX
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fbpixel">Facebook Pixel ID</Label>
                <Input
                  id="fbpixel"
                  placeholder="XXXXXXXXXXXXXXX"
                  defaultValue={analyticsSettings?.facebook_pixel_id}
                />
              </div>

              <Button
                onClick={() => {
                  const gtm = (document.getElementById('gtm') as HTMLInputElement).value;
                  const ga4 = (document.getElementById('ga4') as HTMLInputElement).value;
                  const gads = (document.getElementById('gads') as HTMLInputElement).value;
                  const fbpixel = (document.getElementById('fbpixel') as HTMLInputElement).value;

                  handleSaveSettings({
                    google_tag_manager_id: gtm,
                    google_analytics_id: ga4,
                    google_ads_id: gads,
                    facebook_pixel_id: fbpixel,
                  });
                }}
              >
                Зберегти налаштування
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Інструкції з налаштування</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Google Tag Manager</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Створіть обліковий запис на <a href="https://tagmanager.google.com" target="_blank" rel="noopener" className="text-primary hover:underline">tagmanager.google.com</a></li>
                  <li>Створіть контейнер для вашого сайту</li>
                  <li>Скопіюйте ID контейнера (формат: GTM-XXXXXXX)</li>
                  <li>Вставте ID в поле вище та збережіть</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Google Analytics 4</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Створіть обліковий запис на <a href="https://analytics.google.com" target="_blank" rel="noopener" className="text-primary hover:underline">analytics.google.com</a></li>
                  <li>Створіть ресурс GA4</li>
                  <li>Скопіюйте ідентифікатор вимірювання (формат: G-XXXXXXXXXX)</li>
                  <li>Вставте ID в поле вище та збережіть</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Google Ads</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Увійдіть в <a href="https://ads.google.com" target="_blank" rel="noopener" className="text-primary hover:underline">ads.google.com</a></li>
                  <li>Перейдіть в "Інструменти" → "Відстеження конверсій"</li>
                  <li>Створіть дію конверсії</li>
                  <li>Скопіюйте ідентифікатор конверсії (формат: AW-XXXXXXXXXX)</li>
                  <li>Вставте ID в поле вище та збережіть</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

