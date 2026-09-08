import { Product, Sale, Purchase, StockMovement, Expense, AppUser } from '../types';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-1',
    name: 'Via',
    email: 'via',
    role: 'OWNER',
    roleLabel: 'Owner (Pemilik Toko)',
    avatarColor: 'bg-emerald-600',
    pin: '1008',
  },
];

// Reset semua data menjadi 0 (Fresh Start untuk Toko Real)
export const INITIAL_PRODUCTS: Product[] = [];
export const INITIAL_SALES: Sale[] = [];
export const INITIAL_PURCHASES: Purchase[] = [];
export const INITIAL_STOCK_MOVEMENTS: StockMovement[] = [];
export const INITIAL_EXPENSES: Expense[] = [];
