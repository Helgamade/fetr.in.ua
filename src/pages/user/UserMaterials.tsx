import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Video, FileText, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// TODO: Интегрировать с реальными данными из базы user_access
export default function UserMaterials() {
  const { user } = useAuth();
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-muted/30 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Мої матеріали</h1>
          <Button variant="outline" onClick={() => navigate('/user/profile')}>
            Назад до профілю
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
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Якщо ви не бачите матеріалів, які повинні бути доступні, зв'яжіться з нами:
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>Email: support@fetr.in.ua</li>
              <li>Телефон: +380 XX XXX XX XX</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

