import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LogOut, Mail, User, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Helmet } from 'react-helmet-async';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: 'Вихід виконано',
        description: 'Ви успішно вийшли з системи',
      });
      navigate('/');
    } catch (error) {
      toast({
        title: 'Помилка',
        description: 'Не вдалося вийти з системи',
        variant: 'destructive',
      });
    }
  };

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      <Helmet>
        <title>Мій профіль | FetrInUA</title>
        <meta property="og:title" content="Мій профіль | FetrInUA" />
      </Helmet>
      <div className="min-h-screen bg-muted/30">
        <div className="container max-w-4xl mx-auto space-y-6 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Мій профіль</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            На головну
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{user.name}</CardTitle>
                <CardDescription>{user.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Ім'я</p>
                  <p className="text-sm text-muted-foreground">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Роль</p>
                  <p className="text-sm text-muted-foreground">
                    {user.role === 'admin' ? 'Адміністратор' : 'Користувач'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="outline"
                onClick={() => navigate('/user/orders')}
                className="flex-1 min-w-0"
              >
                Мої замовлення
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/user/materials')}
                className="flex-1 min-w-0"
              >
                Мої матеріали
              </Button>
            </div>

            <Separator />

            <Button
              variant="destructive"
              onClick={handleLogout}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Вийти з системи
            </Button>
          </CardContent>
        </Card>

        {/* Footer */}
        <Separator className="my-8" />
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
    </>
  );
}

