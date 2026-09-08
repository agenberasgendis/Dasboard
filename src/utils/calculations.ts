import { Sale, Purchase, Expense, Product, ExpenseCategory } from '../types';
import { getMonthName, formatDateIndo } from './formatters';

export interface DailyFinancialItem {
  day: number;
  dateString: string;
  txCount: number;
  revenue: number;
  cogs: number;
  expenses: number;
  netProfit: number;
}

export interface MonthlyProfitLossReport {
  month: number;
  year: number;
  monthName: string;
  totalRevenue: number;
  totalTransactions: number;
  totalCOGS: number;
  grossProfit: number;
  grossProfitMargin: number;
  totalExpenses: number;
  expenseCategories: {
    category: ExpenseCategory;
    label: string;
    amount: number;
    percentage: number;
  }[];
  netProfit: number;
  netProfitMargin: number;
  totalPurchases: number;
  topProducts: {
    productId: string;
    productName: string;
    qtySold: number;
    unit: string;
    revenue: number;
    cost: number;
    profit: number;
    marginPercent: number;
  }[];
  dailyBreakdown: DailyFinancialItem[];
}

const EXPENSE_LABELS: Record<ExpenseCategory, string> = {
  LISTRIK_AIR: 'Listrik & Air (PLN & PDAM)',
  PLASTIK_PACKING: 'Plastik Kresek, Karet & Tali',
  BENSIN_TRANSPORT: 'Bensin & Transportasi Kulakan',
  GAJI_KARYAWAN: 'Gaji Karyawan / Penjaga Toko',
  SEWA_TEMPAT: 'Sewa Tempat / Kios Toko',
  MAKAN_KONSUMSI: 'Makan & Konsumsi Toko',
  PERAWATAN_TOKO: 'Perawatan & Perbaikan Toko',
  OPERASIONAL: 'Operasional Harian',
  LAINNYA: 'Beban Lain-lain',
};

export const calculateMonthlyProfitLoss = (
  sales: Sale[],
  purchases: Purchase[],
  expenses: Expense[],
  year: number,
  month: number
): MonthlyProfitLossReport => {
  const monthStr = month.toString().padStart(2, '0');
  const periodPrefix = `${year}-${monthStr}`;

  const monthSales = sales.filter((s) => s.date.startsWith(periodPrefix));
  const monthPurchases = purchases.filter((p) => p.date.startsWith(periodPrefix));
  const monthExpenses = expenses.filter((e) => e.date.startsWith(periodPrefix));

  let totalRevenue = 0;
  let totalCOGS = 0;
  const productMap = new Map<
    string,
    { productId: string; productName: string; qtySold: number; unit: string; revenue: number; cost: number; profit: number }
  >();

  for (const sale of monthSales) {
    totalRevenue += sale.totalRevenue;
    totalCOGS += sale.totalCost;

    for (const item of sale.items) {
      const existing = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        qtySold: 0,
        unit: item.unit,
        revenue: 0,
        cost: 0,
        profit: 0,
      };

      existing.qtySold += item.quantity;
      existing.revenue += item.subtotal;
      existing.cost += item.subtotalCost;
      existing.profit += item.profit;

      productMap.set(item.productId, existing);
    }
  }

  const grossProfit = totalRevenue - totalCOGS;
  const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const expenseCatMap = new Map<ExpenseCategory, number>();
  let totalExpenses = 0;

  for (const exp of monthExpenses) {
    totalExpenses += exp.amount;
    const curr = expenseCatMap.get(exp.category) || 0;
    expenseCatMap.set(exp.category, curr + exp.amount);
  }

  const expenseCategories = Array.from(expenseCatMap.entries()).map(([cat, amount]) => ({
    category: cat,
    label: EXPENSE_LABELS[cat] || cat,
    amount,
    percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
  }));

  const netProfit = grossProfit - totalExpenses;
  const netProfitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const totalPurchases = monthPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

  const topProducts = Array.from(productMap.values())
    .map((p) => ({
      ...p,
      marginPercent: p.revenue > 0 ? (p.profit / p.revenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  // Calculate daily breakdown for the month
  const daysInMonth = new Date(year, month, 0).getDate();
  const dailyBreakdown: DailyFinancialItem[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = `${periodPrefix}-${day.toString().padStart(2, '0')}`;
    const daySales = monthSales.filter((s) => s.date.startsWith(dayStr));
    const dayExpenses = monthExpenses.filter((e) => e.date.startsWith(dayStr));

    const revenue = daySales.reduce((acc, s) => acc + s.totalRevenue, 0);
    const cogs = daySales.reduce((acc, s) => acc + s.totalCost, 0);
    const expAmt = dayExpenses.reduce((acc, e) => acc + e.amount, 0);
    const dayNet = revenue - cogs - expAmt;

    dailyBreakdown.push({
      day,
      dateString: formatDateIndo(dayStr),
      txCount: daySales.length,
      revenue,
      cogs,
      expenses: expAmt,
      netProfit: dayNet,
    });
  }

  return {
    month,
    year,
    monthName: getMonthName(month),
    totalRevenue,
    totalTransactions: monthSales.length,
    totalCOGS,
    grossProfit,
    grossProfitMargin,
    totalExpenses,
    expenseCategories,
    netProfit,
    netProfitMargin,
    totalPurchases,
    topProducts,
    dailyBreakdown,
  };
};

export const calculateInventoryValuation = (products: Product[]) => {
  let totalCostValue = 0;
  let totalSellValue = 0;

  for (const p of products) {
    const qty = Math.max(0, p.stock);
    totalCostValue += qty * p.costPrice;
    totalSellValue += qty * p.sellPrice;
  }

  return {
    totalItems: products.length,
    totalCostValue,
    totalSellValue,
    totalPotentialProfit: totalSellValue - totalCostValue,
  };
};
