/**
 * Библиотека для отслеживания аналитики на фронтенде
 */

// Используем встроенный crypto.randomUUID() вместо uuid пакета

// Типы событий
export type AnalyticsEventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'update_cart'
  | 'checkout_start'
  | 'checkout_fill_name'
  | 'checkout_fill_phone'
  | 'checkout_select_delivery'
  | 'checkout_fill_delivery'
  | 'checkout_select_payment'
  | 'checkout_submit'
  | 'order_completed'
  | 'order_paid'
  | 'button_click'
  | 'form_submit'
  | 'link_click'
  | 'scroll'
  | 'error';

export interface AnalyticsEvent {
  eventType: AnalyticsEventType;
  eventCategory?: string;
  eventLabel?: string;
  eventData?: Record<string, any>;
  productId?: number;
  orderId?: string;
  eventValue?: number;
}

export interface FunnelStage {
  stage:
    | 'visited_site'
    | 'viewed_product'
    | 'added_to_cart'
    | 'started_checkout'
    | 'filled_name'
    | 'filled_phone'
    | 'selected_delivery'
    | 'filled_delivery'
    | 'selected_payment'
    | 'clicked_submit'
    | 'completed_order'
    | 'paid_order';
  cartProducts?: any[];
  cartTotal?: number;
  orderId?: string;
}

