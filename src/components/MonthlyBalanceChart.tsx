import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import { Sale, Purchase, Expense } from '../types';
import { formatRupiah, getMonthName } from '../utils/formatters';

interface MonthlyBalanceChartProps {
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
}

type ViewFilter = 'ALL' | 'REV_VS_EXP' | 'PROFIT_ONLY';

export const MonthlyBalanceChart: React.FC<MonthlyBalanceChartProps> = ({
  sales,
  purchases,
  expenses,
}) => {
  const currentYear = new Date().getFullYear();

  // Extract available years from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);

    sales.forEach((s) => {
      const yr = new Date(s.date).getFullYear();
      if (!isNaN(yr)) yearsSet.add(yr);
    });
    purchases.forEach((p) => {
      const yr = new Date(p.date).getFullYear();
      if (!isNaN(yr)) yearsSet.add(yr);
    });
    expenses.forEach((e) => {
      const yr = new Date(e.date).getFullYear();
      if (!isNaN(yr)) yearsSet.add(yr);
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [sales, purchases, expenses, currentYear]);

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [viewFilter, setViewFilter] = useState<ViewFilter>('ALL');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(new Date().getMonth()); // 0-indexed

  // Calculate 12-month data for selected year
  const monthlyData = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const monthNum = i + 1;
      const monthName = getMonthName(monthNum, true); // Jan, Feb, etc.
      const fullMonthName = getMonthName(monthNum);

      // Month sales
      const monthSales = sales.filter((s) => {
        const d = new Date(s.date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
      });

      // Month purchases (kulakan)
      const monthPurchases = purchases.filter((p) => {
        const d = new Date(p.date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
      });

      // Month operating expenses
      const monthExpenses = expenses.filter((e) => {
        const d = new Date(e.date);
        return d.getFullYear() === selectedYear && d.getMonth() + 1 === monthNum;
      });

      const revenue = monthSales.reduce((acc, s) => acc + s.totalRevenue, 0);
      const cogs = monthSales.reduce((acc, s) => acc + s.totalCost, 0);
      const grossProfit = revenue - cogs;
      const purchaseTotal = monthPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
      const expenseTotal = monthExpenses.reduce((acc, e) => acc + e.amount, 0);

      // Pengeluaran Kas = Kulakan Beras Masuk + Beban Toko
      const totalOutflow = purchaseTotal + expenseTotal;
      // Laba Bersih Toko = Laba Kotor Penjualan - Beban Operasional Toko
      const netProfit = grossProfit - expenseTotal;
      // Arus Kas Bersih (Cash Inflow - Cash Outflow)
      const netCashFlow = revenue - totalOutflow;

      return {
        month: monthNum,
        monthIndex: i,
        monthLabel: monthName,
        fullMonthName,
        revenue,
        cogs,
        grossProfit,
        purchases: purchaseTotal,
        expenses: expenseTotal,
        totalOutflow,
        netProfit,
        netCashFlow,
        salesCount: monthSales.length,
        purchasesCount: monthPurchases.length,
      };
    });
  }, [sales, purchases, expenses, selectedYear]);

  // Selected month detail
  const currentSelectedMonthData = monthlyData[selectedMonthIndex] || monthlyData[0];

  // Year totals
  const yearTotals = useMemo(() => {
    return monthlyData.reduce(
      (acc, m) => {
        acc.revenue += m.revenue;
        acc.totalOutflow += m.totalOutflow;
        acc.netProfit += m.netProfit;
        acc.purchases += m.purchases;
        acc.expenses += m.expenses;
        return acc;
      },
      { revenue: 0, totalOutflow: 0, netProfit: 0, purchases: 0, expenses: 0 }
    );
  }, [monthlyData]);

  // Custom chart tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xs text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/80 text-xs min-w-[220px] space-y-2">
          <div className="flex items-center justify-between border-b border-slate-700 pb-1.5 font-bold">
            <span className="text-slate-200">
              {dataItem.fullMonthName} {selectedYear}
            </span>
            <span className="text-[10px] text-slate-400">
              {dataItem.salesCount} transaksi kasir
            </span>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between items-center text-emerald-400">
              <span>Pemasukan (Omzet):</span>
              <span className="font-bold">{formatRupiah(dataItem.revenue)}</span>
            </div>
            <div className="flex justify-between items-center text-rose-400">
              <span>Pengeluaran Total:</span>
              <span className="font-bold">{formatRupiah(dataItem.totalOutflow)}</span>
            </div>
            <div className="text-[10px] text-slate-400 pl-2">
              • Kulakan: {formatRupiah(dataItem.purchases)}
            </div>
            <div className="text-[10px] text-slate-400 pl-2">
              • Beban Toko: {formatRupiah(dataItem.expenses)}
            </div>
            <div className="flex justify-between items-center text-blue-400 pt-1 border-t border-slate-700/80 font-bold">
              <span>Laba Bersih:</span>
              <span className={dataItem.netProfit >= 0 ? 'text-blue-300' : 'text-rose-300'}>
                {dataItem.netProfit >= 0 ? '+' : ''}
                {formatRupiah(dataItem.netProfit)}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
      {/* Header: Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Neraca Keuangan Bulanan
            </h2>
            <p className="text-xs text-slate-500">
              Diagram batang komparasi pemasukan, pengeluaran & laba bersih tiap bulan
            </p>
          </div>
        </div>

        {/* Action Controls: Year & View Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Type Pills */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewFilter === 'ALL'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setViewFilter('REV_VS_EXP')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewFilter === 'REV_VS_EXP'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Masuk vs Keluar
            </button>
            <button
              onClick={() => setViewFilter('PROFIT_ONLY')}
              className={`px-2.5 py-1 rounded-lg transition ${
                viewFilter === 'PROFIT_ONLY'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Laba Bersih
            </button>
          </div>

          {/* Year Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-500 font-medium">Tahun:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-slate-900 outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Annual Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Pemasukan (Tahun {selectedYear})
            </span>
            <span className="text-lg font-extrabold text-emerald-900">
              {formatRupiah(yearTotals.revenue)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
              Pengeluaran (Tahun {selectedYear})
            </span>
            <span className="text-lg font-extrabold text-rose-900">
              {formatRupiah(yearTotals.totalOutflow)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">
              Laba Bersih (Tahun {selectedYear})
            </span>
            <span className="text-lg font-extrabold text-blue-900">
              {formatRupiah(yearTotals.netProfit)}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Wallet className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="pt-2">
        <div className="h-72 sm:h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              onClick={(state) => {
                if (state && state.activeTooltipIndex !== undefined) {
                  setSelectedMonthIndex(state.activeTooltipIndex);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="monthLabel"
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val / 1000000).toFixed(1)} jt`;
                  if (val >= 1000) return `${(val / 1000).toFixed(0)} rb`;
                  return `${val}`;
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '12px', fontSize: '11px', fontWeight: 600 }}
              />

              {/* Bar Pemasukan (Omzet) */}
              {(viewFilter === 'ALL' || viewFilter === 'REV_VS_EXP') && (
                <Bar
                  dataKey="revenue"
                  name="Pemasukan (Omzet)"
                  fill="#059669"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}

              {/* Bar Pengeluaran Total (Kulakan + Beban) */}
              {(viewFilter === 'ALL' || viewFilter === 'REV_VS_EXP') && (
                <Bar
                  dataKey="totalOutflow"
                  name="Pengeluaran (Kulakan + Beban)"
                  fill="#e11d48"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}

              {/* Bar Laba Bersih */}
              {(viewFilter === 'ALL' || viewFilter === 'PROFIT_ONLY') && (
                <Bar
                  dataKey="netProfit"
                  name="Laba Bersih Riil"
                  fill="#2563eb"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Month Selector Buttons & Quick Inspector */}
      <div className="pt-2 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Pilih Bulan untuk Cek Rincian Neraca:
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            Bulan Terpilih: <strong className="text-slate-800">{currentSelectedMonthData.fullMonthName} {selectedYear}</strong>
          </span>
        </div>

        {/* Month Chips */}
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5">
          {monthlyData.map((m, idx) => {
            const isSelected = idx === selectedMonthIndex;
            const hasData = m.revenue > 0 || m.totalOutflow > 0;
            return (
              <button
                key={m.month}
                onClick={() => setSelectedMonthIndex(idx)}
                className={`py-1.5 text-xs rounded-xl font-bold transition flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : hasData
                    ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200/50'
                }`}
              >
                <span>{m.monthLabel}</span>
                {hasData && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                      isSelected ? 'bg-emerald-400' : 'bg-emerald-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Month Detail Breakdown Card */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-200/60 pb-2 font-bold text-slate-900">
            <span>
              Rincian Neraca Bulan {currentSelectedMonthData.fullMonthName} {selectedYear}
            </span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                currentSelectedMonthData.netProfit >= 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {currentSelectedMonthData.netProfit >= 0 ? 'Surplus Laba' : 'Defisit'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700">
            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">
                Total Omzet Penjualan
              </span>
              <span className="text-sm font-extrabold text-emerald-700">
                {formatRupiah(currentSelectedMonthData.revenue)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">
                Modal Kulakan Masuk
              </span>
              <span className="text-sm font-extrabold text-amber-700">
                {formatRupiah(currentSelectedMonthData.purchases)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">
                Biaya Operasional Toko
              </span>
              <span className="text-sm font-extrabold text-rose-700">
                {formatRupiah(currentSelectedMonthData.expenses)}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block font-semibold">
                Laba Bersih Akhir
              </span>
              <span
                className={`text-sm font-extrabold ${
                  currentSelectedMonthData.netProfit >= 0 ? 'text-blue-700' : 'text-rose-700'
                }`}
              >
                {formatRupiah(currentSelectedMonthData.netProfit)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
