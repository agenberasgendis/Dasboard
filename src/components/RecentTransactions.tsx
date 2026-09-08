import React, { useState } from 'react';
import {
  ShoppingCart,
  Truck,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  User,
  Building,
  DollarSign,
  FileText,
  X,
  TrendingUp,
  Package,
} from 'lucide-react';
import { Sale, Purchase } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { TabType } from './Navbar';

interface RecentTransactionsProps {
  sales: Sale[];
  purchases: Purchase[];
  onNavigate: (tab: TabType) => void;
}

type FilterType = 'ALL' | 'SALE' | 'PURCHASE';

type SelectedTransaction =
  | { type: 'SALE'; data: Sale }
  | { type: 'PURCHASE'; data: Purchase }
  | null;

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  sales,
  purchases,
  onNavigate,
}) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [selectedTx, setSelectedTx] = useState<SelectedTransaction>(null);

  // Take the last 5 sales and last 5 purchases
  const last5Sales = sales.slice(0, 5);
  const last5Purchases = purchases.slice(0, 5);

  // Combined transactions tagged with their type, sorted latest first
  const combinedTransactions: Array<
    | { type: 'SALE'; id: string; date: string; data: Sale }
    | { type: 'PURCHASE'; id: string; date: string; data: Purchase }
  > = [
    ...last5Sales.map((s) => ({ type: 'SALE' as const, id: s.id, date: s.date, data: s })),
    ...last5Purchases.map((p) => ({ type: 'PURCHASE' as const, id: p.id, date: p.date, data: p })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter based on active tab
  const displayItems =
    filter === 'ALL'
      ? combinedTransactions
      : filter === 'SALE'
      ? last5Sales.map((s) => ({ type: 'SALE' as const, id: s.id, date: s.date, data: s }))
      : last5Purchases.map((p) => ({ type: 'PURCHASE' as const, id: p.id, date: p.date, data: p }));

  // Quick calculations for the last 5
  const sum5SalesRevenue = last5Sales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const sum5SalesProfit = last5Sales.reduce((acc, s) => acc + s.totalProfit, 0);
  const sum5PurchasesCost = last5Purchases.reduce((acc, p) => acc + p.totalAmount, 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Component Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Transaksi Terakhir (Recent Transactions)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Daftar 5 penjualan kasir & 5 pembelian kulakan terbaru dengan status badge dan pratinjau cepat.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            id="filter-tx-all"
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition ${
              filter === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua ({combinedTransactions.length})
          </button>
          <button
            id="filter-tx-sales"
            onClick={() => setFilter('SALE')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              filter === 'SALE'
                ? 'bg-emerald-700 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-3 h-3" />
            <span>Penjualan ({last5Sales.length})</span>
          </button>
          <button
            id="filter-tx-purchases"
            onClick={() => setFilter('PURCHASE')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition ${
              filter === 'PURCHASE'
                ? 'bg-amber-600 text-white shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3 h-3" />
            <span>Kulakan ({last5Purchases.length})</span>
          </button>
        </div>
      </div>

      {/* Mini Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-600 block text-[11px]">Omzet 5 Penjualan Terakhir</span>
            <span className="text-sm font-bold text-emerald-950">{formatRupiah(sum5SalesRevenue)}</span>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-md">
            Laba +{formatRupiah(sum5SalesProfit)}
          </span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-600 block text-[11px]">Biaya 5 Kulakan Terakhir</span>
            <span className="text-sm font-bold text-amber-950">{formatRupiah(sum5PurchasesCost)}</span>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100/90 px-2 py-0.5 rounded-md">
            {last5Purchases.reduce((acc, p) => acc + p.items.length, 0)} Item Masuk
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center justify-between">
          <div>
            <span className="text-slate-600 block text-[11px]">Status Review</span>
            <span className="text-sm font-bold text-slate-800">
              {last5Sales.length + last5Purchases.length} Transaksi Terpantau
            </span>
          </div>
          <span className="text-[11px] font-semibold text-slate-500">
            Klik mata untuk rincian
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {displayItems.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
            Belum ada data transaksi yang tercatat.
          </div>
        ) : (
          displayItems.map((item) => {
            if (item.type === 'SALE') {
              const sale = item.data;
              const isKasbon = sale.paymentMethod === 'KASBON';

              return (
                <div
                  key={`sale-${sale.id}`}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-emerald-200 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Type Icon & Info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">{sale.invoiceNumber}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {formatDateIndo(sale.date, true)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Pelanggan: <strong className="text-slate-900">{sale.customerName || 'Umum'}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          {sale.items.length} item ({sale.items.map((i) => i.productName).join(', ')})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Transaction Status Badge */}
                    {isKasbon ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-700" />
                        Kasbon / Belum Lunas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        Selesai (Terjual)
                      </span>
                    )}

                    {/* Payment Method Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-700">
                      {sale.paymentMethod}
                    </span>

                    {/* Operator Badge */}
                    {sale.cashierName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                        <User className="w-2.5 h-2.5" />
                        Kasir: {sale.cashierName}
                      </span>
                    )}
                  </div>

                  {/* Right: Amounts & Quick Review Action */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                    <div className="text-left md:text-right">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {formatRupiah(sale.totalRevenue)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold">
                        Laba +{formatRupiah(sale.totalProfit)}
                      </div>
                    </div>

                    <button
                      id={`btn-review-sale-${sale.id}`}
                      onClick={() => setSelectedTx({ type: 'SALE', data: sale })}
                      className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-300 transition flex items-center gap-1 text-[11px] font-bold"
                      title="Review Rincian Transaksi"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Review</span>
                    </button>
                  </div>
                </div>
              );
            } else {
              const pch = item.data;
              const isTempo = pch.paymentMethod === 'TEMPO';

              return (
                <div
                  key={`pch-${pch.id}`}
                  className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-amber-200 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Type Icon & Info */}
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-slate-900">{pch.invoiceNumber}</span>
                        <span className="text-[11px] text-slate-400 font-normal">
                          {formatDateIndo(pch.date, true)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <span className="text-slate-600 font-medium">
                          Supplier: <strong className="text-slate-900">{pch.supplierName}</strong>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-slate-500">
                          {pch.items.length} macam barang ({pch.items.map((i) => i.productName).join(', ')})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Center: Status Badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Purchase Status Badge */}
                    {isTempo ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                        <Clock className="w-3 h-3 text-amber-700" />
                        Tempo (Hutang Kulakan)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        <CheckCircle2 className="w-3 h-3 text-blue-700" />
                        Stok Masuk Diterima
                      </span>
                    )}

                    {/* Payment Method Badge */}
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-200 text-slate-700">
                      {pch.paymentMethod}
                    </span>

                    {/* Operator Badge */}
                    {pch.operatorName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                        <User className="w-2.5 h-2.5" />
                        Petugas: {pch.operatorName}
                      </span>
                    )}
                  </div>

                  {/* Right: Amounts & Quick Review Action */}
                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200/60">
                    <div className="text-left md:text-right">
                      <div className="font-extrabold text-slate-900 text-sm">
                        {formatRupiah(pch.totalAmount)}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        Biaya Kulakan Masuk
                      </div>
                    </div>

                    <button
                      id={`btn-review-pch-${pch.id}`}
                      onClick={() => setSelectedTx({ type: 'PURCHASE', data: pch })}
                      className="p-2 rounded-xl bg-white hover:bg-amber-50 text-slate-600 hover:text-amber-800 border border-slate-200 hover:border-amber-300 transition flex items-center gap-1 text-[11px] font-bold"
                      title="Review Rincian Transaksi"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Review</span>
                    </button>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>

      {/* Navigation Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
        <button
          id="btn-nav-to-sales"
          onClick={() => onNavigate('pos')}
          className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 transition"
        >
          <span>Lihat Semua Riwayat Penjualan Kasir</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          id="btn-nav-to-purchases"
          onClick={() => onNavigate('purchase')}
          className="font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 transition"
        >
          <span>Lihat Semua Riwayat Pembelian Kulakan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Review Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${
                    selectedTx.type === 'SALE' ? 'bg-emerald-700' : 'bg-amber-600'
                  }`}
                >
                  {selectedTx.type === 'SALE' ? (
                    <ShoppingCart className="w-5 h-5" />
                  ) : (
                    <Truck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {selectedTx.type === 'SALE' ? 'Penjualan Kasir (Keluar)' : 'Pembelian Kulakan (Masuk)'}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {selectedTx.data.invoiceNumber}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Badges & Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Tanggal</span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {formatDateIndo(selectedTx.data.date, true)}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">
                  {selectedTx.type === 'SALE' ? 'Pelanggan' : 'Supplier'}
                </span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">
                  {selectedTx.type === 'SALE'
                    ? (selectedTx.data as Sale).customerName || 'Umum'
                    : (selectedTx.data as Purchase).supplierName}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Pembayaran</span>
                <span className="font-bold text-slate-800 text-[11px]">
                  {selectedTx.data.paymentMethod}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Operator Bertugas</span>
                <span className="font-bold text-slate-800 text-[11px] truncate block">
                  {selectedTx.type === 'SALE'
                    ? (selectedTx.data as Sale).cashierName || 'Kasir'
                    : (selectedTx.data as Purchase).operatorName || 'Gudang'}
                </span>
              </div>
            </div>

            {/* Items Breakdown Table */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Rincian Barang</span>
                <span>{selectedTx.data.items.length} macam barang</span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-semibold">Nama Barang</th>
                      <th className="p-2.5 text-center font-semibold">Qty</th>
                      <th className="p-2.5 text-right font-semibold">Harga</th>
                      <th className="p-2.5 text-right font-semibold">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedTx.type === 'SALE'
                      ? (selectedTx.data as Sale).items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5">
                              <span className="font-bold text-slate-900 block">{item.productName}</span>
                              <span className="text-[10px] text-slate-400">
                                Modal: {formatRupiah(item.costPrice)} | Laba: +{formatRupiah(item.profit)}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-semibold">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-2.5 text-right text-slate-600">
                              {formatRupiah(item.sellPrice)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))
                      : (selectedTx.data as Purchase).items.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50">
                            <td className="p-2.5 font-bold text-slate-900">{item.productName}</td>
                            <td className="p-2.5 text-center font-semibold">
                              {item.quantity} {item.unit}
                            </td>
                            <td className="p-2.5 text-right text-slate-600">
                              {formatRupiah(item.costPrice)}
                            </td>
                            <td className="p-2.5 text-right font-bold text-slate-900">
                              {formatRupiah(item.subtotal)}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary Card */}
            {selectedTx.type === 'SALE' ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Modal HPP Barang:</span>
                  <span>{formatRupiah((selectedTx.data as Sale).totalCost)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total Penjualan (Omzet):</span>
                  <span className="font-bold text-slate-900">{formatRupiah((selectedTx.data as Sale).totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5 border-t border-emerald-200 font-bold">
                  <span className="text-emerald-900">KEUNTUNGAN (LABA BERSIH):</span>
                  <span className="text-base text-emerald-700">
                    +{formatRupiah((selectedTx.data as Sale).totalProfit)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Jumlah Macam Barang Masuk:</span>
                  <span>{(selectedTx.data as Purchase).items.length} item</span>
                </div>
                <div className="flex justify-between items-baseline pt-1.5 border-t border-amber-200 font-bold">
                  <span className="text-amber-900">TOTAL BIAYA KULAKAN:</span>
                  <span className="text-base text-amber-900">
                    {formatRupiah((selectedTx.data as Purchase).totalAmount)}
                  </span>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  setSelectedTx(null);
                  if (selectedTx.type === 'SALE') {
                    onNavigate('pos');
                  } else {
                    onNavigate('purchase');
                  }
                }}
                className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-1.5 ${
                  selectedTx.type === 'SALE'
                    ? 'bg-emerald-700 hover:bg-emerald-600'
                    : 'bg-amber-600 hover:bg-amber-500'
                }`}
              >
                <span>Buka di Halaman {selectedTx.type === 'SALE' ? 'Kasir' : 'Kulakan'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
