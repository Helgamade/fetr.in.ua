import React, { useEffect, useState } from 'react';
import { products } from '@/data/products';
import { Eye, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ukrainianCities = [
  'Київ', 'Харків', 'Одеса', 'Дніпро', 'Львів', 'Запоріжжя', 'Вінниця',
  'Полтава', 'Черкаси', 'Чернігів', 'Житомир', 'Суми', 'Рівне', 'Луцьк',
  'Тернопіль', 'Івано-Франківськ', 'Ужгород', 'Хмельницький', 'Кропивницький',
];

interface Notification {
  id: string;
  type: 'viewing' | 'purchased';
  productName: string;
  city?: string;
  count?: number;
}

export const SocialProof: React.FC = () => {
  const [notification, setNotification] = useState<Notification | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const showNotification = () => {
      const type = Math.random() > 0.5 ? 'purchased' : 'viewing';
      const product = products[Math.floor(Math.random() * products.length)];
      const city = ukrainianCities[Math.floor(Math.random() * ukrainianCities.length)];
      const count = Math.floor(Math.random() * 8) + 2;

      const newNotification: Notification = {
        id: Date.now().toString(),
        type,
        productName: product.name,
        city: type === 'purchased' ? city : undefined,
        count: type === 'viewing' ? count : undefined,
      };

      setNotification(newNotification);
      setIsVisible(true);

      // Hide after 5 seconds
      setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    };

    // Show first notification after 10 seconds
    const initialTimeout = setTimeout(showNotification, 10000);

    // Then show every 30-60 seconds
    const interval = setInterval(() => {
      const delay = Math.random() * 30000 + 30000; // 30-60 seconds
      setTimeout(showNotification, delay);
    }, 60000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

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
            notification.type === 'purchased' ? 'bg-success/10' : 'bg-primary/10'
          )}>
            {notification.type === 'purchased' ? (
              <ShoppingBag className="w-5 h-5 text-success" />
            ) : (
              <Eye className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            {notification.type === 'purchased' ? (
              <>
                <p className="text-sm font-medium">Щойно замовили</p>
                <p className="text-sm text-muted-foreground">
                  {notification.productName} у м. {notification.city}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">{notification.count} людей переглядають</p>
                <p className="text-sm text-muted-foreground">{notification.productName}</p>
              </>
            )}
            <p className="text-xs text-muted-foreground/60 mt-1">Щойно</p>
          </div>
        </div>
      </div>
    </div>
  );
};
