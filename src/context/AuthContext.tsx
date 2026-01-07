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
      login(response.accessToken, response.refreshToken, response.user);
    } catch (error) {
      console.error('[Auth] Refresh error:', error);
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

  // Автоматическое обновление токена каждые 10 минут
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      refreshAuth();
    }, 10 * 60 * 1000); // 10 минут

    return () => clearInterval(interval);
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

