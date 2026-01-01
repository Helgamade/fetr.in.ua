// API client for backend
import { Product, Order, ProductOption } from '@/types/store';

// Always use /api (proxied to Node.js backend)
// Hardcoded to /api to avoid any environment variable issues
const API_BASE_URL = '/api';

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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
// API Укрпошты блокирует серверные запросы (403), поэтому делаем запросы напрямую с фронтенда
const UKRPOSHTA_API_BASE = 'https://ukrposhta.ua/address-classifier-ws';

async function callUkrposhtaAPIDirect(endpoint: string): Promise<any> {
  const url = `${UKRPOSHTA_API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7',
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
  getPopularCities: () => fetchAPI<UkrposhtaCity[]>('/ukrposhta/cities/popular'),
  searchCities: async (query: string): Promise<UkrposhtaCity[]> => {
    // Пробуем сначала через наш сервер (может не работать из-за 403)
    try {
      return await fetchAPI<UkrposhtaCity[]>(`/ukrposhta/cities/search?q=${encodeURIComponent(query)}`);
    } catch (error) {
      // Если серверный запрос не работает, пробуем напрямую с фронтенда
      console.log('⚠️ [Ukrposhta API] Server request failed, trying direct API call');
      
      // Популярные области для поиска
      const popularRegions = [
        { id: '270', name: 'Київська' },
        { id: '14', name: 'Львівська' },
        { id: '63', name: 'Харківська' },
        { id: '51', name: 'Одеська' },
        { id: '12', name: 'Дніпропетровська' },
        { id: '23', name: 'Запорізька' },
        { id: '32', name: 'Київ' },
      ];
      
      // Ищем в популярных областях параллельно
      const searchPromises = popularRegions.map(async (region) => {
        try {
          const data = await callUkrposhtaAPIDirect(
            `/get_city_by_region_id_and_district_id_and_city_ua?region_id=${region.id}&city_ua=${encodeURIComponent(query)}`
          );
          const entries = data?.Entries?.Entry || [];
          return Array.isArray(entries) ? entries : [entries];
        } catch (err) {
          return [];
        }
      });
      
      const results = await Promise.all(searchPromises);
      const apiCities = results.flat();
      
      // Преобразуем данные API в наш формат
      const formattedCities = apiCities.map((item: any) => ({
        id: item.CITY_ID?.toString() || item.CITY_KOATUU || item.CITY_KATOTTG || '',
        name: item.CITY_UA || item.CITY_EN || '',
        postalCode: item.POSTCODE || '',
        region: item.REGION_UA || '',
        district: item.DISTRICT_UA || '',
        cityId: item.CITY_ID?.toString() || '',
      })).filter((city: any) => city.name && city.id);
      
      return formattedCities;
    }
  },
  getCity: (id: string) => fetchAPI<UkrposhtaCity>(`/ukrposhta/cities/${id}`),
  getBranches: async (cityId: string, search?: string): Promise<UkrposhtaBranch[]> => {
    // Пробуем сначала через наш сервер
    try {
      const params = new URLSearchParams({ cityId });
      if (search) params.append('search', search);
      return await fetchAPI<UkrposhtaBranch[]>(`/ukrposhta/branches?${params.toString()}`);
    } catch (error) {
      // Если серверный запрос не работает, пробуем напрямую с фронтенда
      console.log('⚠️ [Ukrposhta API] Server request failed, trying direct API call');
      
      const cityIdNum = parseInt(cityId, 10);
      if (isNaN(cityIdNum) || cityIdNum <= 0) {
        throw new Error(`Invalid cityId: "${cityId}". CITY_ID must be a number.`);
      }
      
      try {
        const data = await callUkrposhtaAPIDirect(
          `/get_postoffices_by_postcode_cityid_cityvpzid?city_id=${cityIdNum}`
        );
        
        const entries = data?.Entries?.Entry || [];
        const branchesList = Array.isArray(entries) ? entries : [entries];
        
        const formattedBranches = branchesList.map((item: any, index: number) => ({
          id: item.POSTOFFICE_ID?.toString() || item.POSTCODE || `branch_${index}`,
          name: item.POSTOFFICE_UA || item.POSTOFFICE_EN || item.POSTOFFICE_NAME || `Відділення ${index + 1}`,
          address: item.STREET_UA_VPZ || item.ADDRESS_UA || item.ADDRESS_EN || item.ADDRESS || '',
          postalCode: item.POSTCODE || '',
          cityId: cityId,
        })).filter((branch: any) => branch.name);
        
        // Если есть поисковый запрос, дополнительно фильтруем результаты
        if (search && search.length >= 2) {
          const searchLower = search.toLowerCase();
          return formattedBranches.filter((branch: any) => 
            branch.name.toLowerCase().includes(searchLower) ||
            branch.address.toLowerCase().includes(searchLower) ||
            branch.id.toString().toLowerCase().includes(searchLower)
          );
        }
        
        return formattedBranches;
      } catch (apiError) {
        console.error('❌ [Ukrposhta Direct API] Get branches error:', apiError);
        throw apiError;
      }
    }
  },
  getBranch: (id: string) => fetchAPI<UkrposhtaBranch>(`/ukrposhta/branches/${id}`),
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

export const promoAPI = {
  validate: (code: string, items: Array<{ productId: string }>) => fetchAPI<PromoCodeResponse>('/promo/validate', {
    method: 'POST',
    body: JSON.stringify({ code, items }),
  }),
};

