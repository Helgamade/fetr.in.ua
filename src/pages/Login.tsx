import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { authAPI } from '@/lib/api';
import { Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Login() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Если уже авторизован, перенаправляем
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }

    // Проверяем наличие ошибки в URL
    const error = searchParams.get('error');
    if (error) {
      let errorMessage = 'Помилка авторизації';
      
      switch (error) {
        case 'google_auth_failed':
          errorMessage = 'Помилка авторизації через Google. Спробуйте ще раз.';
          break;
        case 'no_user_data':
          errorMessage = 'Не вдалося отримати дані користувача від Google.';
          break;
        case 'callback_error':
          errorMessage = 'Помилка обробки авторизації. Спробуйте ще раз.';
          break;
        case 'missing_data':
          errorMessage = 'Отримано неповні дані авторизації.';
          break;
        case 'processing_failed':
          errorMessage = 'Помилка обробки даних авторизації.';
          break;
      }

      toast({
        title: 'Помилка',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  }, [isAuthenticated, user, navigate, searchParams, toast]);

  const handleGoogleLogin = () => {
    authAPI.googleLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Вітаємо!</CardTitle>
          <CardDescription>
            Увійдіть, щоб отримати доступ до свого облікового запису
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full h-12"
            size="lg"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Увійти через Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">або</span>
            </div>
          </div>

          <div className="text-center text-sm text-muted-foreground space-y-2">
            <p>
              Продовжуючи, ви погоджуєтесь з нашими{' '}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Умовами використання
              </Link>
            </p>
            <Link to="/" className="block text-primary hover:underline">
              Повернутися на головну
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

