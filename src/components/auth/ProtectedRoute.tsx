import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Показываем загрузку пока проверяем авторизацию
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-semibold">Перевірка авторизації...</h2>
        </div>
      </div>
    );
  }

  // Если не авторизован, перенаправляем на логин
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Если требуется админ, проверяем роль
  if (requireAdmin && user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <div className="bg-card p-8 rounded-lg shadow-lg text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold text-destructive">Доступ заборонено</h1>
          <p className="text-muted-foreground">
            У вас недостатньо прав для доступу до цієї сторінки.
          </p>
          <a href="/" className="inline-block text-primary hover:underline">
            Повернутися на головну
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

