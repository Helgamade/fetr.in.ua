import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        const userStr = searchParams.get('user');
        const error = searchParams.get('error');

        if (error) {
          console.error('[Auth Callback] Error:', error);
          navigate('/login?error=' + error);
          return;
        }

        if (accessToken && refreshToken && userStr) {
          const user = JSON.parse(decodeURIComponent(userStr));
          login(accessToken, refreshToken, user);

          // Перенаправляем на главную или админку в зависимости от роли
          if (user.role === 'admin') {
            navigate('/');
          } else {
            navigate('/');
          }
        } else {
          navigate('/login?error=missing_data');
        }
      } catch (error) {
        console.error('[Auth Callback] Processing error:', error);
        navigate('/login?error=processing_failed');
      }
    };

    handleCallback();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-2xl font-semibold">Авторизація...</h2>
        <p className="text-muted-foreground">Зачекайте, будь ласка</p>
      </div>
    </div>
  );
}

