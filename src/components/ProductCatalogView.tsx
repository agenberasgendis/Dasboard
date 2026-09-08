import React, { useState } from 'react';
import {
  PackageCheck,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Sliders,
  TrendingUp,
  X,
  Check,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductCategory } from '../types';
import { formatRupiah } from '../utils/formatters';

export const ProductCatalogView: React.FC = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustStock } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('Semua');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | 'NORMAL' | 'LOW' | 'OUT'>('ALL');

  // Add/Edit Product Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Beras & Biji' as ProductCategory,
    unit: 'kg',
    stock: 20,
    minStock: 5,
    costPrice: 10000,
    sellPrice: 12000,
  });

  // Adjust Stock Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [newStockQty, setNewStockQty] = useState(0);
  const [adjustReason, setAdjustReason] = useState('Stock opname rutin');

  const categories: ProductCategory[] = [
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

  const commonUnits = ['kg', 'liter', 'pouch', 'pcs', 'dus', 'renceng', 'sak', 'tabung', 'galon', 'botol', 'kaleng', 'bantal'];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'Semua' || p.category === categoryFilter;

    let matchesStock = true;
    if (stockStatusFilter === 'LOW') {
      matchesStock = p.stock > 0 && p.stock <= p.minStock;
    } else if (stockStatusFilter === 'OUT') {
      matchesStock = p.stock <= 0;
    } else if (stockStatusFilter === 'NORMAL') {
      matchesStock = p.stock > p.minStock;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // Open modal for new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: `SBK-${(products.length + 1).toString().padStart(2, '0')}`,
      name: '',
      category: 'Beras & Biji',
      unit: 'kg',
      stock: 10,
      minStock: 5,
      costPrice: 10000,
      sellPrice: 12500,
    });
    setIsModalOpen(true);
  };

  // Open modal for edit product
  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      unit: p.unit,
      stock: p.stock,
      minStock: p.minStock,
      costPrice: p.costPrice,
      sellPrice: p.sellPrice,
    });
    setIsModalOpen(true);
  };

  // Save product (add or edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama produk tidak boleh kosong.');
      return;
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        sku: formData.sku,
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        minStock: formData.minStock,
        costPrice: formData.costPrice,
        sellPrice: formData.sellPrice,
      });
    } else {
      addProduct({
        sku: formData.sku,
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        stock: formData.stock,
        minStock: formData.minStock,
        costPrice: formData.costPrice,
        sellPrice: formData.sellPrice,
      });
    }

    setIsModalOpen(false);
  };

  // Open adjust stock modal
  const handleOpenAdjust = (p: Product) => {
    setAdjustingProduct(p);
    setNewStockQty(p.stock);
    setAdjustReason('Stock opname fisik toko');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    adjustStock(adjustingProduct.id, newStockQty, adjustReason);
    setIsAdjustModalOpen(false);
  };

  // Live profit calculation in form
  const modalProfitRp = formData.sellPrice - formData.costPrice;
  const modalMarginPct = formData.sellPrice > 0 ? (modalProfitRp / formData.sellPrice) * 100 : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <PackageCheck className="w-6 h-6 text-emerald-600" />
            <span>Katalog Master Sembako, Stok & Harga</span>
          </h1>
          <p className="text-sm text-slate-500">
            Kelola data barang sembako, harga modal (kulakan), harga jual eceran, margin keuntungan, dan stok opname.
          </p>
        </div>

        <button
          id="btn-add-product"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Produk Baru</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama barang atau kode produk..."
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Stock Status Buttons */}
          <div className="flex items-center gap-1.5 text-xs overflow-x-auto">
            <button
              onClick={() => setStockStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                stockStatusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua ({products.length})
            </button>
            <button
              onClick={() => setStockStatusFilter('LOW')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                stockStatusFilter === 'LOW'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              Menipis
            </button>
            <button
              onClick={() => setStockStatusFilter('OUT')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                stockStatusFilter === 'OUT'
                  ? 'bg-red-600 text-white'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              Habis (0)
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setCategoryFilter('Semua')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
              categoryFilter === 'Semua'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua Kategori
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                categoryFilter === cat
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Kode</th>
                <th className="py-3 px-3.5">Nama Produk Sembako</th>
                <th className="py-3 px-3.5">Kategori</th>
                <th className="py-3 px-3.5 text-center">Stok Fisik</th>
                <th className="py-3 px-3.5 text-right">Harga Modal (Beli)</th>
                <th className="py-3 px-3.5 text-right">Harga Jual</th>
                <th className="py-3 px-3.5 text-right">Untung / Unit</th>
                <th className="py-3 px-3.5 text-center">Margin</th>
                <th className="py-3 px-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Tidak ada produk yang cocok dengan pencarian atau filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const profitUnit = product.sellPrice - product.costPrice;
                  const marginPct = product.sellPrice > 0 ? (profitUnit / product.sellPrice) * 100 : 0;
                  const isLow = product.stock > 0 && product.stock <= product.minStock;
                  const isOut = product.stock <= 0;

                  return (
                    <tr key={product.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3.5 font-mono text-slate-500 font-bold">{product.sku}</td>
                      <td className="py-3 px-3.5">
                        <div className="font-bold text-slate-900">{product.name}</div>
                        <div className="text-[11px] text-slate-400">Min. Stok: {product.minStock} {product.unit}</div>
                      </td>
                      <td className="py-3 px-3.5 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                          {product.category}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                            isOut
                              ? 'bg-red-100 text-red-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono text-slate-600">
                        {formatRupiah(product.costPrice)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatRupiah(product.sellPrice)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-emerald-700">
                        +{formatRupiah(profitUnit)}
                      </td>
                      <td className="py-3 px-3.5 text-center font-semibold text-slate-700">
                        {marginPct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAdjust(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                            title="Sesuaikan Stok Fisik (Stock Opname)"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            title="Edit Data & Harga"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Hapus produk ${product.name}?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900">
                {editingProduct ? 'Edit Produk & Harga Sembako' : 'Tambah Produk Sembako Baru'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kode / Barcode</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Barang Sembako <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: Beras Ramos 5kg, Minyak 2L"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as ProductCategory })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="kg, liter, sak, dus, pcs"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Stok Awal</label>
                    <input
                      type="number"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                )}
                <div className={editingProduct ? 'col-span-2' : ''}>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Batas Minimum Stok (Peringatan Tipis)
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) =>
                      setFormData({ ...formData, minStock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Price & Live Margin Calculator */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Harga Modal Beli (Rp)
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={formData.costPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, costPrice: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Harga Jual Eceran (Rp)
                    </label>
                    <input
                      type="number"
                      step="500"
                      value={formData.sellPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, sellPrice: parseInt(e.target.value) || 0 })
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-emerald-700"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                  <span className="font-semibold">Kalkulasi Untung per {formData.unit}:</span>
                  <div className="text-right">
                    <span className="font-bold text-sm text-emerald-800">
                      +{formatRupiah(modalProfitRp)}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      Margin: {modalMarginPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-bold text-base text-slate-900">
                Penyesuaian Stok (Stock Opname)
              </h2>
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjust} className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-slate-900 text-sm">{adjustingProduct.name}</div>
                <div className="text-slate-500 mt-1">
                  Stok di Sistem Sekarang: <span className="font-bold">{adjustingProduct.stock} {adjustingProduct.unit}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jumlah Stok Fisik Sebenarnya ({adjustingProduct.unit}):
                </label>
                <input
                  type="number"
                  required
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  Selisih: {newStockQty - adjustingProduct.stock > 0 ? '+' : ''}
                  {newStockQty - adjustingProduct.stock} {adjustingProduct.unit}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alasan Penyesuaian:</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Barang rusak, bocor, opname fisik akhir bulan"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-xs"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
