export type ProductCategory = string;

export const DEFAULT_CATEGORIES: string[] = [
  'Beras & Biji',
  'Minyak & Mentega',
  'Gula & Bumbu',
  'Telur & Segar',
  'Tepung & Gandum',
  'Mie & Makanan Instan',
  'Minuman & Susu',
  'Kebutuhan Rumah',
  'Gas & Galon',
  'Lain-lain',
];

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  unit: string;
  stock: number;
  minStock: number;
  costPrice: number;
  sellPrice: number;
  updatedAt: string;
}

export type UserRole = 'OWNER' | 'KASIR' | 'GUDANG' | 'ADMIN';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  avatarColor?: string;
  pin?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPrice: number;
  sellPrice: number;
  subtotalCost: number;
  subtotal: number;
  profit: number;
}

export type PaymentMethod = 'TUNAI' | 'TRANSFER' | 'QRIS' | 'HUTANG';

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  items: SaleItem[];
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  paymentMethod: PaymentMethod;
  customerName: string;
  cashierName: string;
  notes?: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unit: string;
  costPrice: number;
  subtotal: number;
}

export type PurchasePaymentMethod = 'TUNAI' | 'TRANSFER' | 'TEMPO';

export interface Purchase {
  id: string;
  invoiceNumber: string;
  date: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentMethod: PurchasePaymentMethod;
  operatorName: string;
  notes?: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | 'ADJUSTMENT' | 'ADJUST';
export type MovementReferenceType = 'SALE' | 'PURCHASE' | 'ADJUSTMENT' | 'INITIAL' | 'MANUAL';

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  unit: string;
  unitCostPrice: number;
  unitSellPrice: number;
  totalAmount: number;
  profit: number;
  date: string;
  referenceId?: string;
  referenceType?: MovementReferenceType | string;
  operatorName: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'LISTRIK_AIR'
  | 'PLASTIK_PACKING'
  | 'BENSIN_TRANSPORT'
  | 'GAJI_KARYAWAN'
  | 'SEWA_TEMPAT'
  | 'MAKAN_KONSUMSI'
  | 'PERAWATAN_TOKO'
  | 'OPERASIONAL'
  | 'LAINNYA';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  categoryLabel?: string;
  amount: number;
  description: string;
  recordedBy?: string;
  notes?: string;
}
