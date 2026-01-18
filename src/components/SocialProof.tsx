import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useProducts } from '@/hooks/useProducts';
import { Eye, ShoppingBag, X, Users } from 'lucide-react';
import { cn, getViewingNowCount, getTodayPurchases } from '@/lib/utils';

// Вспомогательные функции для получения sessionId и fingerprint
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

const getFingerprint = (): string => {
  let fingerprint = localStorage.getItem('analytics_fingerprint');
  if (!fingerprint) {
    // Генерируем простой fingerprint на основе браузера
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint', 2, 2);
    }
    fingerprint = `${navigator.userAgent}_${screen.width}x${screen.height}_${navigator.language}_${canvas.toDataURL().slice(-10)}`;
    localStorage.setItem('analytics_fingerprint', fingerprint);
  }
  return fingerprint;
};

interface Notification {
  id: string;
  type: 'viewing' | 'purchased_today' | 'purchased_local';
  productName: string;
  productId: number;
  productCode?: string;
  city?: string;
  name?: string;
  hoursAgo?: number;
  count?: number;
  messageText: string;
}

export const SocialProof: React.FC = () => {
  const { data: products = [] } = useProducts();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [sessionStartTime] = useState(() => Date.now());
  const [lastNotificationTime, setLastNotificationTime] = useState(0);
  const [notificationsCount, setNotificationsCount] = useState(0);
  const [notificationTypes, setNotificationTypes] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    first_notification_delay: 60000,
    notification_interval: 60000,
    notification_order: 'random',
    max_notifications_per_session: 10,
    city_search_radius: 30
  });
  const notificationOrderRef = useRef<number[]>([]);
  const currentOrderIndexRef = useRef(0);

  // Получаем текущий час в Киеве для расчетов
  const currentHour = useMemo(() => {
    const now = new Date();
    return parseInt(now.toLocaleString('en-US', { 
      timeZone: 'Europe/Kyiv',
      hour: '2-digit',
      hour12: false
    }));
  }, []);

  // Загрузка настроек
  const { data: settingsData } = useQuery({
    queryKey: ['social-proof-settings'],
    queryFn: async () => {
      const res = await fetch('/api/social-proof/settings');
      if (!res.ok) return {};
      return res.json();
    }
  });

  // Загрузка типов уведомлений
  const { data: typesData } = useQuery({
    queryKey: ['social-proof-types'],
    queryFn: async () => {
      const res = await fetch('/api/social-proof/notification-types');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Загрузка имен
  const { data: namesData = [] } = useQuery({
    queryKey: ['social-proof-names'],
    queryFn: async () => {
      const res = await fetch('/api/social-proof/names');
      if (!res.ok) return [];
      return res.json();
    }
  });

  // Обновление настроек при загрузке
  useEffect(() => {
    if (settingsData) {
      setSettings({
        first_notification_delay: (settingsData.first_notification_delay || 60) * 1000,
        notification_interval: (settingsData.notification_interval || 60) * 1000,
        notification_order: settingsData.notification_order || 'random',
        max_notifications_per_session: settingsData.max_notifications_per_session || 10,
        city_search_radius: settingsData.city_search_radius || 30
      });
    }
  }, [settingsData]);

  // Обновление типов уведомлений
  useEffect(() => {
    if (typesData) {
      const enabledTypes = typesData.filter((t: any) => t.is_enabled);
      setNotificationTypes(enabledTypes);
    }
  }, [typesData]);

  // Функция для получения координат и города через НП по IP
  const getLocationByIP = async (): Promise<{ 
    lat: number | null; 
    lon: number | null; 
    city_np: string | null; 
    city_ip: string | null;
    country: string | null;
  }> => {
    try {
      // Используем новый endpoint который получает координаты и город НП
      const response = await fetch('/api/social-proof/location-by-ip');
      if (response.ok) {
        const data = await response.json();
        return {
          lat: data.lat || null,
          lon: data.lon || null,
          city_np: data.city_np || null, // Город из НП на украинском (приоритетный)
          city_ip: data.city_ip || null, // Город из ip-api.com (может быть на английском)
          country: null // Можно добавить в endpoint если нужно
        };
      }
    } catch (error) {
      console.error('Error getting location by IP:', error);
    }
    return { lat: null, lon: null, city_np: null, city_ip: null, country: null };
  };

  // Функция для получения случайного города в радиусе от координат
  const getRandomCityInRadius = async (lat: number, lon: number, radius: number): Promise<string | null> => {
    try {
      const response = await fetch(`/api/nova-poshta/cities-in-radius?lat=${lat}&lon=${lon}&radius=${radius}`);
      if (response.ok) {
        const data = await response.json();
        const cities = data.cities || [];
        if (cities.length > 0) {
          // Выбираем случайный город из списка
          const randomCity = cities[Math.floor(Math.random() * cities.length)];
          return randomCity.city_description_ua || null;
        }
      }
    } catch (error) {
      console.error('Error getting cities in radius:', error);
    }
    return null;
  };

  // Функция для сохранения лога уведомления
  const saveLog = async (notification: Notification, variables: Record<string, any>) => {
    try {
      const sessionId = getSessionId();
      const fingerprint = getFingerprint();
      
      const logData: any = {
        session_id: sessionId,
        visitor_fingerprint: fingerprint,
        notification_type: notification.type,
        product_id: notification.productId,
        product_code: notification.productCode,
        product_name: notification.productName,
        message_text: notification.messageText,
        variables_used: variables
      };

      // Для purchased_local добавляем персональные данные через IP -> координаты -> НП
      if (notification.type === 'purchased_local') {
        const location = await getLocationByIP();
        logData.client_latitude = location.lat;
        logData.client_longitude = location.lon;
        logData.client_city_from_ip = location.city_ip; // Город из ip-api.com (может быть на английском)
        logData.client_city_from_np = location.city_np; // Город из НП на украинском (приоритетный)
        logData.client_country_from_ip = location.country || null;
        
        logData.client_name = notification.name;
        logData.hours_ago = notification.hoursAgo;
      } else if (notification.type === 'purchased_today') {
        const location = await getLocationByIP();
        logData.client_city_from_ip = location.city_ip;
        logData.client_country_from_ip = location.country || null;
        logData.client_latitude = location.lat;
        logData.client_longitude = location.lon;
      }

      await fetch('/api/social-proof/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
    } catch (error) {
      console.error('Error saving social proof log:', error);
    }
  };

  // Функция для подстановки переменных в шаблон
  const formatTemplate = (template: string, variables: Record<string, any>): string => {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    });
    return result;
  };

  // Функция для форматирования часов назад
  const formatHoursAgo = (hours: number): string => {
    if (hours === 1) return '1 годину';
    if (hours < 5) return `${hours} години`;
    return `${hours} годин`;
  };

  // Загрузка количества уже отправленных уведомлений для текущей сессии
  useEffect(() => {
    const loadSessionCount = async () => {
      try {
        const sessionId = getSessionId();
        const response = await fetch(`/api/social-proof/session-count?session_id=${encodeURIComponent(sessionId)}`);
        if (response.ok) {
          const data = await response.json();
          // Устанавливаем начальное значение счетчика на основе данных из БД
          setNotificationsCount(data.count || 0);
        }
      } catch (error) {
        console.error('Error loading session notification count:', error);
      }
    };
    
    loadSessionCount();
  }, []);

  // Основной эффект для показа уведомлений
  useEffect(() => {
    if (products.length === 0 || notificationTypes.length === 0) return;

    // Инициализация порядка уведомлений
    if (settings.notification_order === 'sequential') {
      const typeIndices: number[] = [];
      for (let i = 0; i < notificationTypes.length; i++) {
        typeIndices.push(i);
      }
      notificationOrderRef.current = typeIndices.sort(() => Math.random() - 0.5);
      currentOrderIndexRef.current = 0;
    }

    const showNotification = async () => {
      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime;
      
      if (lastNotificationTime > 0 && timeSinceLastNotification < settings.notification_interval) {
        return;
      }

      // КРИТИЧНО: Проверяем лимит по данным из БД перед попыткой показать уведомление
      // Это гарантирует, что лимит будет работать даже после перезагрузки страницы
      const sessionId = getSessionId();
      let currentCount = notificationsCount;
      
      try {
        const countResponse = await fetch(`/api/social-proof/session-count?session_id=${encodeURIComponent(sessionId)}`);
        if (countResponse.ok) {
          const countData = await countResponse.json();
          currentCount = countData.count || 0;
          // Синхронизируем локальный счетчик с данными из БД
          if (currentCount !== notificationsCount) {
            setNotificationsCount(currentCount);
          }
        }
      } catch (error) {
        console.error('Error checking session notification count:', error);
        // В случае ошибки используем локальный счетчик как fallback
        currentCount = notificationsCount;
      }

      // Проверяем лимит ПЕРЕД попыткой создать уведомление
      if (currentCount >= settings.max_notifications_per_session) {
        return;
      }

      // Пытаемся найти уведомление с ненулевым значением (максимум 5 попыток)
      let notificationFound = false;
      let finalNotification: Notification | null = null;
      let finalVariables: Record<string, any> = {};
      
      for (let attempt = 0; attempt < 5 && !notificationFound; attempt++) {
        // Выбираем тип уведомления
        let selectedType;
        if (settings.notification_order === 'sequential') {
          const typeIndex = notificationOrderRef.current[currentOrderIndexRef.current % notificationOrderRef.current.length];
          selectedType = notificationTypes[typeIndex];
          currentOrderIndexRef.current++;
        } else {
          selectedType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        }

        if (!selectedType) continue;

        // Выбираем случайный товар
        const product = products[Math.floor(Math.random() * products.length)];
        if (!product) continue;

        let tempNotification: Notification | null = null;
        let tempVariables: Record<string, any> = {};

        if (selectedType.code === 'viewing') {
          const viewingCount = getViewingNowCount(product.id, product.purchaseCount || 0);
          
          // КРИТИЧНО: Если count = 0, пропускаем
          if (viewingCount === 0) {
            continue;
          }
          
          tempVariables = {
            count: viewingCount,
            product_name: product.name
          };
          tempNotification = {
            id: Date.now().toString(),
            type: 'viewing',
            productName: product.name,
            productId: product.id,
            productCode: product.code,
            count: viewingCount,
            messageText: formatTemplate(selectedType.template, tempVariables)
          };
        } else if (selectedType.code === 'purchased_today') {
          const todayPurchases = getTodayPurchases(product);
          
          // КРИТИЧНО: Если count = 0, пропускаем
          if (todayPurchases === 0) {
            continue;
          }
          
          tempVariables = {
            count: todayPurchases,
            product_name: product.name
          };
          tempNotification = {
            id: Date.now().toString(),
            type: 'purchased_today',
            productName: product.name,
            productId: product.id,
            productCode: product.code,
            count: todayPurchases,
            messageText: formatTemplate(selectedType.template, tempVariables)
          };
        } else if (selectedType.code === 'purchased_local') {
          // Тип 3: "Ольга (Київ) купила N годин назад" - всегда валидно
          // Получаем координаты по IP
          const location = await getLocationByIP();
          
          // Пытаемся получить случайный город в радиусе от наших координат
          let city: string | null = null;
          
          if (location.lat && location.lon) {
            // Используем радиус из настроек, по умолчанию 30 км
            const radius = settings.city_search_radius || 30;
            city = await getRandomCityInRadius(location.lat, location.lon, radius);
          }
          
          // Если не нашли город в радиусе, используем fallback
          if (!city) {
            // Используем город НП (на украинском) как приоритетный, если есть
            // Иначе используем город из ip-api.com (может быть на английском)
            // Иначе fallback на "Київ"
            city = location.city_np || location.city_ip || 'Київ';
          }

          const name = namesData.length > 0 
            ? namesData[Math.floor(Math.random() * namesData.length)].name
            : 'Ольга';
          
          const hoursAgo = Math.floor(Math.random() * 6) + 1;

          tempVariables = {
            name,
            city,
            hours_ago: formatHoursAgo(hoursAgo),
            product_name: product.name
          };

          tempNotification = {
            id: Date.now().toString(),
            type: 'purchased_local',
            productName: product.name,
            productId: product.id,
            productCode: product.code,
            city,
            name,
            hoursAgo,
            messageText: formatTemplate(selectedType.template, tempVariables)
          };
        }

        // Если нашли валидное уведомление
        if (tempNotification) {
          finalNotification = tempNotification;
          finalVariables = tempVariables;
          notificationFound = true;
          break;
        }
      }

      // Если не нашли валидное уведомление - пропускаем показ
      if (!finalNotification || !notificationFound) {
        return;
      }

      setNotification(finalNotification);
      setIsVisible(true);
      setLastNotificationTime(now);
      setNotificationsCount(count => count + 1);

      saveLog(finalNotification, finalVariables);

      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    const initialTimeout = setTimeout(() => {
      (async () => {
        try {
          await showNotification();
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      })();
    }, settings.first_notification_delay);

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime;
      
      if (timeSinceLastNotification >= settings.notification_interval) {
        (async () => {
          try {
            await showNotification();
          } catch (error) {
            console.error('Error showing notification:', error);
          }
        })();
      }
    }, settings.notification_interval);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [
    products, 
    notificationTypes, 
    settings, 
    lastNotificationTime, 
    notificationsCount,
    namesData,
    currentHour
  ]);

  if (!notification) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 z-40 max-w-xs transition-all duration-500',
        isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      )}
    >
      <div className="glass-card p-4 shadow-large animate-slide-in-bottom">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-3 h-3 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-3 pr-4">
          <div className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
            notification.type === 'purchased_today' || notification.type === 'purchased_local'
              ? 'bg-success/10' 
              : 'bg-primary/10'
          )}>
            {notification.type === 'viewing' ? (
              <Eye className="w-5 h-5 text-primary" />
            ) : notification.type === 'purchased_today' ? (
              <Users className="w-5 h-5 text-success" />
            ) : (
              <ShoppingBag className="w-5 h-5 text-success" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">{notification.messageText}</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Щойно</p>
          </div>
        </div>
      </div>
    </div>
  );
};
