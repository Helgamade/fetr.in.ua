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

