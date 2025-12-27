// API client for backend
import { Product, Order } from '@/types/store';

// Use environment variable or fallback to relative path
// In production with proxy: always use relative path /api
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  getAll: () => fetchAPI<any[]>('/faqs'),
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

// Gallery API
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

