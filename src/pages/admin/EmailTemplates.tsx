import { useState, useEffect } from 'react';
import { Save, Mail, TestTube, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { emailTemplatesAPI, EmailTemplate } from '@/lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const EVENT_TYPES = [
  { 
    value: 'order_created_admin', 
    label: 'Нове замовлення (адмін)', 
    description: 'Відправляється адміністратору при створенні нового замовлення' 
  },
  { 
    value: 'order_created_customer', 
    label: 'Замовлення прийнято (клієнт)', 
    description: 'Відправляється клієнту при створенні замовлення' 
  },
  { 
    value: 'order_paid_admin', 
    label: 'Замовлення оплачено (адмін)', 
    description: 'Відправляється адміністратору при оплаті замовлення' 
  },
  { 
    value: 'order_paid_customer', 
    label: 'Оплата підтверджена (клієнт)', 
    description: 'Відправляється клієнту при підтвердженні оплати' 
  },
  { 
    value: 'order_status_changed', 
    label: 'Статус замовлення змінено', 
    description: 'Відправляється клієнту при зміні статусу замовлення' 
  },
  { 
    value: 'review_created_admin', 
    label: 'Новий відгук (адмін)', 
    description: 'Відправляється адміністратору при створенні нового відгуку' 
  },
  { 
    value: 'review_approved', 
    label: 'Відгук опубліковано', 
    description: 'Відправляється клієнту при публікації відгуку' 
  },
];

