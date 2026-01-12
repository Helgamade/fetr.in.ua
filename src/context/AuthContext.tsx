import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, refreshToken: string, userData: User) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Сохранение токенов и данных пользователя
  const login = useCallback((accessToken: string, refreshToken: string, userData: User) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    // Триггерим событие для синхронизации между вкладками
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'accessToken',
      newValue: accessToken,
      storageArea: localStorage
    }));
  }, []);

  // Выход из системы
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  }, []);

  // Обновление токена
  const refreshAuth = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const response = await authAPI.refresh(refreshToken);
      // refreshToken может не возвращаться (остается тот же), используем существующий если не пришел новый
      const newRefreshToken = response.refreshToken || refreshToken;
      login(response.accessToken, newRefreshToken, response.user);
    } catch (error) {
      console.error('[Auth] Refresh error:', error);
      // Не выходим сразу - может быть временная ошибка сети
      // Попробуем еще раз через небольшую задержку
      await new Promise(resolve => setTimeout(resolve, 1000));
      try {
        const retryRefreshToken = localStorage.getItem('refreshToken');
        if (retryRefreshToken) {
          const retryResponse = await authAPI.refresh(retryRefreshToken);
          const newRefreshToken = retryResponse.refreshToken || retryRefreshToken;
          login(retryResponse.accessToken, newRefreshToken, retryResponse.user);
          return;
        }
      } catch (retryError) {
        console.error('[Auth] Retry refresh error:', retryError);
      }
      // Только после второй неудачной попытки выходим
      await logout();
    }
  }, [login, logout]);

  // Проверка авторизации при загрузке
  useEffect(() => {
    const initAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');

        if (accessToken && storedUser) {
          // Проверяем, действителен ли токен
          try {
            const currentUser = await authAPI.me();
            setUser(currentUser);
          } catch (error) {
            // Токен просрочен, пробуем обновить
            await refreshAuth();
          }
        }
      } catch (error) {
        console.error('[Auth] Init error:', error);
        await logout();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [refreshAuth, logout]);

  // Автоматическое обновление токена - только при необходимости
  useEffect(() => {
    if (!user) return;

    let isRefreshing = false; // Флаг для предотвращения одновременных обновлений

    // Проверяем время до истечения access token (обновляем за 2 минуты до истечения)
    const checkAndRefresh = async () => {
      // Предотвращаем одновременные обновления из разных вкладок
      if (isRefreshing) return;
      
      try {
        // Проверяем токен через API - если 401, обновим автоматически
        await authAPI.me();
      } catch (error) {
        // Токен истек или невалиден - обновляем
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            await refreshAuth();
          } finally {
            // Сбрасываем флаг через небольшую задержку
            setTimeout(() => {
              isRefreshing = false;
            }, 2000);
          }
        }
      }
    };

    // Проверяем каждые 10 минут (access token живет 15 минут)
    const interval = setInterval(checkAndRefresh, 10 * 60 * 1000);

    // Также проверяем при возврате фокуса на вкладку
    const handleFocus = () => {
      checkAndRefresh();
    };
    window.addEventListener('focus', handleFocus);

    // Синхронизация между вкладками через storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && e.newValue) {
        // Токен обновлен в другой вкладке - обновляем локальное состояние
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (error) {
            console.error('[Auth] Error parsing user from storage:', error);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, refreshAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

