import { Order } from '@/types/store';

export const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customer: {
      name: 'Олена Мельник',
      phone: '+380501234567',
      email: 'olena.melnyk@gmail.com',
    },
    delivery: {
      method: 'nova_poshta',
      city: 'Київ',
      warehouse: 'Відділення №15',
    },
    payment: {
      method: 'card',
    },
    items: [
      { productId: 'optimal', quantity: 1, selectedOptions: ['gift-wrap'] },
    ],
    subtotal: 1190,
    discount: 0,
    deliveryCost: 0,
    total: 1265,
    status: 'created',
    createdAt: new Date('2024-12-24T10:30:00'),
    updatedAt: new Date('2024-12-24T10:30:00'),
  },
  {
    id: 'ORD-002',
    customer: {
      name: 'Ірина Ковальчук',
      phone: '+380679876543',
      email: 'iryna.kovalchuk@ukr.net',
    },
    delivery: {
      method: 'nova_poshta',
      city: 'Львів',
      warehouse: 'Відділення №7',
    },
    payment: {
      method: 'cod',
    },
    items: [
      { productId: 'premium', quantity: 1, selectedOptions: [] },
    ],
    subtotal: 1990,
    discount: 0,
    deliveryCost: 0,
    total: 1990,
    status: 'processing',
    createdAt: new Date('2024-12-23T15:45:00'),
    updatedAt: new Date('2024-12-24T09:00:00'),
  },
  {
    id: 'ORD-003',
    customer: {
      name: 'Наталія Шевченко',
      phone: '+380631112233',
      email: 'natalia.shevchenko@gmail.com',
    },
    delivery: {
      method: 'ukrposhta',
      city: 'Одеса',
      postIndex: '65000',
      address: 'вул. Дерибасівська, 10',
    },
    payment: {
      method: 'card',
    },
    items: [
      { productId: 'starter', quantity: 2, selectedOptions: ['card', 'masterclass'] },
    ],
    subtotal: 1614,
    discount: 0,
    deliveryCost: 70,
    total: 1684,
    status: 'shipped',
    createdAt: new Date('2024-12-22T12:00:00'),
    updatedAt: new Date('2024-12-23T14:30:00'),
  },
  {
    id: 'ORD-004',
    customer: {
      name: 'Марія Бондаренко',
      phone: '+380997778899',
      email: 'maria.bondarenko@gmail.com',
    },
    delivery: {
      method: 'pickup',
    },
    payment: {
      method: 'card',
    },
    items: [
      { productId: 'optimal', quantity: 1, selectedOptions: ['gift-wrap', 'extra-templates'] },
      { productId: 'starter', quantity: 1, selectedOptions: [] },
    ],
    subtotal: 2075,
    discount: 200,
    deliveryCost: 0,
    total: 1875,
    status: 'completed',
    createdAt: new Date('2024-12-20T09:15:00'),
    updatedAt: new Date('2024-12-21T16:00:00'),
  },
  {
    id: 'ORD-005',
    customer: {
      name: 'Вікторія Литвин',
      phone: '+380661234567',
      email: 'viktoria.lytvyn@gmail.com',
    },
    delivery: {
      method: 'nova_poshta',
      city: 'Харків',
      warehouse: 'Відділення №23',
    },
    payment: {
      method: 'card',
    },
    items: [
      { productId: 'premium', quantity: 1, selectedOptions: ['consultation'] },
    ],
    subtotal: 2140,
    discount: 0,
    deliveryCost: 0,
    total: 2140,
    status: 'paid',
    createdAt: new Date('2024-12-23T18:20:00'),
    updatedAt: new Date('2024-12-24T08:00:00'),
  },
  {
    id: 'ORD-006',
    customer: {
      name: 'Анастасія Петренко',
      phone: '+380503334455',
      email: 'anastasia.petrenko@ukr.net',
    },
    delivery: {
      method: 'nova_poshta',
      city: 'Дніпро',
      warehouse: 'Відділення №12',
    },
    payment: {
      method: 'cod',
    },
    items: [
      { productId: 'starter', quantity: 3, selectedOptions: ['gift-wrap'] },
    ],
    subtotal: 2295,
    discount: 100,
    deliveryCost: 0,
    total: 2195,
    status: 'in_transit',
    createdAt: new Date('2024-12-21T11:00:00'),
    updatedAt: new Date('2024-12-23T10:00:00'),
  },
];

export const mockStats = {
  totalOrders: 156,
  totalRevenue: 287450,
  averageOrderValue: 1843,
  ordersToday: 8,
  ordersThisWeek: 42,
  ordersThisMonth: 156,
  conversionRate: 4.2,
  repeatCustomers: 34,
  topProducts: [
    { name: 'Оптимальний набір', count: 78, revenue: 92820 },
    { name: 'Преміум набір', count: 45, revenue: 89550 },
    { name: 'Стартовий набір', count: 33, revenue: 22770 },
  ],
  ordersByStatus: {
    created: 3,
    processing: 5,
    paid: 8,
    shipped: 12,
    in_transit: 6,
    completed: 122,
  },
  dailyRevenue: [
    { date: '18.12', revenue: 8500, orders: 5 },
    { date: '19.12', revenue: 12300, orders: 7 },
    { date: '20.12', revenue: 9800, orders: 6 },
    { date: '21.12', revenue: 15600, orders: 9 },
    { date: '22.12', revenue: 11200, orders: 6 },
    { date: '23.12', revenue: 18900, orders: 11 },
    { date: '24.12', revenue: 14200, orders: 8 },
  ],
};
