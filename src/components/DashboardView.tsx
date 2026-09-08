import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Truck,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Package,
  Calendar,
  Wallet,
  Clock,
  CheckCircle2,
  FileSpreadsheet,
  User,
  ShieldCheck,
  Cloud,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { calculateMonthlyProfitLoss, calculateInventoryValuation } from '../utils/calculations';
import { TabType } from './Navbar';
import { RecentTransactions } from './RecentTransactions';
import { MonthlyBalanceChart } from './MonthlyBalanceChart';

interface DashboardViewProps {
  onNavigate: (tab: TabType) => void;
  onOpenSale: () => void;
  onOpenPurchase: () => void;
  onOpenExportModal?: () => void;
  onOpenGoogleDriveModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenSale,
  onOpenPurchase,
  onOpenExportModal,
  onOpenGoogleDriveModal,
}) => {
  const { products, sales, purchases, expenses, stockMovements, storeInfo, currentUser } = useStore();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const currentReport = calculateMonthlyProfitLoss(
    sales,
    purchases,
    expenses,
    currentYear,
    currentMonth
  );

  const inventory = calculateInventoryValuation(products);

  // Today stats
  const todayStr = now.toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));
  const todayPurchases = purchases.filter((p) => p.date.startsWith(todayStr));
  const todayMovements = stockMovements.filter((m) => m.date.startsWith(todayStr));

  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.totalProfit, 0);
  const todayOutQty = todayMovements
    .filter((m) => m.type === 'OUT')
    .reduce((acc, m) => acc + m.quantity, 0);
  const todayInQty = todayMovements
    .filter((m) => m.type === 'IN')
    .reduce((acc, m) => acc + m.quantity, 0);

  // Low stock products
  const lowStockProducts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner with Welcome & Quick Actions */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-7 text-white shadow-sm border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Calendar className="w-3.5 h-3.5" />
                Periode: {currentReport.monthName} {currentYear}
              </span>
              {currentUser && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <User className="w-3 h-3" />
                  Operator: {currentUser.name} ({currentUser.roleLabel.split(' ')[0]})
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {storeInfo.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              id="dash-btn-new-sale"
              onClick={onOpenSale}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>+ Penjualan Kasir</span>
            </button>
            <button
              id="dash-btn-new-purchase"
              onClick={onOpenPurchase}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md transition"
            >
              <Truck className="w-4 h-4" />
              <span>+ Kulakan Masuk</span>
            </button>
            {onOpenExportModal && (
              <button
                id="dash-btn-export-quick"
                onClick={onOpenExportModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Ekspor Excel/PDF</span>
              </button>
            )}
            {onOpenGoogleDriveModal && (
              <button
                id="dash-btn-google-drive"
                onClick={onOpenGoogleDriveModal}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-700/80 hover:bg-blue-600 text-white text-xs font-bold shadow-md transition border border-blue-400/30"
                title="Sinkronisasi & Backup ke Google Drive"
              >
                <Cloud className="w-4 h-4 text-blue-200" />
                <span>Google Drive</span>
              </button>
            )}
            <button
              id="dash-btn-view-pnl"
              onClick={() => onNavigate('profit-loss')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-700/90 hover:bg-slate-700 text-slate-100 text-xs font-bold border border-slate-600 transition"
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Laba Rugi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Monthly Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penjualan (Omzet) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Omzet Penjualan
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(currentReport.totalRevenue)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-slate-700">{currentReport.totalTransactions}</span> transaksi keluar bulan ini
            </div>
          </div>
        </div>

        {/* Total Modal (HPP Barang Keluar) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Modal Terjual (HPP)
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatRupiah(currentReport.totalCOGS)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              Harga beli pokok beras & sembako
            </div>
          </div>
        </div>

        {/* Laba Kotor (Gross Profit) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Laba Kotor
            </span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-bold text-teal-700 tracking-tight">
              {formatRupiah(currentReport.grossProfit)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-500">
              <span className="font-semibold text-teal-700">Margin: {currentReport.grossProfitMargin.toFixed(1)}%</span> dari penjualan
            </div>
          </div>
        </div>

        {/* Laba Bersih Toko (Net Profit) */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/70 p-5 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Laba Bersih Riil
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-emerald-800 tracking-tight">
              {formatRupiah(currentReport.netProfit)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-emerald-700">
              <span>Setelah beban toko {formatRupiah(currentReport.totalExpenses)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Neraca Keuangan Bulanan (Diagram Batang Tiap Bulan) */}
      <MonthlyBalanceChart
        sales={sales}
        purchases={purchases}
        expenses={expenses}
      />

      {/* Arus Barang Masuk & Keluar Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Ringkasan Arus Barang Masuk & Keluar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Arus Beras & Barang Toko</h2>
              <p className="text-xs text-slate-500">Mutasi barang masuk vs keluar hari ini & bulan ini</p>
            </div>
            <button
              onClick={() => onNavigate('movements')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Lihat Detail →
            </button>
          </div>

          {/* Today Flow Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 mb-1">
                <ArrowUpRight className="w-4 h-4 text-blue-600" />
                <span>Barang Masuk (Hari Ini)</span>
              </div>
              <div className="text-xl font-bold text-slate-900">
                +{todayInQty} <span className="text-xs font-normal text-slate-500">unit</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {todayPurchases.length} nota kulakan
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 mb-1">
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                <span>Barang Keluar (Hari Ini)</span>
              </div>
              <div className="text-xl font-bold text-slate-900">
                -{todayOutQty} <span className="text-xs font-normal text-slate-500">unit</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Laba hari ini: <span className="font-semibold text-emerald-700">{formatRupiah(todayProfit)}</span>
              </div>
            </div>
          </div>

          {/* Valuasi Aset Stok */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Item Produk Sembako:</span>
              <span className="font-bold text-slate-900">{inventory.totalItems} macam barang</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Nilai Modal Stok di Gudang:</span>
              <span className="font-bold text-slate-900">{formatRupiah(inventory.totalCostValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Potensi Nilai Jual Stok:</span>
              <span className="font-bold text-emerald-700">{formatRupiah(inventory.totalSellValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 text-slate-500">
              <span>Potensi Laba Kotor Stok:</span>
              <span className="font-bold text-emerald-700">+{formatRupiah(inventory.totalPotentialProfit)}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Buka Katalog Stok & Ubah Harga Barang
          </button>
        </div>

        {/* Kolom Tengah: Alert Stok Menipis & Perlu Kulakan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Perlu Dikulak (Stok Menipis)</h2>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                {lowStockProducts.length} item
              </span>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                Semua stok beras dan sembako dalam kondisi aman di atas batas minimum.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{p.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Harga Beli: {formatRupiah(p.costPrice)} • Jual: {formatRupiah(p.sellPrice)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-amber-700 text-sm">
                        Sisa: {p.stock} {p.unit}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Min: {p.minStock} {p.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onOpenPurchase}
            className="w-full mt-4 py-2.5 text-center text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-xl transition flex items-center justify-center gap-1.5"
          >
            <Truck className="w-4 h-4" />
            <span>Catat Kulakan Restock Sekarang</span>
          </button>
        </div>

        {/* Kolom Kanan: Top Produk Penghasil Laba Terbesar */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-900">Produk Paling Untung</h2>
              </div>
              <span className="text-xs text-slate-500">Bulan Ini</span>
            </div>

            {currentReport.topProducts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada transaksi penjualan di bulan ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {currentReport.topProducts.slice(0, 5).map((prod, idx) => (
                  <div
                    key={prod.productId}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-xs transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 font-bold text-[11px] flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-900 truncate max-w-[150px] sm:max-w-[180px]">
                          {prod.productName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Terjual: {prod.qtySold} {prod.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">
                        +{formatRupiah(prod.profit)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Margin {prod.marginPercent.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('profit-loss')}
            className="w-full mt-4 py-2.5 text-center text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition"
          >
            Lihat Laporan Laba Rugi Selengkapnya →
          </button>
        </div>
      </div>

      {/* Recent Transactions List with Status Badges & Quick Review */}
      <RecentTransactions
        sales={sales}
        purchases={purchases}
        onNavigate={onNavigate}
      />
    </div>
  );
};