class Analytics {
  private sessionId: string;
  private fingerprint: string;
  private currentPageViewId: number | null = null;
  private pageStartTime: number = Date.now();
  private scrollDepth: number = 0;
  private clicksCount: number = 0;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.fingerprint = this.generateFingerprint();
  }

  /**
   * Инициализация аналитики
   */
  async init() {
    if (this.isInitialized) return;

    try {
      // Получаем UTM метки из URL
      const urlParams = new URLSearchParams(window.location.search);
      const utmData = {
        utmSource: urlParams.get('utm_source') || undefined,
        utmMedium: urlParams.get('utm_medium') || undefined,
        utmCampaign: urlParams.get('utm_campaign') || undefined,
        utmTerm: urlParams.get('utm_term') || undefined,
        utmContent: urlParams.get('utm_content') || undefined,
      };

      // Сохраняем UTM метки в sessionStorage
      if (utmData.utmSource) {
        sessionStorage.setItem('utm_data', JSON.stringify(utmData));
      }

      // Получаем сохраненные UTM метки
      const savedUtmData = sessionStorage.getItem('utm_data');
      const finalUtmData = savedUtmData ? JSON.parse(savedUtmData) : utmData;

      // Создаем/обновляем сессию
      await this.createOrUpdateSession({
        ...finalUtmData,
        referrer: document.referrer || undefined,
        landingPage: window.location.href,
        deviceType: this.getDeviceType(),
        browser: this.getBrowser(),
        os: this.getOS(),
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
      });

      // Отслеживаем первый визит
      await this.trackFunnel({ stage: 'visited_site' });

      // Отслеживаем просмотр страницы
      await this.trackPageView();

      // Устанавливаем обработчики событий
      this.setupEventListeners();

      // Запускаем heartbeat (обновление активности каждые 30 секунд)
      this.startHeartbeat();

      this.isInitialized = true;
    } catch (error) {
      console.error('Analytics init error:', error);
    }
  }

  /**
   * Создать или обновить сессию
   */
  private async createOrUpdateSession(data: any) {
    try {
      const userId = this.getUserId();
      const cartItemsCount = this.getCartItemsCount();

      await fetch('/api/analytics/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          fingerprint: this.fingerprint,
          userId,
          cartItemsCount,
          ...data,
        }),
      });
    } catch (error) {
      console.error('Error creating/updating session:', error);
    }
  }

  /**
   * Отслеживание просмотра страницы
   */
  async trackPageView() {
    try {
      // Завершаем предыдущий просмотр страницы
      if (this.currentPageViewId) {
        await this.endPageView();
      }

      // Определяем тип страницы и product_id если это страница товара
      const pageType = this.getPageType();
      const productId = this.getProductIdFromUrl();

      const response = await fetch('/api/analytics/page-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          pageUrl: window.location.pathname,
          pageTitle: document.title,
          pageType,
          productId,
        }),
      });

      const data = await response.json();
      this.currentPageViewId = data.id;
      this.pageStartTime = Date.now();
      this.scrollDepth = 0;
      this.clicksCount = 0;

      // Отправляем событие в Google Analytics если подключен
      this.sendToGA4('page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: window.location.pathname,
      });
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  /**
   * Завершить просмотр страницы
   */
  private async endPageView() {
    if (!this.currentPageViewId) return;

    try {
      const timeSpent = Math.floor((Date.now() - this.pageStartTime) / 1000);

      await fetch(`/api/analytics/page-view/${this.currentPageViewId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeSpent,
          scrollDepth: this.scrollDepth,
          clicksCount: this.clicksCount,
        }),
      });
    } catch (error) {
      console.error('Error ending page view:', error);
    }
  }

  /**
   * Отслеживание события
   */
  async trackEvent(event: AnalyticsEvent) {
    try {
      const userId = this.getUserId();

      await fetch('/api/analytics/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId,
          ...event,
        }),
      });

      // Отправляем событие в Google Analytics если подключен
      this.sendToGA4(event.eventType, {
        event_category: event.eventCategory,
        event_label: event.eventLabel,
        value: event.eventValue,
        ...event.eventData,
      });
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Отслеживание воронки продаж
   */
  async trackFunnel(data: FunnelStage) {
    try {
      const userId = this.getUserId();

      await fetch('/api/analytics/funnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId,
          ...data,
        }),
      });
    } catch (error) {
      console.error('Error tracking funnel:', error);
    }
  }

  /**
   * Получить или создать session ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Генерация fingerprint браузера
   */
  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fingerprint', 2, 2);
    }

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width,
      screen.height,
      new Date().getTimezoneOffset(),
      !!window.sessionStorage,
      !!window.localStorage,
      canvas.toDataURL(),
    ].join('|');

    // Простое хеширование
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }

    return Math.abs(hash).toString(36);
  }

  /**
   * Определить тип устройства
   */
  private getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return 'tablet';
    }
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Определить браузер
   */
  private getBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    if (ua.includes('Opera')) return 'Opera';
    return 'Unknown';
  }

  /**
   * Определить ОС
   */
  private getOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  /**
   * Определить тип страницы
   */
  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/') return 'home';
    if (path.startsWith('/product/')) return 'product';
    if (path.startsWith('/category/')) return 'category';
    if (path === '/checkout') return 'checkout';
    if (path === '/cart') return 'cart';
    if (path === '/thank-you') return 'thank_you';
    if (path.startsWith('/user/')) return 'user';
    if (path.startsWith('/admin/')) return 'admin';
    return 'other';
  }

  /**
   * Получить product_id из URL (если страница товара)
   */
  private getProductIdFromUrl(): number | undefined {
    const match = window.location.pathname.match(/\/product\/(\d+)/);
    return match ? parseInt(match[1]) : undefined;
  }

  /**
   * Получить ID пользователя из localStorage
   */
  private getUserId(): number | undefined {
    try {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        return userData.id;
      }
    } catch (error) {
      // ignore
    }
    return undefined;
  }

  /**
   * Получить количество товаров в корзине
   */
  private getCartItemsCount(): number {
    try {
      const cart = localStorage.getItem('cart');
      if (cart) {
        const cartData = JSON.parse(cart);
        return cartData.length || 0;
      }
    } catch (error) {
      // ignore
    }
    return 0;
  }

  /**
   * Установить обработчики событий
   */
  private setupEventListeners() {
    // Отслеживание скролла
    let scrollTimeout: NodeJS.Timeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentDepth = Math.round((scrollTop / scrollHeight) * 100);
        
        if (currentDepth > this.scrollDepth) {
          this.scrollDepth = currentDepth;
        }
      }, 100);
    });

    // Отслеживание кликов
    document.addEventListener('click', () => {
      this.clicksCount++;
    });

    // Отслеживание ухода со страницы
    window.addEventListener('beforeunload', () => {
      this.endPageView();
      this.markOffline();
    });

    // Отслеживание неактивности
    let inactiveTimeout: NodeJS.Timeout;
    const resetInactiveTimer = () => {
      clearTimeout(inactiveTimeout);
      inactiveTimeout = setTimeout(() => {
        this.markOffline();
      }, 5 * 60 * 1000); // 5 минут неактивности
    };

    document.addEventListener('mousemove', resetInactiveTimer);
    document.addEventListener('keydown', resetInactiveTimer);
    document.addEventListener('scroll', resetInactiveTimer);
    document.addEventListener('click', resetInactiveTimer);

    resetInactiveTimer();
  }

  /**
   * Запустить heartbeat (обновление активности)
   */
  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.createOrUpdateSession({
        cartItemsCount: this.getCartItemsCount(),
      });
    }, 30000); // каждые 30 секунд
  }

  /**
   * Пометить сессию как офлайн
   */
  private async markOffline() {
    try {
      await fetch(`/api/analytics/session/${this.sessionId}/offline`, {
        method: 'POST',
      });
    } catch (error) {
      // ignore
    }

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  /**
   * Отправить событие в Google Analytics 4
   */
  private sendToGA4(eventName: string, params?: Record<string, any>) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, params);
    }
  }

  /**
   * Уничтожить инстанс аналитики
   */
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.endPageView();
    this.markOffline();
  }
}

// Создаем singleton инстанс
export const analytics = new Analytics();

// Хелперы для удобного использования
export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event);
export const trackFunnel = (stage: FunnelStage) => analytics.trackFunnel(stage);
export const trackPageView = () => analytics.trackPageView();

