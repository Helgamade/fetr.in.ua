// API client for backend
import { Product, Order, ProductOption } from '@/types/store';

// Always use /api (proxied to Node.js backend)
// Hardcoded to /api to avoid any environment variable issues
const API_BASE_URL = '/api';

// Получение токена из localStorage
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken');
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include', // Для поддержки cookies
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

// Products API
export const productsAPI = {
  getAll: () => fetchAPI<Product[]>('/products'),
  getById: (id: string) => fetchAPI<Product>(`/products/${id}`),
  create: (data: any) => fetchAPI<any>('/products', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI<any>(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<any>(`/products/${id}`, {
    method: 'DELETE',
  }),
};

// Options API
export const optionsAPI = {
  getAll: () => fetchAPI<ProductOption[]>('/options'),
  getById: (id: number) => fetchAPI<ProductOption>(`/options/${id}`),
  create: (data: { name: string; price: number; description?: string }) => fetchAPI<ProductOption>('/options', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: { name: string; price: number; description?: string }) => fetchAPI<any>(`/options/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/options/${id}`, {
    method: 'DELETE',
  }),
};

// Orders API
export const ordersAPI = {
  getAll: () => fetchAPI<Order[]>('/orders'),
  getById: (id: string) => fetchAPI<Order>(`/orders/${id}`),
  getOrder: (id: string) => fetchAPI<Order>(`/orders/${id}`),
  getByTrackingToken: (token: string) => fetchAPI<Order>(`/orders/track/${token}`), // Alias for getById
  getHistory: (id: string) => fetchAPI<Array<{ date: Date; text: string; user: string | null; completed: boolean }>>(`/orders/${id}/history`),
  create: (data: any) => fetchAPI<any>('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI<any>(`/orders/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  updateStatus: (id: string, status: string) => fetchAPI<any>(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
};

// Settings API
export const settingsAPI = {
  getAll: () => fetchAPI<Record<string, any>>('/settings'),
  getPublic: () => fetchAPI<Record<string, any>>('/settings/public'),
  getByKey: (key: string) => fetchAPI<{ key: string; value: any }>(`/settings/${key}`),
  update: (key: string, value: any) => fetchAPI<any>(`/settings/${key}`, {
    method: 'PUT',
    body: JSON.stringify({ value }),
  }),
  updateMultiple: (settings: Record<string, any>) => fetchAPI<any>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
  uploadHeroBackground: async (file: File): Promise<{ url: string; message: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/settings/upload-hero-background`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};

// Users API
export const usersAPI = {
  getAll: () => fetchAPI<any[]>('/users'),
  getById: (id: number) => fetchAPI<any>(`/users/${id}`),
  create: (data: any) => fetchAPI<any>('/users', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchAPI<any>(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/users/${id}`, {
    method: 'DELETE',
  }),
};

// Pages API
export const pagesAPI = {
  getAll: () => fetchAPI<any[]>('/pages'),
  getBySlug: (slug: string) => fetchAPI<any>(`/pages/${slug}`),
  create: (data: any) => fetchAPI<any>('/pages', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchAPI<any>(`/pages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/pages/${id}`, {
    method: 'DELETE',
  }),
};

// FAQs API
export const faqsAPI = {
  getAll: (publishedOnly: boolean = true) => fetchAPI<any[]>(`/faqs${publishedOnly ? '?published=true' : ''}`),
  getById: (id: number) => fetchAPI<any>(`/faqs/${id}`),
  create: (data: any) => fetchAPI<any>('/faqs', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchAPI<any>(`/faqs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/faqs/${id}`, {
    method: 'DELETE',
  }),
};

// Reviews API
export const reviewsAPI = {
  getAll: () => fetchAPI<any[]>('/reviews'),
  getById: (id: number) => fetchAPI<any>(`/reviews/${id}`),
  create: (data: any) => fetchAPI<any>('/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchAPI<any>(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/reviews/${id}`, {
    method: 'DELETE',
  }),
};

// Team API
export const teamAPI = {
  getAll: () => fetchAPI<any[]>('/team'),
  getById: (id: number) => fetchAPI<any>(`/team/${id}`),
  create: (data: any) => fetchAPI<any>('/team', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchAPI<any>(`/team/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/team/${id}`, {
    method: 'DELETE',
  }),
};

// Instagram API
export const instagramAPI = {
  getAll: () => fetchAPI<any[]>('/instagram'),
  getById: (id: number) => fetchAPI<any>(`/instagram/${id}`),
  create: (data: { image_url: string; instagram_url: string; likes_count?: number; comments_count?: number; sort_order?: number; is_active?: boolean }) => fetchAPI<any>('/instagram', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: { image_url?: string; instagram_url?: string; likes_count?: number; comments_count?: number; sort_order?: number; is_active?: boolean }) => fetchAPI<any>(`/instagram/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/instagram/${id}`, {
    method: 'DELETE',
  }),
};

// Gallery API (legacy - for backward compatibility)
export const galleryAPI = {
  getAll: () => fetchAPI<any[]>('/gallery'),
  getById: (id: number) => fetchAPI<any>(`/gallery/${id}`),
  create: (data: any) => fetchAPI<any>('/gallery', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: any) => fetchAPI<any>(`/gallery/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/gallery/${id}`, {
    method: 'DELETE',
  }),
};

// Galleries API (new structure)
export interface Gallery {
  id: number;
  name: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  imagesCount?: number;
  images?: GalleryImage[];
}

export interface GalleryImage {
  id: number;
  gallery_id: number;
  url: string;
  title: string | null;
  description: string | null;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export const galleriesAPI = {
  getAll: (publishedOnly: boolean = false) => fetchAPI<Gallery[]>(`/galleries?published=${publishedOnly}`),
  getById: (id: number, publishedOnly: boolean = false) => fetchAPI<Gallery>(`/galleries/${id}?published=${publishedOnly}`),
  create: (data: { name: string; sort_order?: number; is_published?: boolean }) => fetchAPI<{ id: number; message: string }>('/galleries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: number, data: { name: string; sort_order?: number; is_published?: boolean }) => fetchAPI<any>(`/galleries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: number) => fetchAPI<any>(`/galleries/${id}`, {
    method: 'DELETE',
  }),
  uploadImage: async (galleryId: number, file: File, title?: string, description?: string, sortOrder?: number): Promise<{ id: number; url: string; message: string }> => {
    const formData = new FormData();
    formData.append('image', file);
    if (title) formData.append('title', title);
    if (description) formData.append('description', description);
    if (sortOrder !== undefined) formData.append('sort_order', sortOrder.toString());

    const response = await fetch(`${API_BASE_URL}/galleries/${galleryId}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
  updateImage: (galleryId: number, imageId: number, data: { title?: string; description?: string; sort_order?: number; is_published?: boolean }) => fetchAPI<any>(`/galleries/${galleryId}/images/${imageId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  deleteImage: (galleryId: number, imageId: number) => fetchAPI<any>(`/galleries/${galleryId}/images/${imageId}`, {
    method: 'DELETE',
  }),
};

// Comparison API
export interface ComparisonFeature {
  id: number;
  key: string;
  label: string;
  type: 'text' | 'boolean';
  sortOrder: number;
  values: Record<string, string | boolean | null>;
}

export interface ComparisonData {
  features: ComparisonFeature[];
  products: Array<{ id: number; code: string; name: string }>;
}

export const comparisonAPI = {
  getAll: () => fetchAPI<ComparisonData>('/comparison'),
  updateValue: (featureKey: string, productId: number, value: string | boolean | null) =>
    fetchAPI<void>('/comparison/value', {
      method: 'PUT',
      body: JSON.stringify({ featureKey, productId, value }),
    }),
  createFeature: (data: { key: string; label: string; type: 'text' | 'boolean'; sortOrder?: number }) =>
    fetchAPI<{ id: number; key: string; label: string; type: 'text' | 'boolean'; sortOrder: number }>('/comparison/feature', {
      method: 'POST',
      body: JSON.stringify({ key: data.key, label: data.label, type: data.type, sortOrder: data.sortOrder }),
    }),
  updateFeature: (data: { key: string; label: string; type: 'text' | 'boolean'; sortOrder?: number }) =>
    fetchAPI<void>(`/comparison/feature/${data.key}`, {
      method: 'PUT',
      body: JSON.stringify({ label: data.label, type: data.type, sortOrder: data.sortOrder }),
    }),
  deleteFeature: (key: string) =>
    fetchAPI<void>(`/comparison/feature/${key}`, { method: 'DELETE' }),
};

// Nova Poshta API
export interface NovaPoshtaCity {
  ref: string;
  description_ua: string;
  description_ru?: string;
  area_description_ua?: string;
  area_description_ru?: string;
  settlement_type_description_ua?: string;
  full_description_ua: string;
}

export interface NovaPoshtaWarehouse {
  ref: string;
  site_key?: number;
  description_ua: string;
  description_ru?: string;
  short_address_ua?: string;
  short_address_ru?: string;
  type_of_warehouse: 'PostOffice' | 'Postomat';
  number?: string;
  phone?: string;
  max_weight_allowed?: number;
}

export const novaPoshtaAPI = {
  getPopularCities: () => fetchAPI<NovaPoshtaCity[]>('/nova-poshta/cities/popular'),
  searchCities: (query: string) => fetchAPI<NovaPoshtaCity[]>(`/nova-poshta/cities/search?q=${encodeURIComponent(query)}`),
  getCity: (ref: string) => fetchAPI<NovaPoshtaCity>(`/nova-poshta/cities/${ref}`),
  getWarehouses: (cityRef: string, type?: 'PostOffice' | 'Postomat', search?: string) => {
    const params = new URLSearchParams({ cityRef });
    if (type) params.append('type', type);
    if (search) params.append('search', search);
    return fetchAPI<NovaPoshtaWarehouse[]>(`/nova-poshta/warehouses?${params.toString()}`);
  },
  getWarehouse: (ref: string) => fetchAPI<NovaPoshtaWarehouse>(`/nova-poshta/warehouses/${ref}`),
};

// Ukrposhta API
// Согласно документации "Рекомендації з пошуку індексів та відділень" (Search-offices-and-indexes-v3.pdf)
// Используется адресный классификатор API: https://ukrposhta.ua/address-classifier-ws/
export interface UkrposhtaCity {
  id: string; // CITY_ID из адресного классификатора
  name: string; // CITY_UA
  postalCode: string; // POSTCODE (может быть пустым для населенного пункта)
  region?: string; // REGION_UA
  district?: string; // DISTRICT_UA
  cityId?: string; // CITY_ID (для получения отделений)
}

export interface UkrposhtaBranch {
  id: string; // POSTOFFICE_ID
  name: string; // POSTOFFICE_UA
  address: string; // ADDRESS_UA
  postalCode: string; // POSTCODE
  cityId?: string; // CITY_ID
}

// Прямой вызов API Укрпошты с фронтенда (через браузер)
// ✅ ПРОТЕСТИРОВАНО автоматическим тестом - эта конфигурация работает!
// URL: https://www.ukrposhta.ua/address-classifier-ws (с www)
// PROD_BEARER_ECOM (из АРІ_ключі.pdf): 67f02a7c-3af7-34d1-aa18-7eb4d96f3be4
const UKRPOSHTA_API_BASE = 'https://www.ukrposhta.ua/address-classifier-ws';
const UKRPOSHTA_BEARER_TOKEN = '67f02a7c-3af7-34d1-aa18-7eb4d96f3be4';

async function callUkrposhtaAPIDirect(endpoint: string): Promise<any> {
  const url = `${UKRPOSHTA_API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${UKRPOSHTA_BEARER_TOKEN}`,
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} - ${await response.text()}`);
    }
    
    return response.json();
  } catch (error) {
    console.error(`❌ [Ukrposhta Direct API] Request failed:`, error);
    throw error;
  }
}

export const ukrposhtaAPI = {
  // Все запросы идут через наш сервер (CORS блокирует прямые запросы из браузера)
  getPopularCities: () => fetchAPI<UkrposhtaCity[]>('/ukrposhta/cities/popular'),
  searchCities: (query: string) => fetchAPI<UkrposhtaCity[]>(`/ukrposhta/cities/search?q=${encodeURIComponent(query)}`),
  getCity: (id: string) => fetchAPI<UkrposhtaCity>(`/ukrposhta/cities/${id}`),
  getBranches: (cityId: string, search?: string) => {
    const params = new URLSearchParams({ cityId });
    if (search) params.append('search', search);
    return fetchAPI<UkrposhtaBranch[]>(`/ukrposhta/branches?${params.toString()}`);
  },
  getBranch: (id: string, cityId?: string) => {
    const url = cityId 
      ? `/ukrposhta/branches/${id}?cityId=${cityId}`
      : `/ukrposhta/branches/${id}`;
    return fetchAPI<UkrposhtaBranch>(url);
  },
};

// WayForPay API
export const wayforpayAPI = {
  createPayment: (orderId: string) => fetchAPI<{ paymentUrl: string; paymentData: Record<string, string | number | string[]> }>('/wayforpay/create-payment', {
    method: 'POST',
    body: JSON.stringify({ orderId }),
  }),
};

// Promo Code API
export interface PromoCodeResponse {
  code: string;
  discount: number;
  message: string;
}

// Email Templates API
export interface EmailTemplate {
  id: number;
  event_type: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  is_active: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const emailTemplatesAPI = {
  getAll: () => fetchAPI<EmailTemplate[]>('/email-templates'),
  getByEventType: (eventType: string) => fetchAPI<EmailTemplate>(`/email-templates/${eventType}`),
  update: (eventType: string, data: { subject: string; body_html: string; body_text?: string | null; is_active?: boolean; description?: string | null }) => 
    fetchAPI<EmailTemplate>(`/email-templates/${eventType}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  test: (eventType: string, testEmail: string, testData?: Record<string, any>) =>
    fetchAPI<{ message: string; messageId?: string }>(`/email-templates/${eventType}/test`, {
      method: 'POST',
      body: JSON.stringify({ testEmail, testData }),
    }),
};

export const promoAPI = {
  validate: (code: string, items: Array<{ productId: string }>) => fetchAPI<PromoCodeResponse>('/promo/validate', {
    method: 'POST',
    body: JSON.stringify({ code, items }),
  }),
};

// Auth API
export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Session {
  id: number;
  ip_address: string;
  user_agent: string;
  last_activity: string;
  expires_at: string;
  created_at: string;
}

export const authAPI = {
  // Инициация Google OAuth
  googleLogin: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },
  
  // Обновление токена
  refresh: (refreshToken: string) => fetchAPI<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  }),
  
  // Выход
  logout: () => fetchAPI<{ message: string }>('/auth/logout', {
    method: 'POST',
  }),
  
  // Получение текущего пользователя
  me: () => fetchAPI<User>('/auth/me'),
  
  // Получение списка сессий
  getSessions: () => fetchAPI<Session[]>('/auth/sessions'),
  
  // Удаление сессии
  deleteSession: (sessionId: number) => fetchAPI<{ message: string }>(`/auth/sessions/${sessionId}`, {
    method: 'DELETE',
  }),
  
  // Привязка заказов к пользователю
  linkOrders: () => fetchAPI<{ message: string; linkedOrders: number }>('/auth/link-orders', {
    method: 'POST',
  }),
};

// Admin Auth API
export const adminAuthAPI = {
  // Вход для админа (email/password)
  login: (email: string, password: string) => fetchAPI<AuthResponse>('/admin-auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }),
  
  // Проверка прав админа
  verify: () => fetchAPI<{ valid: boolean; user: User }>('/admin-auth/verify'),
  
  // Логи действий админов
  getLogs: (params?: { limit?: number; offset?: number; userId?: number; action?: string }) => 
    fetchAPI<any>('/admin-auth/logs?' + new URLSearchParams(params as any).toString()),
  
  // Попытки входа
  getLoginAttempts: (params?: { limit?: number; offset?: number; email?: string; ip?: string }) =>
    fetchAPI<any[]>('/admin-auth/login-attempts?' + new URLSearchParams(params as any).toString()),
  
  // Заблокированные IP
  getBlockedIps: () => fetchAPI<any[]>('/admin-auth/blocked-ips'),
  
  // Разблокировка IP
  unblockIp: (ip: string) => fetchAPI<{ message: string }>(`/admin-auth/blocked-ips/${ip}`, {
    method: 'DELETE',
  }),
};

