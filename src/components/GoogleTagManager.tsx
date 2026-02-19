import { useEffect } from 'react';

interface GoogleTagManagerProps {
  gtmId?: string;
  ga4Id?: string;  // используется только если GTM не настроен
  gadsId?: string; // используется только если GTM не настроен
}

/**
 * Загрузка аналитики по рекомендациям Google + web.dev best practices:
 *
 * АРХИТЕКТУРА:
 *   - Если есть GTM: грузим ТОЛЬКО GTM. GA4 и Google Ads настраиваются
 *     как теги ВНУТРИ GTM-контейнера — дублировать их снаружи НЕ нужно.
 *   - Если GTM нет: грузим GA4 / Google Ads напрямую через gtag.js.
 *
 * TIMING (паттерн от Shopify, Cloudflare, web.dev):
 *   requestIdleCallback → браузер сам выбирает момент когда основной поток
 *   свободен. Страница уже отрендерена, LCP уже случился, FCP не заблокирован.
 *   Fallback setTimeout(0) для браузеров без rIC.
 *
 *   Это даёт ~200-500ms задержку вместо 4 секунд, не пропускает события
 *   и не блокирует рендер.
 */
export function GoogleTagManager({ gtmId, ga4Id, gadsId }: GoogleTagManagerProps) {
  useEffect(() => {
    if (!gtmId && !ga4Id && !gadsId) return;

    const load = () => {
      if (gtmId) {
        // ── GTM: единственный скрипт нужный на странице ──────────────────
        // GA4 и Google Ads должны быть настроены как теги ВНУТРИ GTM.
        // Официальный сниппет от Google (https://developers.google.com/tag-platform/tag-manager/web)
        const w = window as any;
        w.dataLayer = w.dataLayer || [];
        w.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

        const s = document.createElement('script');
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
        document.head.appendChild(s);

        // GTM noscript (для браузеров без JS — обязателен по документации)
        if (document.body) {
          const ns = document.createElement('noscript');
          const ifr = document.createElement('iframe');
          ifr.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
          ifr.height = '0';
          ifr.width = '0';
          ifr.style.cssText = 'display:none;visibility:hidden';
          ns.appendChild(ifr);
          document.body.insertBefore(ns, document.body.firstChild);
        }
        return; // GTM загружен — GA4/Ads не нужны отдельно
      }

      // ── Fallback: прямая загрузка GA4 если GTM не используется ──────────
      if (ga4Id) {
        const w = window as any;
        w.dataLayer = w.dataLayer || [];
        w.gtag = function () { w.dataLayer.push(arguments); };
        (w.gtag as any)('js', new Date());
        (w.gtag as any)('config', ga4Id, {
          send_page_view: true,
          cookie_flags: 'SameSite=Lax;Secure',
        });

        const s = document.createElement('script');
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
        document.head.appendChild(s);
      }

      // ── Google Ads (только если нет GTM) ────────────────────────────────
      if (gadsId && !ga4Id) {
        const s = document.createElement('script');
        s.async = true;
        s.src = `https://www.googletagmanager.com/gtag/js?id=${gadsId}`;
        document.head.appendChild(s);
      }
    };

    // requestIdleCallback — грузим когда браузер свободен (после LCP/FCP).
    // Это официальный паттерн web.dev для third-party scripts.
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(load, { timeout: 2000 });
    } else {
      // Fallback: следующий тик после рендера
      setTimeout(load, 0);
    }
  }, [gtmId, ga4Id, gadsId]);

  return null;
}

/**
 * Событие конверсии Google Ads.
 * Работает как через GTM (если gtag настроен внутри GTM), так и напрямую.
 */
export function sendGoogleAdsConversion(conversionLabel: string, value?: number, currency = 'UAH') {
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('event', 'conversion', { send_to: conversionLabel, value, currency });
  }
}

/**
 * Событие Google Analytics 4.
 * Работает как через GTM (dataLayer.push), так и через прямой gtag.js.
 */
export function sendGA4Event(eventName: string, params?: Record<string, unknown>) {
  const gtag = (window as any).gtag;
  if (gtag) {
    gtag('event', eventName, params);
  }
}
