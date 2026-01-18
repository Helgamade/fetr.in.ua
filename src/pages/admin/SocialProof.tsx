import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Save, Plus, Trash2, Settings, BarChart3, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

export function SocialProof() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Определяем текущую вкладку из URL (как в Analytics)
  const currentTab = location.pathname.split('/').pop() || 'settings';
  
  // Редирект на /settings если открыт /social-proof без подпути
  useEffect(() => {
    if (location.pathname === '/admin/social-proof') {
      navigate('/admin/social-proof/settings', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Загрузка настроек
  const { data: settings = {}, isLoading: settingsLoading } = useQuery({
    queryKey: ['social-proof-settings'],
    queryFn: () => fetchAPI<Record<string, any>>('/social-proof/settings')
  });

  // Загрузка типов уведомлений
  const { data: notificationTypes = [] } = useQuery({
    queryKey: ['social-proof-types'],
    queryFn: () => fetchAPI<any[]>('/social-proof/notification-types')
  });

  // Загрузка имен
  const { data: names = [] } = useQuery({
    queryKey: ['social-proof-names'],
    queryFn: () => fetchAPI<any[]>('/social-proof/names')
  });

  // Локальное состояние для типов уведомлений
  const [localNotificationTypes, setLocalNotificationTypes] = useState<any[]>([]);

  useEffect(() => {
    if (notificationTypes.length > 0) {
      setLocalNotificationTypes(notificationTypes);
    }
  }, [notificationTypes]);

  // Загрузка логов (требует авторизации админа)
  const [logPage, setLogPage] = useState(1);
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['social-proof-logs', logPage],
    queryFn: () => fetchAPI<{ logs: any[]; pagination: any }>(`/social-proof/logs?page=${logPage}&limit=50`),
    retry: 1
  });

  // Локальное состояние для настроек
  const [localSettings, setLocalSettings] = useState({
    first_notification_delay: 60,
    notification_interval: 60,
    notification_order: 'random',
    max_notifications_per_session: 10
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setLocalSettings({
        first_notification_delay: settings.first_notification_delay || 60,
        notification_interval: settings.notification_interval || 60,
        notification_order: settings.notification_order || 'random',
        max_notifications_per_session: settings.max_notifications_per_session || 10
      });
    }
  }, [settings]);

  // Сохранение настроек
  const saveSettings = useMutation({
    mutationFn: async (newSettings: Record<string, any>) => {
      try {
        const result = await fetchAPI<any>('/social-proof/settings', {
          method: 'PUT',
          body: JSON.stringify(newSettings)
        });
        return result;
      } catch (error: any) {
        console.error('Error saving settings:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({ title: 'Налаштування збережено' });
      queryClient.invalidateQueries({ queryKey: ['social-proof-settings'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Помилка збереження';
      toast({ 
        title: 'Помилка збереження', 
        description: errorMessage,
        variant: 'destructive' 
      });
      console.error('Error saving settings:', error);
    }
  });

  // Сохранение всех типов уведомлений
  const saveNotificationTypes = useMutation({
    mutationFn: async (types: any[]) => {
      // Сохраняем каждый тип последовательно
      const promises = types.map(type => 
        fetchAPI<any>(`/social-proof/notification-types/${type.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: type.name,
            template: type.template,
            is_enabled: type.is_enabled,
            sort_order: type.sort_order
          })
        })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      toast({ title: 'Типи збережено' });
      queryClient.invalidateQueries({ queryKey: ['social-proof-types'] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || 'Помилка збереження';
      toast({ 
        title: 'Помилка збереження типів', 
        description: errorMessage,
        variant: 'destructive' 
      });
      console.error('Error saving notification types:', error);
    }
  });

  // Добавление имени
  const [newName, setNewName] = useState('');
  const addName = useMutation({
    mutationFn: (name: string) => 
      fetchAPI<any>('/social-proof/names', {
        method: 'POST',
        body: JSON.stringify({ name })
      }),
    onSuccess: () => {
      toast({ title: 'Ім\'я додано' });
      setNewName('');
      queryClient.invalidateQueries({ queryKey: ['social-proof-names'] });
    },
    onError: () => {
      toast({ title: 'Помилка додавання', variant: 'destructive' });
    }
  });

  // Удаление имени
  const deleteName = useMutation({
    mutationFn: (id: number) => 
      fetchAPI<any>(`/social-proof/names/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({ title: 'Ім\'я видалено' });
      queryClient.invalidateQueries({ queryKey: ['social-proof-names'] });
    },
    onError: () => {
      toast({ title: 'Помилка видалення', variant: 'destructive' });
    }
  });

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('uk-UA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatHoursAgo = (hours: number) => {
    if (hours === 1) return '1 годину';
    if (hours < 5) return `${hours} години`;
    return `${hours} годин`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Соціальні підтвердження</h1>
        <p className="text-muted-foreground">Налаштування автоматичних сповіщень</p>
      </div>

      <Tabs value={currentTab} onValueChange={(value) => navigate(`/admin/social-proof/${value}`)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="settings">
            <Settings className="w-4 h-4 mr-2" />
            Налаштування
          </TabsTrigger>
          <TabsTrigger value="types">
            <FileText className="w-4 h-4 mr-2" />
            Типи сповіщень
          </TabsTrigger>
          <TabsTrigger value="names">
            Імена
          </TabsTrigger>
          <TabsTrigger value="logs">
            <BarChart3 className="w-4 h-4 mr-2" />
            Логи ({logsData?.pagination?.total || 0})
          </TabsTrigger>
        </TabsList>

        {/* Настройки */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Основні налаштування</CardTitle>
              <CardDescription>Налаштування інтервалів та порядку показу сповіщень</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Затримка першого сповіщення (секунд)</Label>
                <Input
                  type="number"
                  min="0"
                  value={localSettings.first_notification_delay}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    first_notification_delay: parseInt(e.target.value) || 0
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Перше сповіщення з'явиться через вказану кількість секунд після заходу на сайт
                </p>
              </div>

              <div className="space-y-2">
                <Label>Інтервал між сповіщеннями (секунд)</Label>
                <Input
                  type="number"
                  min="1"
                  value={localSettings.notification_interval}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    notification_interval: parseInt(e.target.value) || 60
                  })}
                />
                <p className="text-xs text-muted-foreground">
                  Мінімальний інтервал між показом сповіщень
                </p>
              </div>

              <div className="space-y-2">
                <Label>Максимальна кількість сповіщень за сесію</Label>
                <Input
                  type="number"
                  min="1"
                  value={localSettings.max_notifications_per_session}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    max_notifications_per_session: parseInt(e.target.value) || 10
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Порядок показу</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={localSettings.notification_order}
                  onChange={(e) => setLocalSettings({
                    ...localSettings,
                    notification_order: e.target.value
                  })}
                >
                  <option value="sequential">Послідовний (по черзі)</option>
                  <option value="random">Випадковий</option>
                </select>
              </div>

              <Button 
                onClick={() => saveSettings.mutate(localSettings)}
                disabled={saveSettings.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {saveSettings.isPending ? 'Збереження...' : 'Зберегти налаштування'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Типы уведомлений */}
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Типи сповіщень</CardTitle>
              <CardDescription>Налаштування шаблонів та порядку показу сповіщень</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localNotificationTypes.map((type: any) => (
                  <Card key={type.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{type.name}</CardTitle>
                          <CardDescription>Код: {type.code}</CardDescription>
                        </div>
                        <Switch
                          checked={type.is_enabled}
                          onCheckedChange={(checked) => {
                            setLocalNotificationTypes(prev => 
                              prev.map(t => t.id === type.id ? { ...t, is_enabled: checked } : t)
                            );
                          }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Шаблон повідомлення</Label>
                        <Textarea
                          value={type.template}
                          onChange={(e) => {
                            setLocalNotificationTypes(prev => 
                              prev.map(t => t.id === type.id ? { ...t, template: e.target.value } : t)
                            );
                          }}
                          rows={3}
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Змінні: {type.code === 'viewing' ? '{count}, {product_name}' :
                                  type.code === 'purchased_today' ? '{count}, {product_name}' :
                                  '{name}, {city}, {hours_ago}, {product_name}'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <Button 
                  onClick={() => saveNotificationTypes.mutate(localNotificationTypes)}
                  disabled={saveNotificationTypes.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveNotificationTypes.isPending ? 'Збереження...' : 'Зберегти типи сповіщень'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Имена */}
        <TabsContent value="names">
          <Card>
            <CardHeader>
              <CardTitle>Список імен</CardTitle>
              <CardDescription>Імена для персональних сповіщень типу "Ольга (Київ) купила..."</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Нове ім'я (наприклад, Ольга)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newName.trim()) {
                      addName.mutate(newName.trim());
                    }
                  }}
                />
                <Button 
                  onClick={() => {
                    if (newName.trim()) {
                      addName.mutate(newName.trim());
                    }
                  }}
                  disabled={addName.isPending || !newName.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Додати
                </Button>
              </div>

              <div className="space-y-2">
                {names.map((name: any) => (
                  <div key={name.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <span className="font-medium">{name.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteName.mutate(name.id)}
                      disabled={deleteName.isPending}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Логи */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Логи відправки сповіщень</CardTitle>
              <CardDescription>
                Всі відправлені сповіщення користувачам
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Завантаження логів...
                </div>
              ) : logsData?.logs?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Логів поки що немає
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Час</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead>Товар</TableHead>
                          <TableHead>Повідомлення</TableHead>
                          <TableHead>Місто (IP)</TableHead>
                          <TableHead>Місто (НП)</TableHead>
                          <TableHead>Координати</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {logsData?.logs?.map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap">
                              {formatDate(log.created_at)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                log.notification_type === 'viewing' ? 'default' :
                                log.notification_type === 'purchased_today' ? 'secondary' :
                                'outline'
                              }>
                                {log.notification_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {log.product_name || '-'}
                            </TableCell>
                            <TableCell className="max-w-md">
                              <div className="truncate" title={log.message_text}>
                                {log.message_text}
                              </div>
                            </TableCell>
                            <TableCell>
                              {log.client_city_from_ip || '-'}
                            </TableCell>
                            <TableCell>
                              {log.client_city_from_np || '-'}
                            </TableCell>
                            <TableCell className="text-xs font-mono">
                              {log.client_latitude && log.client_longitude 
                                ? `${Number(log.client_latitude).toFixed(4)}, ${Number(log.client_longitude).toFixed(4)}`
                                : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Пагинация */}
                  {logsData?.pagination && logsData.pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logPage === 1}
                        onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Назад
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Сторінка {logPage} з {logsData.pagination.totalPages} 
                        (всього: {logsData.pagination.total})
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={logPage >= logsData.pagination.totalPages}
                        onClick={() => setLogPage(p => p + 1)}
                      >
                        Вперед
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
