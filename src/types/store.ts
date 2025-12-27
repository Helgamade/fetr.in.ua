export interface ProductOption {
  id: string;
  name: string;
  price: number;
  description?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  basePrice: number;
  salePrice?: number;
  images: string[];
  badge?: 'hit' | 'recommended' | 'limited';
  features: string[];
  materials: { name: string; description: string }[];
  canMake: string[];
  suitableFor: string[];
  options: ProductOption[];
  stock: number;
  viewCount: number;
  purchaseCount: number;
}

export interface CartItem {
  productId: string;
  quantity: number;
  selectedOptions: string[];
}

export interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
}

export interface DeliveryInfo {
  method: 'nova_poshta' | 'ukrposhta' | 'pickup';
  city?: string;
  warehouse?: string;
  postIndex?: string;
  address?: string;
}

export interface PaymentInfo {
  method: 'card' | 'cod'; // card = на карту, cod = післяплата
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  delivery: DeliveryInfo;
  payment: PaymentInfo;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCost: number;
  total: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'created'
  | 'accepted'
  | 'processing'
  | 'awaiting_payment'
  | 'paid'
  | 'assembled'
  | 'packed'
  | 'shipped'
  | 'in_transit'
  | 'arrived'
  | 'completed';

export interface Review {
  id: string;
  name: string;
  text: string;
  rating?: number;
  photo?: string;
  createdAt: Date;
  isApproved: boolean;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  photo: string;
  description: string;
}

export interface SocialProof {
  type: 'viewing' | 'purchased';
  city?: string;
  productName?: string;
  count?: number;
}

export interface AnalyticsEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
}
