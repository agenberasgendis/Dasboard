import React, { useState } from 'react';
import {
  ArrowLeftRight,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Download,
  Calendar,
  Package,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MovementType } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

export const StockMovementsView: React.FC = () => {
  const { stockMovements, products, storeInfo } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');

  const filteredMovements = stockMovements.filter((m) => {
    const matchesSearch =
      m.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.referenceId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.notes && m.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.operatorName && m.operatorName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    const matchesProduct = productFilter === 'ALL' || m.productId === productFilter;

    return matchesSearch && matchesType && matchesProduct;
  });

  const totalInQty = stockMovements
    .filter((m) => m.type === 'IN' || m.type === 'ADJUST_PLUS')
    .reduce((acc, m) => acc + m.quantity, 0);

  const totalOutQty = stockMovements
    .filter((m) => m.type === 'OUT' || m.type === 'ADJUST_MINUS')
    .reduce((acc, m) => acc + m.quantity, 0);

  const handleExportCSV = () => {
    const headers = [
      'No',
      'Tanggal',
      'No Referensi',
      'Tipe Mutasi',
      'Nama Barang',
      'Jumlah',
      'Satuan',
      'Harga Modal Satuan (Rp)',
      'Total Nilai (Rp)',
      'Dicatat Oleh',
      'Keterangan',
    ];

    const rows = filteredMovements.map((m, idx) => [
      idx + 1,
      formatDateIndo(m.date, true),
      m.referenceId,
      m.type,
      `"${m.productName}"`,
      m.quantity,
      m.unit,
      m.unitCostPrice,
      m.totalAmount,
      `"${m.operatorName || 'Via'}"`,
      `"${m.notes || '-'}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `arus-barang-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  const renderBadge = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <ArrowUpRight className="w-3 h-3" />
            <span>Masuk (Kulakan)</span>
          </span>
        );
      case 'OUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownRight className="w-3 h-3" />
            <span>Keluar (Terjual)</span>
          </span>
        );
      case 'ADJUST_PLUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <RotateCcw className="w-3 h-3" />
            <span>Koreksi (+)</span>
          </span>
        );
      case 'ADJUST_MINUS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <RotateCcw className="w-3 h-3" />
            <span>Koreksi (-)</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ArrowLeftRight className="w-6 h-6 text-emerald-600" />
            <span>Arus Beras & Mutasi Stok</span>
          </h1>
          <p className="text-sm text-slate-500">
            Riwayat komprehensif keluar-masuk beras dan sembako (penjualan, kulakan, dan opname stok).
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs transition"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Mutasi CSV</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-xs font-semibold text-slate-500 block">Total Mutasi Tercatat</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {stockMovements.length} <span className="text-xs text-slate-400 font-normal">riwayat</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
          <span className="text-xs font-bold text-blue-700 block">Total Barang Masuk (Kulakan)</span>
          <span className="text-2xl font-bold text-blue-900 mt-1 block">
            +{totalInQty} <span className="text-xs text-blue-600 font-normal">unit</span>
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 block">Total Barang Keluar (Terjual)</span>
          <span className="text-2xl font-bold text-emerald-900 mt-1 block">
            -{totalOutQty} <span className="text-xs text-emerald-600 font-normal">unit</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama barang, no nota, keterangan..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">Semua Jenis Mutasi</option>
            <option value="IN">Hanya Barang Masuk (Kulakan)</option>
            <option value="OUT">Hanya Barang Keluar (Penjualan)</option>
            <option value="ADJUST_PLUS">Koreksi Tambah (+)</option>
            <option value="ADJUST_MINUS">Koreksi Kurang (-)</option>
          </select>

          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 max-w-[200px] truncate"
          >
            <option value="ALL">Semua Barang</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3.5 px-4">Waktu</th>
                <th className="py-3.5 px-4">No. Ref</th>
                <th className="py-3.5 px-4">Jenis Mutasi</th>
                <th className="py-3.5 px-4">Nama Barang</th>
                <th className="py-3.5 px-4 text-right">Jumlah</th>
                <th className="py-3.5 px-4 text-right">Harga Modal</th>
                <th className="py-3.5 px-4 text-right">Total Nilai</th>
                <th className="py-3.5 px-4">Dicatat Oleh</th>
                <th className="py-3.5 px-4">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada riwayat mutasi barang yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {formatDateIndo(m.date, true)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {m.referenceId}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderBadge(m.type)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {m.productName}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                      {m.type === 'IN' || m.type === 'ADJUST_PLUS' ? '+' : '-'}
                      {m.quantity} {m.unit}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-600 whitespace-nowrap">
                      {formatRupiah(m.unitCostPrice)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatRupiah(m.totalAmount)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {m.operatorName || 'Via'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-[200px] truncate" title={m.notes}>
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
