import React, { useState } from 'react';
import {
  Truck,
  Plus,
  Trash2,
  Check,
  PackagePlus,
  AlertCircle,
  Building,
  Tag,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ProductCategory, Purchase } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface PurchaseDraftItem {
  productId?: string;
  productName: string;
  category: ProductCategory;
  unit: string;
  quantity: number;
  costPrice: number;
  updateMasterCost: boolean;
}

const CATEGORIES: ProductCategory[] = [
  'Beras & Biji',
  'Minyak & Mentega',
  'Gula & Bumbu',
  'Telur & Segar',
  'Mie & Makanan Instan',
  'Minuman & Susu',
  'Kebutuhan Rumah',
  'Gas & Galon',
  'Lain-lain',
];

const COMMON_UNITS = ['sak', 'kg', 'dus', 'pcs', 'bal', 'jerigen', 'pack', 'liter', 'ikat'];

export const PurchaseFormView: React.FC = () => {
  const { products, recordPurchase, purchases, deletePurchase, currentUser } = useStore();

  const [supplierName, setSupplierName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Purchase['paymentMethod']>('TUNAI');
  const [notes, setNotes] = useState('');
  const [draftItems, setDraftItems] = useState<PurchaseDraftItem[]>([]);

  // Category selection as requested: input barangnya tanpa nama hardcode, input nama barang dilakukan oleh pengguna (owner), tambahkan pilihan kategori
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Beras & Biji');
  const [inputProductName, setInputProductName] = useState<string>('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [inputUnit, setInputUnit] = useState<string>('sak');
  const [addQty, setAddQty] = useState<number>(10);
  const [addCost, setAddCost] = useState<number>(0);
  const [updateMaster, setUpdateMaster] = useState<boolean>(true);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filter products by currently selected category for suggestions
  const productsInCategory = products.filter((p) => p.category === selectedCategory);

  // When owner picks an existing product suggestion
  const handleSelectExistingSuggestion = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSelectedProductId(prod.id);
      setInputProductName(prod.name);
      setInputUnit(prod.unit);
      setAddCost(prod.costPrice);
    }
  };

  // When owner types product name manually
  const handleProductNameChange = (value: string) => {
    setInputProductName(value);
    // Check if typed name matches an existing product
    const match = products.find(
      (p) => p.name.trim().toLowerCase() === value.trim().toLowerCase()
    );
    if (match) {
      setSelectedProductId(match.id);
      setSelectedCategory(match.category);
      setInputUnit(match.unit);
      if (addCost === 0) setAddCost(match.costPrice);
    } else {
      setSelectedProductId('');
    }
  };

  const handleAddItemToDraft = () => {
    const trimmedName = inputProductName.trim();
    if (!trimmedName) {
      alert('Masukkan nama barang yang dikulak terlebih dahulu.');
      return;
    }
    if (addQty <= 0) {
      alert('Jumlah barang masuk harus lebih dari 0.');
      return;
    }
    if (addCost <= 0) {
      alert('Harga beli modal satuan harus lebih dari Rp 0.');
      return;
    }

    const existingIndex = draftItems.findIndex(
      (it) => it.productName.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex >= 0) {
      setDraftItems((prev) =>
        prev.map((it, idx) =>
          idx === existingIndex
            ? {
                ...it,
                quantity: it.quantity + addQty,
                costPrice: addCost,
                unit: inputUnit,
                category: selectedCategory,
                updateMasterCost: updateMaster,
              }
            : it
        )
      );
    } else {
      setDraftItems((prev) => [
        ...prev,
        {
          productId: selectedProductId || undefined,
          productName: trimmedName,
          category: selectedCategory,
          unit: inputUnit.trim() || 'pcs',
          quantity: addQty,
          costPrice: addCost,
          updateMasterCost: updateMaster,
        },
      ]);
    }

    // Reset input fields
    setInputProductName('');
    setSelectedProductId('');
    setAddQty(10);
    setAddCost(0);
  };

  const removeItemFromDraft = (index: number) => {
    setDraftItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const totalPurchaseAmount = draftItems.reduce(
    (acc, it) => acc + it.costPrice * it.quantity,
    0
  );

  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (draftItems.length === 0) {
      setErrorMessage('Tambahkan minimal satu barang ke dalam daftar kulakan.');
      return;
    }
    if (!supplierName.trim()) {
      setErrorMessage('Isi nama supplier / tempat kulakan.');
      return;
    }

    const result = recordPurchase({
      supplierName: supplierName.trim(),
      paymentMethod,
      items: draftItems,
      notes: notes.trim(),
    });

    if (result.success) {
      setSuccessMessage('Barang masuk berhasil dicatat! Stok barang toko telah bertambah.');
      setErrorMessage(null);
      setDraftItems([]);
      setSupplierName('');
      setNotes('');
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(result.error || 'Gagal mencatat pembelian.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Truck className="w-6 h-6 text-amber-600" />
          <span>Catat Pembelian & Barang Masuk (Kulakan)</span>
        </h1>
        <p className="text-sm text-slate-500">
          Input barang belanja sembako dari distributor/pasar induk dengan pilihan kategori. Stok barang dan harga modal otomatis terupdate.
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
          <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Entry Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Tambah Item Kulakan (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <PackagePlus className="w-5 h-5 text-amber-600" />
              <span>Input Barang Masuk</span>
            </h2>

            <div className="space-y-4">
              {/* Pilihan Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pilihan Kategori:</span>
                </label>
                <select
                  id="select-purchase-category"
                  value={selectedCategory}
                  onChange={(e) => {
                    const newCat = e.target.value as ProductCategory;
                    setSelectedCategory(newCat);
                    // Adjust default unit according to category
                    if (newCat === 'Beras & Biji') setInputUnit('sak');
                    else if (newCat === 'Minyak & Mentega') setInputUnit('dus');
                    else if (newCat === 'Telur & Segar') setInputUnit('kg');
                    else if (newCat === 'Gas & Galon') setInputUnit('tabung');
                    else setInputUnit('pcs');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Input Nama Barang (dilakukan oleh pengguna/owner) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Nama Barang <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="input-product-name"
                    type="text"
                    value={inputProductName}
                    onChange={(e) => handleProductNameChange(e.target.value)}
                    placeholder="Ketik nama barang yang dikulak (contoh: Beras Ramos 25kg)..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Quick suggestions from existing products in chosen category */}
                {productsInCategory.length > 0 && (
                  <div className="mt-2">
                    <span className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      Pilih cepat dari barang yang pernah ada di kategori ini:
                    </span>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                      {productsInCategory.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectExistingSuggestion(p.id)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border transition text-left font-medium ${
                            inputProductName.toLowerCase() === p.name.toLowerCase()
                              ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Satuan, Jumlah, dan Harga Modal */}
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Satuan Barang:
                    </label>
                    <input
                      id="input-purchase-unit"
                      type="text"
                      value={inputUnit}
                      onChange={(e) => setInputUnit(e.target.value)}
                      placeholder="sak / kg / dus / pcs"
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {COMMON_UNITS.slice(0, 5).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setInputUnit(u)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100/70 text-amber-900 hover:bg-amber-200 font-medium"
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jumlah Masuk ({inputUnit || 'unit'}):
                    </label>
                    <input
                      id="input-purchase-qty"
                      type="number"
                      min="1"
                      value={addQty}
                      onChange={(e) => setAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Harga Beli / Modal (Rp):
                    </label>
                    <input
                      id="input-purchase-cost"
                      type="number"
                      step="500"
                      value={addCost}
                      onChange={(e) => setAddCost(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 gap-2 border-t border-amber-200/60">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateMaster}
                      onChange={(e) => setUpdateMaster(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span>Perbarui harga modal utama di katalog</span>
                  </label>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">Subtotal Item:</span>
                    <span className="font-bold text-amber-900 text-sm">
                      {formatRupiah(addQty * addCost)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-add-item-draft"
                  onClick={handleAddItemToDraft}
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambahkan ke Nota Kulakan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tabel Draft Barang Masuk */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Daftar Barang Masuk (Nota Ini)</span>
              <span className="text-xs font-normal text-slate-500">
                {draftItems.length} macam barang
              </span>
            </h2>

            {draftItems.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                Belum ada barang yang ditambahkan ke nota kulakan.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {draftItems.map((item, idx) => {
                  const subtotal = item.costPrice * item.quantity;

                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{item.productName}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            {item.category}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          {item.quantity} {item.unit} x {formatRupiah(item.costPrice)}
                          {item.updateMasterCost && (
                            <span className="ml-2 text-emerald-700 font-medium">
                              (Update Modal Master)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{formatRupiah(subtotal)}</span>
                        <button
                          type="button"
                          onClick={() => removeItemFromDraft(idx)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Informasi Supplier & Submit (5 cols) */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleSubmitPurchase}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4 sticky top-20"
          >
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building className="w-5 h-5 text-amber-600" />
              <span>Informasi Kulakan & Supplier</span>
            </h2>

            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-amber-50/60 border border-amber-200/80">
              <span className="text-amber-800 font-medium">Dicatat Oleh:</span>
              <span className="font-bold text-slate-900">
                {currentUser ? currentUser.name : 'Via'} (Owner)
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Supplier / Toko Kulakan <span className="text-red-500">*</span>
              </label>
              <input
                id="input-supplier-name"
                type="text"
                required
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Contoh: Agen Sembako Makmur, Pasar Induk"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Metode Pembayaran Kulakan
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {(['TUNAI', 'TRANSFER', 'TEMPO'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`py-2 rounded-lg font-medium border text-center transition ${
                      paymentMethod === method
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Catatan / Keterangan Nota
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="No. nota supplier, jatuh tempo, dsb (opsional)..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Total Pembelian Card */}
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Total Barang Masuk:</span>
                <span className="font-semibold">{draftItems.length} item</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-amber-200 text-slate-900">
                <span className="font-bold">TOTAL BIAYA KULAKAN:</span>
                <span className="text-lg font-extrabold text-amber-900">
                  {formatRupiah(totalPurchaseAmount)}
                </span>
              </div>
            </div>

            <button
              id="btn-submit-purchase"
              type="submit"
              disabled={draftItems.length === 0 || !supplierName.trim()}
              className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan & Tambah Stok Masuk</span>
            </button>
          </form>
        </div>
      </div>

      {/* Daftar Riwayat Kulakan Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mt-8">
        <h2 className="text-base font-bold text-slate-900 mb-3">Riwayat Pembelian & Kulakan Terakhir</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Nota</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Dicatat Oleh</th>
                <th className="py-2.5 px-3">Supplier / Toko</th>
                <th className="py-2.5 px-3">Barang Masuk</th>
                <th className="py-2.5 px-3">Metode</th>
                <th className="py-2.5 px-3 text-right">Total Biaya Kulakan</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {purchases.map((pch) => (
                <tr key={pch.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{pch.invoiceNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateIndo(pch.date, true)}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {pch.operatorName || 'Via (Owner)'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{pch.supplierName}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                    {pch.items.map((it) => `${it.productName} (+${it.quantity} ${it.unit})`).join(', ')}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {pch.paymentMethod}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatRupiah(pch.totalAmount)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => {
                        if (confirm(`Hapus nota pembelian ${pch.invoiceNumber}? Stok barang masuk akan ditarik kembali.`)) {
                          deletePurchase(pch.id);
                        }
                      }}
                      className="p-1 text-slate-400 hover:text-red-600 rounded"
                      title="Hapus Pembelian"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