export function EmailTemplates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEventType, setSelectedEventType] = useState<string>(EVENT_TYPES[0].value);
  const [localTemplates, setLocalTemplates] = useState<Record<string, Partial<EmailTemplate>>>({});
  const [testEmail, setTestEmail] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ['email-templates'],
    queryFn: () => emailTemplatesAPI.getAll(),
  });

  const updateTemplate = useMutation({
    mutationFn: ({ eventType, data }: { eventType: string; data: Partial<EmailTemplate> }) =>
      emailTemplatesAPI.update(eventType, {
        subject: data.subject || '',
        body_html: data.body_html || '',
        body_text: data.body_text || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        description: data.description || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast({
        title: 'Шаблон збережено',
        description: 'Шаблон email успішно оновлено',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося зберегти шаблон',
        variant: 'destructive',
      });
    },
  });

  const testTemplate = useMutation({
    mutationFn: ({ eventType, testEmail, testData }: { eventType: string; testEmail: string; testData?: Record<string, any> }) =>
      emailTemplatesAPI.test(eventType, testEmail, testData),
    onSuccess: () => {
      toast({
        title: 'Тестовий email відправлено',
        description: 'Перевірте вашу пошту',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Помилка',
        description: error.message || 'Не вдалося відправити тестовий email',
        variant: 'destructive',
      });
    },
  });

  // Инициализируем локальное состояние при загрузке шаблонов
  useEffect(() => {
    if (templates.length > 0) {
      const local: Record<string, Partial<EmailTemplate>> = {};
      templates.forEach(template => {
        local[template.event_type] = {
          subject: template.subject,
          body_html: template.body_html,
          body_text: template.body_text,
          is_active: template.is_active,
          description: template.description,
        };
      });
      setLocalTemplates(local);
    }
  }, [templates]);

  const currentTemplate = templates.find(t => t.event_type === selectedEventType);
  const localTemplate = localTemplates[selectedEventType] || {};

  const handleSave = () => {
    if (!currentTemplate) return;
    
    const data = localTemplate;
    if (!data.subject || !data.body_html) {
      toast({
        title: 'Помилка',
        description: 'Тема та HTML тіло обов\'язкові',
        variant: 'destructive',
      });
      return;
    }

    updateTemplate.mutate({ eventType: selectedEventType, data });
  };

  const handleTest = () => {
    if (!testEmail.trim()) {
      toast({
        title: 'Помилка',
        description: 'Введіть email для тесту',
        variant: 'destructive',
      });
      return;
    }

    // Тестовые данные для шаблона
    const testData = {
      orderNumber: '305328',
      customerName: 'Іван Петренко',
      customerPhone: '+380501234567',
      customerEmail: testEmail,
      total: '1500.00',
      status: 'Створено',
      deliveryMethod: 'Нова Пошта',
      deliveryCity: 'Київ',
      deliveryWarehouse: 'Відділення №1',
      paymentMethod: 'Онлайн оплата',
      orderLink: 'https://fetr.in.ua/admin/orders/305328',
      trackingLink: 'https://fetr.in.ua/order/1234567890',
      reviewerName: 'Олена Коваленко',
      rating: '5',
      reviewText: 'Чудовий товар, рекомендую!',
      reviewLink: 'https://fetr.in.ua/reviews',
    };

    testTemplate.mutate({ eventType: selectedEventType, testEmail, testData });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Завантаження шаблонів...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Шаблони Email сповіщень</h1>
        <p className="text-muted-foreground mt-2">
          Налаштуйте шаблони для автоматичних email сповіщень
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список типов событий */}
        <Card>
          <CardHeader>
            <CardTitle>Типи подій</CardTitle>
            <CardDescription>Виберіть тип події для редагування</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {EVENT_TYPES.map(eventType => (
              <button
                key={eventType.value}
                onClick={() => setSelectedEventType(eventType.value)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${
                  selectedEventType === eventType.value
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted'
                }`}
              >
                <div className="font-medium">{eventType.label}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {eventType.description}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Редактор шаблона */}
        <div className="lg:col-span-2 space-y-4">
          {currentTemplate && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>
                      {EVENT_TYPES.find(e => e.value === selectedEventType)?.label}
                    </CardTitle>
                    <CardDescription>
                      {EVENT_TYPES.find(e => e.value === selectedEventType)?.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={localTemplate.is_active !== false}
                      onCheckedChange={(checked) =>
                        setLocalTemplates({
                          ...localTemplates,
                          [selectedEventType]: { ...localTemplate, is_active: checked },
                        })
                      }
                    />
                    <Label>Активний</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Тема листа</Label>
                  <Input
                    id="subject"
                    value={localTemplate.subject || ''}
                    onChange={(e) =>
                      setLocalTemplates({
                        ...localTemplates,
                        [selectedEventType]: { ...localTemplate, subject: e.target.value },
                      })
                    }
                    placeholder="Тема email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="body_html">HTML тіло листа</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowPreview(!showPreview)}
                    >
                      {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {showPreview ? 'Приховати' : 'Показати'} превью
                    </Button>
                  </div>
                  {showPreview ? (
                    <div
                      className="border rounded-lg p-4 bg-muted"
                      dangerouslySetInnerHTML={{
                        __html: localTemplate.body_html || '',
                      }}
                    />
                  ) : (
                    <Textarea
                      id="body_html"
                      value={localTemplate.body_html || ''}
                      onChange={(e) =>
                        setLocalTemplates({
                          ...localTemplates,
                          [selectedEventType]: { ...localTemplate, body_html: e.target.value },
                        })
                      }
                      placeholder="HTML тіло листа"
                      rows={12}
                      className="font-mono text-sm"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="body_text">Текстова версія (опціонально)</Label>
                  <Textarea
                    id="body_text"
                    value={localTemplate.body_text || ''}
                    onChange={(e) =>
                      setLocalTemplates({
                        ...localTemplates,
                        [selectedEventType]: { ...localTemplate, body_text: e.target.value },
                      })
                    }
                    placeholder="Текстова версія листа"
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Доступні змінні для шаблонів:</Label>
                  <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg font-mono">
                    {selectedEventType.includes('order') ? (
                      <>
                        {'{{orderNumber}}'} - номер замовлення<br />
                        {'{{customerName}}'} - ім'я клієнта<br />
                        {'{{customerPhone}}'} - телефон клієнта<br />
                        {'{{customerEmail}}'} - email клієнта<br />
                        {'{{total}}'} - сума замовлення<br />
                        {'{{status}}'} - статус замовлення<br />
                        {'{{deliveryMethod}}'} - спосіб доставки<br />
                        {'{{deliveryCity}}'} - місто доставки<br />
                        {'{{deliveryWarehouse}}'} - відділення<br />
                        {'{{paymentMethod}}'} - спосіб оплати<br />
                        {'{{orderLink}}'} - посилання на замовлення<br />
                        {'{{trackingLink}}'} - посилання для відстеження<br />
                        {'{{#if customerEmail}}...{{/if}}'} - умовний блок
                      </>
                    ) : (
                      <>
                        {'{{reviewerName}}'} - ім'я автора відгуку<br />
                        {'{{rating}}'} - рейтинг<br />
                        {'{{reviewText}}'} - текст відгуку<br />
                        {'{{reviewLink}}'} - посилання на відгук
                      </>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={updateTemplate.isPending}>
                    <Save className="h-4 w-4 mr-2" />
                    Зберегти шаблон
                  </Button>
                  <div className="flex-1 flex gap-2">
                    <Input
                      type="email"
                      placeholder="Email для тесту"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="max-w-xs"
                    />
                    <Button
                      variant="outline"
                      onClick={handleTest}
                      disabled={testTemplate.isPending || !testEmail.trim()}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Відправити тест
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

