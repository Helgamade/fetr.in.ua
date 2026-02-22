export interface ProductOption {
  id: number; // INT AUTO_INCREMENT
  code: string; // Code like 'gift-wrap', 'card', etc.
  name: string;
  price: number;
  description?: string;
  icon?: string; // SVG код или URL иконки
  orderCount?: number; // Кількість замовлень (соціальний доказ), задається окремо для кожного товару
  badge?: string;      // Бейдж (напр. "⭐ Популярне", "🔥 Хіт"), задається окремо для кожного товару
}

export interface ProductMaterial {
  id: number;
  name: string;
  description?: string;
  image?: string;
  thumbnail?: string;
  sortOrder?: number;
  products?: { id: string; name: string }[];
}

export interface Product {
  id: number; // Changed to number (INT AUTO_INCREMENT)
  code: string; // Product code like 'starter', 'optimal', 'premium'
  name: string;
  fullName?: string; // Повна назва товару (наприклад, "Набір фетру БАЗОВИЙ"), відображається в модалі
  slug: string;
  shortDescription: string;
  fullDescription: string;
  basePrice: number;
  salePrice?: number;
  images: string[];
  badge?: 'hit' | 'recommended' | 'limited';
  features: string[];
  materials: ProductMaterial[];
  canMake: string[];
  suitableFor: string[];
  options: ProductOption[];
  stock: number;
  viewCount: number;
  purchaseCount: number;
  actualPurchaseCount?: number; // Реальное количество продаж из завершенных заказов
  dailySalesTarget?: number; // Целевое количество продаж в день
  displayOrder?: number;
  sectionIconFeatures?: string; // SVG код или URL иконки для секции "Що входить"
  sectionIconMaterials?: string; // SVG код или URL иконки для секции "Матеріали"
  sectionIconCanMake?: string; // SVG код или URL иконки для секции "Що можна зробити"
  sectionIconSuitableFor?: string; // SVG код или URL иконки для секции "Підходить для"
  sectionIconOptions?: string; // SVG код или URL иконки для секции "Додаткові опції"
  featuresExtraText?: string; // Текст для отображения дополнительных позиций (например, "+ ще 2 позицій")
}

export interface CartItem {
  id: string; // Уникальный идентификатор позиции в корзине
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
  firstName?: string;
  lastName?: string;
}

export interface RecipientInfo {
  name: string;
  phone: string;
  firstName?: string;
  lastName?: string;
}

export interface DeliveryInfo {
  method: 'nova_poshta' | 'ukrposhta' | 'pickup';
  city?: string;
  cityRef?: string | null; // Ref города Новой Почты или ID города Укрпошта
  warehouse?: string;
  warehouseRef?: string | null; // Ref отделения Новой Почты или ID отделения Укрпошта
  postIndex?: string;
  address?: string;
}

export interface PaymentInfo {
  method: 'wayforpay' | 'nalojka' | 'fopiban'; // wayforpay = WayForPay, nalojka = наложенный платеж, fopiban = Оплата на рахунок ФОП
  status?: 'not_paid' | 'cash_on_delivery' | 'paid'; // Статус оплаты (независимый от статуса заказа)
  paidAmount?: number | null; // Фактическая сумма оплаты
}

export interface Order {
  id: string;
  customer: CustomerInfo;
  recipient?: RecipientInfo; // Данные получателя, если отличается от заказчика
  delivery: DeliveryInfo;
  payment: PaymentInfo;
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryCost: number;
  total: number;
  status: OrderStatus;
  promoCode?: string;
  trackingToken?: string; // Токен для безопасной ссылки отслеживания заказа
  deliveryTtn?: string; // Номер накладной доставки (Нова Пошта/Укрпошта)
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 
  | 'created'
  | 'accepted'
  | 'processing'
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
  id: number;
  question: string;
  answer: string;
  sort_order?: number;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  photo: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstagramPost {
  id: number;
  image_url: string;
  description?: string | null;
  instagram_url: string;
  likes_count: number;
  comments_count: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
