import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Check,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Expense, ExpenseCategory } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

export const ExpensesView: React.FC = () => {
  const { expenses, addExpense, deleteExpense } = useStore();

  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<ExpenseCategory>('PLASTIK_PACKING');
  const [amount, setAmount] = useState<number>(50000);
  const [description, setDescription] = useState<string>('');

  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const categories: { id: ExpenseCategory; label: string }[] = [
    { id: 'LISTRIK_AIR', label: 'Listrik & Air (PLN & PDAM)' },
    { id: 'PLASTIK_PACKING', label: 'Plastik Kresek, Karet & Tali' },
    { id: 'BENSIN_TRANSPORT', label: 'Bensin & Transportasi Kulakan' },
    { id: 'GAJI_KARYAWAN', label: 'Gaji Karyawan / Penjaga Toko' },
    { id: 'SEWA_TEMPAT', label: 'Sewa Tempat / Kios Toko' },
    { id: 'MAKAN_KONSUMSI', label: 'Makan & Konsumsi Toko' },
    { id: 'PERAWATAN_TOKO', label: 'Perawatan & Perbaikan Toko' },
    { id: 'LAINNYA', label: 'Beban Lain-lain' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Jumlah biaya harus lebih dari Rp 0');
      return;
    }

    const catObj = categories.find((c) => c.id === category);
    addExpense({
      date,
      category,
      categoryLabel: catObj ? catObj.label : 'Biaya Toko',
      amount,
      description: description.trim() || catObj?.label || 'Pengeluaran operasional',
    });

    setDescription('');
    setAmount(25000);
  };

  // Filter expenses for selected month
  const filteredExpenses = expenses.filter((exp) => {
    const d = new Date(exp.date);
    return d.getFullYear() === selectedYear && d.getMonth() + 1 === selectedMonth;
  });

  const totalMonthlyExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-emerald-600" />
            <span>Biaya Operasional Toko Sembako</span>
          </h1>
          <p className="text-sm text-slate-500">
            Catat pengeluaran rutin (listrik, kantong plastik, bensin kulakan, gaji) agar laporan laba bersih dihitung akurat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Input Biaya (5 cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 sticky top-20"
          >
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Tambah Pengeluaran Baru</span>
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pengeluaran
              </label>
              <input
                id="input-expense-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Kategori Biaya
              </label>
              <select
                id="select-expense-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jumlah Biaya (Rp)
              </label>
              <input
                id="input-expense-amount"
                type="number"
                step="1000"
                min="1000"
                required
                value={amount}
                onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Deskripsi / Keterangan
              </label>
              <input
                id="input-expense-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Beli kresek uk. 24 dua pak & rafia 1 rol"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <button
              id="btn-submit-expense"
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Biaya Operasional</span>
            </button>
          </form>
        </div>

        {/* Tabel Daftar Pengeluaran (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Riwayat Biaya Operasional</h2>
                <p className="text-xs text-slate-500">Semua pengeluaran yang memotong laba kotor toko</p>
              </div>

              {/* Month Selector */}
              <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none"
                >
                  {[
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
                  ].map((m) => (
                    <option key={m.num} value={m.num}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="bg-transparent text-slate-800 font-semibold focus:outline-none ml-1"
                >
                  <option value={2026}>2026</option>
                  <option value={2025}>2025</option>
                </select>
              </div>
            </div>

            {/* Total Expense Highlight */}
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-between">
              <div>
                <span className="text-xs text-rose-800 font-semibold block">Total Beban Operasional Bulan Ini</span>
                <span className="text-xl font-extrabold text-rose-900">{formatRupiah(totalMonthlyExpenses)}</span>
              </div>
              <span className="text-xs text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full font-bold">
                {filteredExpenses.length} catatan
              </span>
            </div>

            {/* Expenses List */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tanggal</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                    <th className="py-2.5 px-3 text-right">Jumlah</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada catatan pengeluaran di bulan ini.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500">
                          {formatDateIndo(exp.date)}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {exp.categoryLabel}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                          {exp.description}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-red-600 font-mono">
                          {formatRupiah(exp.amount)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Hapus catatan biaya operasional ini?')) {
                                deleteExpense(exp.id);
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
