import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  Printer,
  Download,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  PieChart,
  DollarSign,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { calculateMonthlyProfitLoss } from '../utils/calculations';
import { formatRupiah, formatPercent } from '../utils/formatters';

interface ProfitLossReportViewProps {
  onOpenExportModal?: () => void;
}

export const ProfitLossReportView: React.FC<ProfitLossReportViewProps> = ({ onOpenExportModal }) => {
  const { sales, purchases, expenses, storeInfo } = useStore();

  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

  const report = calculateMonthlyProfitLoss(
    sales,
    purchases,
    expenses,
    selectedYear,
    selectedMonth
  );

  const months = [
    { num: 1, name: 'Januari' },
    { num: 2, name: 'Februari' },
    { num: 3, name: 'Maret' },
    { num: 4, name: 'April' },
    { num: 5, name: 'Mei' },
    { num: 6, name: 'Juni' },
    { num: 7, name: 'Juli' },
    { num: 8, name: 'Agustus' },
    { num: 9, name: 'September' },
    { num: 10, name: 'Oktober' },
    { num: 11, name: 'November' },
    { num: 12, name: 'Desember' },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const lines = [
      `LAPORAN LABA RUGI BULANAN - ${storeInfo.name.toUpperCase()}`,
      `Alamat: ${storeInfo.address} • Telp: ${storeInfo.phone}`,
      `Periode: ${report.monthName} ${report.year}`,
      `Dicetak Pada: ${new Date().toLocaleString('id-ID')}`,
      ``,
      `KOMPONEN KEUANGAN,NOMINAL (RP)`,
      `1. PENDAPATAN (OMZET),${report.totalRevenue}`,
      `2. HARGA POKOK PENJUALAN (HPP),${report.totalCOGS}`,
      `LABA KOTOR,${report.grossProfit}`,
      `Persentase Margin Kotor,${report.grossProfitMargin.toFixed(2)}%`,
      ``,
      `RINCIAN BIAYA OPERASIONAL,`,
      ...report.expenseCategories.map((e) => `"${e.label}",${e.amount}`),
      `TOTAL BIAYA OPERASIONAL,${report.totalExpenses}`,
      ``,
      `LABA BERSIH BULANAN,${report.netProfit}`,
      `Persentase Margin Bersih,${report.netProfitMargin.toFixed(2)}%`,
      ``,
      `PRODUK TERLARIS & LABA KONTRIBUSI`,
      `Nama Produk,Jumlah Terjual,Satuan,Total Penjualan,Total Modal,Laba Bersih Produk,Margin %`,
      ...report.topProducts.map(
        (p) =>
          `"${p.productName}",${p.qtySold},"${p.unit}",${p.revenue},${p.cost},${p.profit},${p.marginPercent.toFixed(1)}%`
      ),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + lines.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laba-rugi-sembako-${selectedYear}-${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header with Month/Year Selection & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 no-print">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
            <span>Laporan Laba Rugi Bulanan Otomatis</span>
          </h1>
          <p className="text-sm text-slate-500">
            Kalkulasi otomatis dari seluruh penjualan, modal pokok sembako yang terjual (HPP), dan beban operasional toko.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Month/Year Filter */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-xs text-xs">
            <Calendar className="w-4 h-4 text-slate-400" />
            <select
              id="select-pnl-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer"
            >
              {months.map((m) => (
                <option key={m.num} value={m.num}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              id="select-pnl-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-transparent text-slate-800 font-bold focus:outline-none cursor-pointer border-l border-slate-200 pl-1.5"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          {onOpenExportModal && (
            <button
              id="btn-open-export-modal"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor Excel & PDF</span>
            </button>
          )}

          <button
            id="btn-print-pnl"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>

          <button
            id="btn-export-pnl-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Formal Printable Statement Container */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Printable Header */}
        <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-emerald-600 no-print" />
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                {storeInfo.name.toUpperCase()}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {storeInfo.address} • Telp: {storeInfo.phone} • {storeInfo.tagline}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-bold text-slate-800 uppercase tracking-wider">
              LAPORAN LABA RUGI (PROFIT & LOSS)
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              Periode: {report.monthName} {report.year}
            </div>
          </div>
        </div>

        {/* 4 Key KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              1. Omzet Penjualan
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatRupiah(report.totalRevenue)}
            </div>
            <span className="text-[11px] text-slate-500">{report.totalTransactions} transaksi</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              2. Modal Terjual (HPP)
            </span>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {formatRupiah(report.totalCOGS)}
            </div>
            <span className="text-[11px] text-slate-500">Beban pokok barang</span>
          </div>

          <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200">
            <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
              3. Laba Kotor Toko
            </span>
            <div className="text-xl font-bold text-teal-900 mt-1">
              {formatRupiah(report.grossProfit)}
            </div>
            <span className="text-[11px] text-teal-700 font-semibold">
              Margin {report.grossProfitMargin.toFixed(1)}%
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-100 border border-emerald-300">
            <span className="text-[11px] font-extrabold text-emerald-900 uppercase tracking-wider block">
              4. Laba Bersih Akhir
            </span>
            <div className="text-xl font-black text-emerald-950 mt-1">
              {formatRupiah(report.netProfit)}
            </div>
            <span className="text-[11px] text-emerald-800 font-bold">
              Margin Bersih {report.netProfitMargin.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Visual Progress / Composition Bar */}
        {report.totalRevenue > 0 && (
          <div className="space-y-2 no-print bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Struktur Omzet Penjualan 100%:</span>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                  Modal (HPP): {((report.totalCOGS / report.totalRevenue) * 100).toFixed(1)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                  Biaya Toko: {((report.totalExpenses / report.totalRevenue) * 100).toFixed(1)}%
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                  Laba Bersih: {report.netProfitMargin.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full h-4 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${Math.min(100, (report.totalCOGS / report.totalRevenue) * 100)}%` }}
                className="bg-amber-500 h-full"
                title={`HPP Modal: ${formatRupiah(report.totalCOGS)}`}
              ></div>
              <div
                style={{ width: `${Math.min(100, (report.totalExpenses / report.totalRevenue) * 100)}%` }}
                className="bg-rose-500 h-full"
                title={`Biaya Operasional: ${formatRupiah(report.totalExpenses)}`}
              ></div>
              <div
                style={{ width: `${Math.max(0, report.netProfitMargin)}%` }}
                className="bg-emerald-600 h-full"
                title={`Laba Bersih: ${formatRupiah(report.netProfit)}`}
              ></div>
            </div>
          </div>
        )}

        {/* Tabel Laporan Laba Rugi Standar Akuntansi */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
            Rincian Perhitungan Laba Rugi
          </h3>

          <div className="overflow-hidden border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <tbody className="divide-y divide-slate-100">
                {/* 1. PENDAPATAN */}
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="py-2.5 px-4 text-sm" colSpan={2}>
                    I. PENDAPATAN OPERASIONAL (REVENUE)
                  </td>
                  <td className="py-2.5 px-4 text-right text-sm">
                    {formatRupiah(report.totalRevenue)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-6 text-slate-700">Penjualan Sembako & Barang Dagangan</td>
                  <td className="py-2 px-4 text-slate-500">{report.totalTransactions} transaksi</td>
                  <td className="py-2 px-4 text-right font-medium text-slate-800">
                    {formatRupiah(report.totalRevenue)}
                  </td>
                </tr>

                {/* 2. HPP */}
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="py-2.5 px-4 text-sm" colSpan={2}>
                    II. BEBAN POKOK PENJUALAN (HPP / MODAL BARANG TERJUAL)
                  </td>
                  <td className="py-2.5 px-4 text-right text-sm text-red-700">
                    ({formatRupiah(report.totalCOGS)})
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-6 text-slate-700">
                    Total Harga Modal (Beli) dari Seluruh Sembako yang Terjual
                  </td>
                  <td className="py-2 px-4 text-slate-500">Harga beli supplier</td>
                  <td className="py-2 px-4 text-right font-medium text-red-600">
                    ({formatRupiah(report.totalCOGS)})
                  </td>
                </tr>

                {/* LABA KOTOR */}
                <tr className="bg-teal-50/80 font-bold text-teal-950 border-t-2 border-teal-200">
                  <td className="py-3 px-4 text-sm font-extrabold" colSpan={2}>
                    = LABA KOTOR (GROSS PROFIT)
                    <span className="ml-2 text-xs font-semibold text-teal-700">
                      (Margin: {report.grossProfitMargin.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right text-base font-extrabold text-teal-900">
                    {formatRupiah(report.grossProfit)}
                  </td>
                </tr>

                {/* 3. BIAYA OPERASIONAL */}
                <tr className="bg-slate-100 font-bold text-slate-900">
                  <td className="py-2.5 px-4 text-sm" colSpan={2}>
                    III. BEBAN / BIAYA OPERASIONAL TOKO
                  </td>
                  <td className="py-2.5 px-4 text-right text-sm text-red-700">
                    ({formatRupiah(report.totalExpenses)})
                  </td>
                </tr>

                {report.expenseCategories.length === 0 ? (
                  <tr>
                    <td className="py-2 px-6 text-slate-400 italic" colSpan={3}>
                      Belum ada catatan biaya operasional di bulan ini.
                    </td>
                  </tr>
                ) : (
                  report.expenseCategories.map((exp) => (
                    <tr key={exp.category}>
                      <td className="py-2 px-6 text-slate-700">{exp.label}</td>
                      <td className="py-2 px-4 text-slate-500">{exp.percentage.toFixed(1)}% dari total biaya</td>
                      <td className="py-2 px-4 text-right text-red-600 font-medium">
                        ({formatRupiah(exp.amount)})
                      </td>
                    </tr>
                  ))
                )}

                {/* LABA BERSIH AKHIR */}
                <tr className="bg-emerald-100 font-black text-emerald-950 border-t-2 border-b-2 border-emerald-400">
                  <td className="py-3.5 px-4 text-base font-black" colSpan={2}>
                    = LABA BERSIH BULANAN (NET PROFIT TOKO)
                    <span className="ml-2 text-xs font-bold text-emerald-800">
                      (Margin Bersih: {report.netProfitMargin.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right text-lg font-black text-emerald-950">
                    {formatRupiah(report.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Tabel Kontribusi Laba per Produk Sembako */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
            Performa Produk: Kontribusi Laba Penjualan Sembako
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">Nama Produk Sembako</th>
                  <th className="py-2.5 px-3 text-center">Terjual</th>
                  <th className="py-2.5 px-3 text-right">Total Penjualan</th>
                  <th className="py-2.5 px-3 text-right">Total Modal (HPP)</th>
                  <th className="py-2.5 px-3 text-right">Laba yang Didapat</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.topProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      Belum ada produk terjual di bulan ini.
                    </td>
                  </tr>
                ) : (
                  report.topProducts.map((p, idx) => (
                    <tr key={p.productId} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{p.productName}</td>
                      <td className="py-2.5 px-3 text-center font-medium">
                        {p.qtySold} {p.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                        {formatRupiah(p.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {formatRupiah(p.cost)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        +{formatRupiah(p.profit)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                        {p.marginPercent.toFixed(1)}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Breakdown Harian dalam Bulan Tersebut */}
        <div className="space-y-3 no-print">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2">
            Performa Omzet & Laba Harian ({report.monthName} {report.year})
          </h3>
          <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-72">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200 sticky top-0">
                <tr>
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3 text-center">Transaksi</th>
                  <th className="py-2.5 px-3 text-right">Omzet Penjualan</th>
                  <th className="py-2.5 px-3 text-right">Modal HPP</th>
                  <th className="py-2.5 px-3 text-right">Biaya Toko</th>
                  <th className="py-2.5 px-3 text-right">Laba Bersih Harian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.dailyBreakdown.map((row) => (
                  <tr
                    key={row.day}
                    className={`hover:bg-slate-50 transition ${
                      row.revenue > 0 ? 'bg-white' : 'bg-slate-50/40 text-slate-400'
                    }`}
                  >
                    <td className="py-2 px-3 font-semibold">{row.dateString}</td>
                    <td className="py-2 px-3 text-center">{row.txCount || '-'}</td>
                    <td className="py-2 px-3 text-right font-semibold text-slate-900">
                      {row.revenue > 0 ? formatRupiah(row.revenue) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-slate-500">
                      {row.cogs > 0 ? formatRupiah(row.cogs) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right text-red-600">
                      {row.expenses > 0 ? formatRupiah(row.expenses) : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-bold">
                      {row.netProfit > 0 ? (
                        <span className="text-emerald-700">+{formatRupiah(row.netProfit)}</span>
                      ) : row.netProfit < 0 ? (
                        <span className="text-red-700">-{formatRupiah(Math.abs(row.netProfit))}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Signature for Print */}
        <div className="hidden print:block pt-12 text-xs">
          <div className="flex justify-between">
            <div className="text-center w-48">
              <p>Dibuat Oleh,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Admin / Kasir Toko</p>
            </div>
            <div className="text-center w-48">
              <p>Mengetahui,</p>
              <div className="h-16"></div>
              <p className="font-bold underline">Pemilik Toko Sembako</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
