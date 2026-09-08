import React, { useState } from 'react';
import {
  Download,
  Printer,
  FileSpreadsheet,
  FileText,
  Calendar,
  X,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Building2,
  DollarSign,
  Layers,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface ExportFinancialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportFinancialModal: React.FC<ExportFinancialModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { sales, purchases, expenses, storeInfo } = useStore();

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportType, setReportType] = useState<'ALL' | 'INCOME' | 'EXPENSE'>('ALL');
  const [previewPrintType, setPreviewPrintType] = useState<'INCOME' | 'EXPENSE' | 'ALL' | null>(null);

  if (!isOpen) return null;

  // Filtered transactions for selected period
  const filteredSales = sales.filter((s) => {
    const d = new Date(s.date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const filteredPurchases = purchases.filter((p) => {
    const d = new Date(p.date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const filteredExpenses = expenses.filter((e) => {
    const d = new Date(e.date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const totalIncomeRevenue = filteredSales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const totalIncomeProfit = filteredSales.reduce((acc, s) => acc + s.totalProfit, 0);

  const totalPurchaseExpense = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalOperationalExpense = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
  const totalAllExpense = totalPurchaseExpense + totalOperationalExpense;

  const netCashflow = totalIncomeRevenue - totalAllExpense;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonthName = monthNames[selectedMonth - 1];

  // ==========================================
  // 1. EXCEL EXPORT FUNCTIONS (.CSV UTF-8 BOM)
  // ==========================================
  const triggerDownload = (csvContent: string, fileName: string) => {
    // Add UTF-8 BOM so Excel opens accents and symbols cleanly
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export Pemasukan (Penjualan Kasir)
  const exportIncomeExcel = () => {
    const lines = [
      `LAPORAN PEMASUKAN KAS - ${storeInfo.name.toUpperCase()}`,
      `Periode: ${currentMonthName} ${selectedYear}`,
      `Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`,
      ``,
      `No,No Invoice,Tanggal,Pelanggan,Kasir/Operator,Metode Bayar,Total Omzet (Rp),Modal HPP (Rp),Laba Bersih (Rp),Rincian Barang`,
    ];

    filteredSales.forEach((s, idx) => {
      const itemsSummary = s.items
        .map((it) => `${it.productName} (${it.quantity} ${it.unit})`)
        .join('; ');

      lines.push(
        [
          idx + 1,
          `"${s.invoiceNumber}"`,
          `"${s.date.split('T')[0]}"`,
          `"${s.customerName || 'Pelanggan Umum'}"`,
          `"${s.cashierName || 'Kasir'}"`,
          `"${s.paymentMethod}"`,
          s.totalRevenue,
          s.totalCost,
          s.totalProfit,
          `"${itemsSummary}"`,
        ].join(',')
      );
    });

    lines.push(``);
    lines.push(`TOTAL PEMASUKAN (OMZET),${totalIncomeRevenue}`);
    lines.push(`TOTAL LABA BERSIH PENJUALAN,${totalIncomeProfit}`);

    triggerDownload(
      lines.join('\n'),
      `Pemasukan_${storeInfo.name.replace(/\s+/g, '_')}_${selectedYear}_${selectedMonth}.csv`
    );
  };

  // Export Pengeluaran (Kulakan + Biaya Operasional)
  const exportExpenseExcel = () => {
    const lines = [
      `LAPORAN PENGELUARAN KAS - ${storeInfo.name.toUpperCase()}`,
      `Periode: ${currentMonthName} ${selectedYear}`,
      `Waktu Ekspor: ${new Date().toLocaleString('id-ID')}`,
      ``,
      `--- BAGIAN 1: PENGELUARAN KULAKAN BARANG MASUK (PEMBELIAN STOK) ---`,
      `No,No Nota Pembelian,Tanggal,Supplier/Pabrik,Petugas Input,Metode Bayar,Total Belanja (Rp),Daftar Barang Masuk`,
    ];

    filteredPurchases.forEach((p, idx) => {
      const itemsList = p.items
        .map((it) => `${it.productName} (${it.quantity} ${it.unit} @ Rp ${it.costPrice.toLocaleString('id-ID')})`)
        .join('; ');

      lines.push(
        [
          idx + 1,
          `"${p.invoiceNumber}"`,
          `"${p.date.split('T')[0]}"`,
          `"${p.supplierName}"`,
          `"${p.operatorName || 'Gudang'}"`,
          `"${p.paymentMethod}"`,
          p.totalAmount,
          `"${itemsList}"`,
        ].join(',')
      );
    });

    lines.push(``);
    lines.push(`SUBTOTAL PENGELUARAN KULAKAN,${totalPurchaseExpense}`);
    lines.push(``);
    lines.push(`--- BAGIAN 2: PENGELUARAN BIAYA OPERASIONAL TOKO ---`);
    lines.push(`No,Tanggal,Kategori Biaya,Deskripsi/Keterangan,Petugas Pencatat,Jumlah Biaya (Rp)`);

    filteredExpenses.forEach((exp, idx) => {
      lines.push(
        [
          idx + 1,
          `"${exp.date}"`,
          `"${exp.categoryLabel}"`,
          `"${exp.description}"`,
          `"${exp.recordedBy || 'Admin'}"`,
          exp.amount,
        ].join(',')
      );
    });

    lines.push(``);
    lines.push(`SUBTOTAL BIAYA OPERASIONAL,${totalOperationalExpense}`);
    lines.push(`TOTAL SELURUH PENGELUARAN KAS,${totalAllExpense}`);

    triggerDownload(
      lines.join('\n'),
      `Pengeluaran_${storeInfo.name.replace(/\s+/g, '_')}_${selectedYear}_${selectedMonth}.csv`
    );
  };

  // Export Combined Financial Cashflow (Pemasukan + Pengeluaran)
  const exportAllCashflowExcel = () => {
    const lines = [
      `LAPORAN ARUS KAS LENGKAP (PEMASUKAN & PENGELUARAN)`,
      `TOKO: ${storeInfo.name.toUpperCase()}`,
      `Alamat: ${storeInfo.address}`,
      `Periode: ${currentMonthName} ${selectedYear}`,
      `Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`,
      ``,
      `RINGKASAN ARUS KAS,NOMINAL (RP)`,
      `Total Pemasukan (Omzet Penjualan Kasir),${totalIncomeRevenue}`,
      `Total Pengeluaran Kulakan Barang Masuk,${totalPurchaseExpense}`,
      `Total Pengeluaran Beban Operasional Toko,${totalOperationalExpense}`,
      `TOTAL PENGELUARAN,${totalAllExpense}`,
      `ARUS KAS BERSIH (NET CASHFLOW),${netCashflow}`,
      `ESTIMASI LABA KOTOR PENJUALAN,${totalIncomeProfit}`,
      ``,
      `--- BUKU PEMASUKAN PENJUALAN ---`,
      `Tanggal,No Invoice,Pelanggan,Metode Bayar,Pemasukan (Rp)`,
      ...filteredSales.map((s) => `"${s.date.split('T')[0]}","${s.invoiceNumber}","${s.customerName || 'Umum'}","${s.paymentMethod}",${s.totalRevenue}`),
      ``,
      `--- BUKU PENGELUARAN KULAKAN & BIAYA ---`,
      `Tanggal,Jenis Pengeluaran,Keterangan/Supplier,Pengeluaran (Rp)`,
      ...filteredPurchases.map((p) => `"${p.date.split('T')[0]}","Kulakan Barang Masuk","${p.supplierName} (${p.invoiceNumber})",${p.totalAmount}`),
      ...filteredExpenses.map((e) => `"${e.date}","Biaya Operasional - ${e.categoryLabel}","${e.description}",${e.amount}`),
    ];

    triggerDownload(
      lines.join('\n'),
      `Laporan_Arus_Kas_${storeInfo.name.replace(/\s+/g, '_')}_${selectedYear}_${selectedMonth}.csv`
    );
  };

  // Handle PDF Print
  const handlePrint = (type: 'INCOME' | 'EXPENSE' | 'ALL') => {
    setPreviewPrintType(type);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 text-slate-900 shadow-2xl space-y-6 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Ekspor Data Pemasukan & Pengeluaran
              </h2>
              <p className="text-xs text-slate-500">
                Unduh rekapitulasi keuangan ke format <strong>Excel (.CSV)</strong> atau cetak/simpan ke <strong>PDF</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Period Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-xs">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="font-semibold text-slate-700">Pilih Periode:</span>
            <select
              id="select-export-month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              {monthNames.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              id="select-export-year"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-800"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>

          <div className="text-xs text-slate-500">
            Toko: <span className="font-bold text-slate-800">{storeInfo.name}</span>
          </div>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Pemasukan Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Total Pemasukan
              </span>
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              {formatRupiah(totalIncomeRevenue)}
            </div>
            <div className="text-xs text-emerald-700 mt-1">
              {filteredSales.length} transaksi penjualan kasir
            </div>
          </div>

          {/* Pengeluaran Card */}
          <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Total Pengeluaran
              </span>
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-950 mt-1">
              {formatRupiah(totalAllExpense)}
            </div>
            <div className="text-xs text-rose-700 mt-1">
              Kulakan: {formatRupiah(totalPurchaseExpense)} • Biaya: {formatRupiah(totalOperationalExpense)}
            </div>
          </div>

          {/* Saldo Bersih Card */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Saldo Kas Bersih
              </span>
              <DollarSign className="w-4 h-4 text-slate-600" />
            </div>
            <div
              className={`text-2xl font-black mt-1 ${
                netCashflow >= 0 ? 'text-emerald-800' : 'text-rose-700'
              }`}
            >
              {formatRupiah(netCashflow)}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Pemasukan dikurangi seluruh pengeluaran
            </div>
          </div>
        </div>

        {/* 3 Main Export Action Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Section 1: Pemasukan */}
          <div className="p-5 rounded-2xl border border-emerald-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4" />
                <span>1. Laporan Pemasukan</span>
              </div>
              <p className="text-xs text-slate-500">
                Seluruh catatan penjualan barang keluar, harga jual, laba bersih, nama kasir, dan pelanggan.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={exportIncomeExcel}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel Pemasukan (.csv)</span>
              </button>
              <button
                onClick={() => handlePrint('INCOME')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Section 2: Pengeluaran */}
          <div className="p-5 rounded-2xl border border-rose-200 bg-white shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-sm">
                <FileSpreadsheet className="w-4 h-4" />
                <span>2. Laporan Pengeluaran</span>
              </div>
              <p className="text-xs text-slate-500">
                Kulakan barang masuk ke supplier dan biaya operasional toko (listrik, plastik karung, bensin, gaji).
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={exportExpenseExcel}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Excel Pengeluaran (.csv)</span>
              </button>
              <button
                onClick={() => handlePrint('EXPENSE')}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF</span>
              </button>
            </div>
          </div>

          {/* Section 3: Gabungan / Cashflow */}
          <div className="p-5 rounded-2xl border border-blue-200 bg-blue-50/40 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>3. Rekap Lengkap (Arus Kas)</span>
              </div>
              <p className="text-xs text-slate-600">
                Rekap komprehensif pemasukan vs pengeluaran sekaligus untuk laporan pertanggungjawaban pemilik toko.
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={exportAllCashflowExcel}
                className="w-full py-2 px-3 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh Semua Rekap (Excel)</span>
              </button>
              <button
                onClick={() => handlePrint('ALL')}
                className="w-full py-2 px-3 rounded-xl bg-white border border-blue-200 hover:bg-blue-50 text-blue-800 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / Simpan PDF Rekap</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[11px] text-slate-500 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between">
          <span>
            💡 Format Excel (.CSV UTF-8) dapat langsung dibuka di Microsoft Excel, Google Sheets, dan WPS Office tanpa teks rusak.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-slate-700 transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
