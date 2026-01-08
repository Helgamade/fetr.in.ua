import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { analytics } from '@/lib/analytics';
import { GoogleTagManager } from './GoogleTagManager';

/**
 * Компонент для инициализации аналитики
 * Автоматически отслеживает просмотры страниц при навигации
 */
export function AnalyticsInit() {
  const location = useLocation();

  // Получаем настройки аналитики
  const { data: settings } = useQuery({
    queryKey: ['analytics-settings'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/settings');
      if (!response.ok) return {};
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });

  // Инициализируем аналитику при монтировании (ТОЛЬКО если НЕ админка)
  useEffect(() => {
    // НЕ отслеживаем админку - полностью отключаем аналитику для /admin/*
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    analytics.init();

    // Очищаем при размонтировании
    return () => {
      analytics.destroy();
    };
  }, []);

  // Отслеживаем изменение страницы (ТОЛЬКО если НЕ админка)
  useEffect(() => {
    // НЕ отслеживаем админку
    if (location.pathname.startsWith('/admin')) {
      return;
    }

    analytics.trackPageView();
  }, [location.pathname]);

  return (
    <GoogleTagManager
      gtmId={settings?.google_tag_manager_id}
      ga4Id={settings?.google_analytics_id}
      gadsId={settings?.google_ads_id}
    />
  );
}

