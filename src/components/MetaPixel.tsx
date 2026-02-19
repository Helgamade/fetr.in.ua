import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface MetaPixelProps {
  pixelId?: string;
}

/**
 * Meta Pixel (Facebook/Instagram) — ремаркетинг и конверсии
 * Стандартные события: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
 */
export function MetaPixel({ pixelId }: MetaPixelProps) {
  const location = useLocation();

  useEffect(() => {
    if (!pixelId) return;
    if (location.pathname.startsWith('/admin')) return;

    // Инициализация пикселя если ещё не загружен
    if (!window.fbq) {
      const n: any = function (...args: any[]) {
        n.callMethod ? n.callMethod(...args) : n.queue.push(args);
      };
      if (!window._fbq) window._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      window.fbq = n;

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://connect.facebook.net/en_US/fbevents.js';
      document.head.appendChild(script);

      // noscript fallback
      const noscript = document.createElement('noscript');
      const img = document.createElement('img');
      img.height = 1;
      img.width = 1;
      img.style.display = 'none';
      img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
      noscript.appendChild(img);
      document.body.insertBefore(noscript, document.body.firstChild);
    }

    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }, [pixelId]);

  // Отслеживаем переходы между страницами
  useEffect(() => {
    if (!pixelId || !window.fbq) return;
    if (location.pathname.startsWith('/admin')) return;
    window.fbq('track', 'PageView');
  }, [location.pathname, pixelId]);

  return null;
}

/**
 * Событие просмотра товара — вызывать при открытии карточки/модала товара
 */
export function trackViewContent(product: { id: number | string; name: string; price: number }) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [String(product.id)],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'UAH',
    });
  }
}

/**
 * Событие добавления в корзину
 */
export function trackAddToCart(product: { id: number | string; name: string; price: number }, quantity = 1) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'AddToCart', {
      content_ids: [String(product.id)],
      content_name: product.name,
      content_type: 'product',
      value: product.price * quantity,
      currency: 'UAH',
      num_items: quantity,
    });
  }
}

/**
 * Событие начала оформления заказа
 */
export function trackInitiateCheckout(value: number, numItems: number) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value,
      currency: 'UAH',
      num_items: numItems,
    });
  }
}

/**
 * Событие покупки (вызывать на /thank-you после успешного заказа)
 */
export function trackPurchase(orderId: string | number, value: number, numItems: number) {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Purchase', {
      content_ids: [String(orderId)],
      content_type: 'product',
      value,
      currency: 'UAH',
      num_items: numItems,
    });
  }
}
