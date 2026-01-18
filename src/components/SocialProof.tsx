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
  const [clientLocation, setClientLocation] = useState<{ lat: number; lon: number; city?: string } | null>(null);
  const [notificationTypes, setNotificationTypes] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    first_notification_delay: 60000,
    notification_interval: 60000,
    notification_order: 'random',
    max_notifications_per_session: 10
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
      if (!res.ok) return null;
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
        max_notifications_per_session: settingsData.max_notifications_per_session || 10
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

  // Получение координат клиента (геолокация)
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        // Пытаемся получить через браузерную геолокацию (с разрешения)
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setClientLocation({
                lat: position.coords.latitude,
                lon: position.coords.longitude,
              });
            },
            () => {
              // Если пользователь не разрешил - координаты останутся null
            },
            { timeout: 5000, maximumAge: 3600000 } // Кеш на 1 час
          );
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };
    
    fetchLocation();
  }, []);

  // Функция для получения ближайшего города через API Новой Почты
  const getNearestCity = async (lat: number, lon: number): Promise<string | null> => {
    try {
      const response = await fetch(`/api/nova-poshta/nearest-warehouse?lat=${lat}&lon=${lon}&radius=20000`);
      if (response.ok) {
        const data = await response.json();
        return data.city || null;
      }
    } catch (error) {
      console.error('Error getting nearest city:', error);
    }
    return null;
  };

  // Функция для получения города из IP (из аналитики)
  const getCityFromIP = async (): Promise<{ city: string | null; country: string | null }> => {
    try {
      // Получаем текущую сессию из аналитики
      const sessionId = getSessionId();
      const response = await fetch(`/api/analytics/realtime`);
      if (response.ok) {
        const sessions = await response.json();
        const currentSession = sessions.find((s: any) => s.session_id === sessionId);
        if (currentSession) {
          return {
            city: currentSession.city || null,
            country: currentSession.country || null
          };
        }
      }
    } catch (error) {
      console.error('Error getting city from IP:', error);
    }
    return { city: null, country: null };
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

      // Для purchased_local добавляем персональные данные
      if (notification.type === 'purchased_local') {
        const ipLocation = await getCityFromIP();
        logData.client_city_from_ip = ipLocation.city;
        logData.client_country_from_ip = ipLocation.country;
        
        if (clientLocation) {
          logData.client_latitude = clientLocation.lat;
          logData.client_longitude = clientLocation.lon;
          
          // Получаем город из НП по координатам
          const npCity = await getNearestCity(clientLocation.lat, clientLocation.lon);
          if (npCity) {
            logData.client_city_from_np = npCity;
          }
        }
        
        logData.client_name = notification.name;
        logData.hours_ago = notification.hoursAgo;
      } else if (notification.type === 'purchased_today') {
        const ipLocation = await getCityFromIP();
        logData.client_city_from_ip = ipLocation.city;
        logData.client_country_from_ip = ipLocation.country;
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

  // Основной эффект для показа уведомлений
  useEffect(() => {
    if (products.length === 0 || notificationTypes.length === 0) return;

    // Инициализация порядка уведомлений
    if (settings.notification_order === 'sequential') {
      // Создаем последовательность индексов типов
      const typeIndices: number[] = [];
      for (let i = 0; i < notificationTypes.length; i++) {
        typeIndices.push(i);
      }
      // Перемешиваем случайно в начале сессии, но потом используем последовательно
      notificationOrderRef.current = typeIndices.sort(() => Math.random() - 0.5);
      currentOrderIndexRef.current = 0;
    }

    const showNotification = async () => {
      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime;
      
      // Проверяем минимальный интервал (в миллисекундах)
      if (lastNotificationTime > 0 && timeSinceLastNotification < settings.notification_interval) {
        return; // Пропускаем, если прошло менее интервала
      }

      // Проверяем максимальное количество уведомлений за сессию
      if (notificationsCount >= settings.max_notifications_per_session) {
        return; // Достигнут лимит
      }

      // Выбираем тип уведомления
      let selectedType;
      if (settings.notification_order === 'sequential') {
        const typeIndex = notificationOrderRef.current[currentOrderIndexRef.current % notificationOrderRef.current.length];
        selectedType = notificationTypes[typeIndex];
        currentOrderIndexRef.current++;
      } else {
        // Случайный выбор из включенных типов
        selectedType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
      }

      if (!selectedType) return;

      // Выбираем случайный товар
      const product = products[Math.floor(Math.random() * products.length)];
      if (!product) return;

      let newNotification: Notification;
      let variables: Record<string, any> = {};

      if (selectedType.code === 'viewing') {
        // Тип 1: "Х людей переглядають"
        const viewingCount = getViewingNowCount(product.id, product.purchaseCount || 0);
        variables = {
          count: viewingCount,
          product_name: product.name
        };
        newNotification = {
          id: Date.now().toString(),
          type: 'viewing',
          productName: product.name,
          productId: product.id,
          productCode: product.code,
          count: viewingCount,
          messageText: formatTemplate(selectedType.template, variables)
        };
      } else if (selectedType.code === 'purchased_today') {
        // Тип 2: "Х людей купили сьогодні"
        const todayPurchases = getTodayPurchases(product.code || '');
        variables = {
          count: todayPurchases,
          product_name: product.name
        };
        newNotification = {
          id: Date.now().toString(),
          type: 'purchased_today',
          productName: product.name,
          productId: product.id,
          productCode: product.code,
          count: todayPurchases,
          messageText: formatTemplate(selectedType.template, variables)
        };
      } else {
        // Тип 3: "Ольга (Київ) купила N годин назад"
        let city = 'Київ'; // Fallback
        
        // Пытаемся получить город из геолокации
        if (clientLocation?.lat && clientLocation?.lon) {
          const nearestCity = await getNearestCity(clientLocation.lat, clientLocation.lon);
          if (nearestCity) {
            city = nearestCity;
          }
        } else {
          // Пытаемся получить город из IP
          const ipLocation = await getCityFromIP();
          if (ipLocation.city) {
            city = ipLocation.city;
          }
        }

        // Выбираем случайное имя из списка
        const name = namesData.length > 0 
          ? namesData[Math.floor(Math.random() * namesData.length)].name
          : 'Ольга';
        
        const hoursAgo = Math.floor(Math.random() * 6) + 1; // 1-6 часов назад

        variables = {
          name,
          city,
          hours_ago: formatHoursAgo(hoursAgo),
          product_name: product.name
        };

        newNotification = {
          id: Date.now().toString(),
          type: 'purchased_local',
          productName: product.name,
          productId: product.id,
          productCode: product.code,
          city,
          name,
          hoursAgo,
          messageText: formatTemplate(selectedType.template, variables)
        };
      }

      setNotification(newNotification);
      setIsVisible(true);
      setLastNotificationTime(now);
      setNotificationsCount(count => count + 1);

      // Сохраняем лог
      saveLog(newNotification, variables);

      // Скрываем через 5 секунд
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Первое уведомление через указанную задержку
    const initialTimeout = setTimeout(() => {
      (async () => {
        try {
          await showNotification();
        } catch (error) {
          console.error('Error showing notification:', error);
        }
      })();
    }, settings.first_notification_delay);

    // Последующие уведомления каждые N секунд
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastNotification = now - lastNotificationTime;
      
      // Если прошло достаточно времени - показываем
      if (timeSinceLastNotification >= settings.notification_interval) {
        // Используем async IIFE для обработки async функции
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
    clientLocation,
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
