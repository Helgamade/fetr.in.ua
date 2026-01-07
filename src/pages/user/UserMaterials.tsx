import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Video, FileText, Download, Mail, Phone, Instagram, MessageCircle, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { getViberLink, getTelegramLink, getWhatsAppLink } from '@/lib/messengerLinks';

// TODO: Интегрировать с реальными данными из базы user_access
export default function UserMaterials() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: settings = {} } = usePublicSettings();
  
  const storeEmail = settings.store_email || 'support@fetr.in.ua';
  const storePhone = settings.store_phone || '+380501234567';

  // Заглушка для демонстрации
  const materials = [
    {
      id: 1,
      type: 'video',
      title: 'Майстер-клас: Створення фетрових квітів',
      description: 'Повний відеокурс з покроковими інструкціями',
      productName: 'Набір для квітів',
      expiresAt: null,
      isActive: true,
    },
    {
      id: 2,
      type: 'template',
      title: 'Шаблони для ведмедиків',
      description: 'PDF файли з шаблонами для друку',
      productName: 'Набір "Ведмедик"',
      expiresAt: null,
      isActive: true,
    },
  ];

  const typeIcons: Record<string, any> = {
    video: Video,
    template: FileText,
  };

  const typeLabels: Record<string, string> = {
    video: 'Відео',
    template: 'Шаблон',
    material: 'Матеріал',
    course: 'Курс',
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Мої матеріали</h1>
          <Button variant="outline" onClick={() => navigate('/user/profile')}>
            До профілю
          </Button>
        </div>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">
              Тут ви знайдете всі відео-уроки, шаблони та додаткові матеріали, 
              які ви отримали разом зі своїми замовленнями. Доступ до матеріалів 
              надається автоматично після оплати замовлення.
            </p>
          </CardContent>
        </Card>

        {materials.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Lock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">У вас поки немає доступних матеріалів</h2>
              <p className="text-muted-foreground mb-6">
                Матеріали з'являться тут після покупки товарів з додатковим контентом
              </p>
              <Button onClick={() => navigate('/')}>
                Перейти до магазину
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {materials.map((material) => {
              const Icon = typeIcons[material.type] || FileText;
              const typeLabel = typeLabels[material.type] || material.type;

              return (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 rounded-lg bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{material.title}</CardTitle>
                            <Badge variant="secondary">{typeLabel}</Badge>
                          </div>
                          <CardDescription>{material.description}</CardDescription>
                          <p className="text-sm text-muted-foreground">
                            Від продукту: {material.productName}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        {material.type === 'video' ? (
                          <>
                            <Video className="mr-2 h-4 w-4" />
                            Переглянути відео
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Завантажити
                          </>
                        )}
                      </Button>
                    </div>

                    {material.expiresAt && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Доступ до: {new Date(material.expiresAt).toLocaleDateString('uk-UA')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Потрібна допомога?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              Якщо ви не бачите матеріалів, які повинні бути доступні, зв'яжіться з нами:
            </p>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>Email:</span>
                <a href={`mailto:${storeEmail}`} className="text-primary font-medium hover:underline">
                  {storeEmail}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Телефон:</span>
                <a href={`tel:${storePhone.replace(/\s/g, '')}`} className="text-primary font-medium hover:underline">
                  {storePhone}
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-border">
              <p className="mb-3">Напишіть нам у Instagram, Telegram, Viber або WhatsApp:</p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://instagram.com/helgamade_ua"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-pink-500/10 text-pink-600 hover:bg-pink-500/20 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
                <a
                  href={getTelegramLink(storePhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  Telegram
                </a>
                <a
                  href={getViberLink(storePhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Viber
                </a>
                <a
                  href={getWhatsAppLink(storePhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="border-t border-border my-8" />
        <footer className="text-center space-y-2 pb-8">
          <p className="text-sm text-muted-foreground">
            © 2026 FetrInUA. Всі права захищені
          </p>
          <p className="text-sm text-muted-foreground">
            Зроблено з ❤️ в Україні
          </p>
        </footer>
      </div>
    </div>
  );
}

