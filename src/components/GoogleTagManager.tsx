import { useEffect } from 'react';

interface GoogleTagManagerProps {
  gtmId?: string;
  ga4Id?: string;
  gadsId?: string;
}

/**
 * Компонент для интеграции Google Tag Manager, Google Analytics 4 и Google Ads
 */
export function GoogleTagManager({ gtmId, ga4Id, gadsId }: GoogleTagManagerProps) {
  useEffect(() => {
    // Загружаем Google Tag Manager
    if (gtmId) {
      // GTM script
      const gtmScript = document.createElement('script');
      gtmScript.innerHTML = `
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${gtmId}');
      `;
      document.head.appendChild(gtmScript);

      // GTM noscript
      const gtmNoscript = document.createElement('noscript');
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.googletagmanager.com/ns.html?id=${gtmId}`;
      iframe.height = '0';
      iframe.width = '0';
      iframe.style.display = 'none';
      iframe.style.visibility = 'hidden';
      gtmNoscript.appendChild(iframe);
      document.body.insertBefore(gtmNoscript, document.body.firstChild);
    }

    // Загружаем Google Analytics 4
    if (ga4Id) {
      // GA4 script
      const ga4Script = document.createElement('script');
      ga4Script.src = `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`;
      ga4Script.async = true;
      document.head.appendChild(ga4Script);

      // GA4 config
      const ga4Config = document.createElement('script');
      ga4Config.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${ga4Id}', {
          page_path: window.location.pathname,
          send_page_view: false
        });
      `;
      document.head.appendChild(ga4Config);

      // Делаем gtag доступным глобально
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };
    }

    // Загружаем Google Ads
    if (gadsId) {
      // Google Ads conversion tracking
      const gadsScript = document.createElement('script');
      gadsScript.src = `https://www.googletagmanager.com/gtag/js?id=${gadsId}`;
      gadsScript.async = true;
      document.head.appendChild(gadsScript);

      const gadsConfig = document.createElement('script');
      gadsConfig.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${gadsId}');
      `;
      document.head.appendChild(gadsConfig);
    }
  }, [gtmId, ga4Id, gadsId]);

  return null;
}

/**
 * Функция для отправки события конверсии Google Ads
 */
export function sendGoogleAdsConversion(conversionLabel: string, value?: number, currency: string = 'UAH') {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'conversion', {
      send_to: conversionLabel,
      value: value,
      currency: currency,
    });
  }
}

/**
 * Функция для отправки события в Google Analytics 4
 */
export function sendGA4Event(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
}

