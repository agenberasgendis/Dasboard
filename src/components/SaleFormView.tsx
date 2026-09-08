import React, { useState } from 'react';
import {
  ShoppingCart,
  Search,
  Plus,
  Minus,
  Trash2,
  Check,
  Printer,
  FileText,
  User,
  CreditCard,
  TrendingUp,
  Tag,
  AlertCircle,
  LogOut,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductCategory, Sale } from '../types';
import { formatRupiah, formatDateIndo } from '../utils/formatters';

interface CartItem {
  product: Product;
  quantity: number;
  sellPrice: number;
}

export const SaleFormView: React.FC = () => {
  const { products, recordSale, sales, deleteSale, currentUser, storeInfo, logout } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('TUNAI');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<Sale | null>(null);

  const categories: string[] = [
    'Semua',
    'Beras & Biji',
    'Minyak & Mentega',
    'Gula & Bumbu',
    'Telur & Segar',
    'Mie & Makanan Instan',
    'Minuman & Susu',
    'Gas & Galon',
    'Kebutuhan Rumah',
  ];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Add to cart
  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok ${product.name} saat ini kosong (0 ${product.unit}). Silakan kulakan terlebih dahulu.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert(`Jumlah melebihi stok yang tersedia (${product.stock} ${product.unit}).`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prev, { product, quantity: 1, sellPrice: product.sellPrice }];
      }
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.stock) {
              alert(`Maksimal stok tersedia adalah ${item.product.stock} ${item.product.unit}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updatePrice = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, sellPrice: Math.max(0, newPrice) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Cart totals & profits
  const totalRevenue = cart.reduce((acc, item) => acc + item.sellPrice * item.quantity, 0);
  const totalCost = cart.reduce(
    (acc, item) => acc + item.product.costPrice * item.quantity,
    0
  );
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Submit sale
  const handleSubmitSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      setErrorMessage('Keranjang belanja masih kosong.');
      return;
    }

    const items = cart.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      sellPrice: item.sellPrice,
    }));

    const result = recordSale({
      customerName: customerName.trim() || 'Pembeli Umum',
      paymentMethod,
      items,
      notes: notes.trim(),
    });

    if (result.success) {
      setSuccessMessage('Transaksi penjualan berhasil dicatat dan stok barang otomatis dikurangi!');
      setErrorMessage(null);
      setCart([]);
      setCustomerName('');
      setNotes('');
      // Find latest sale to offer receipt
      const createdSale = sales.find((s) => s.id === result.saleId);
      if (createdSale) {
        setSelectedReceipt(createdSale);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } else {
      setErrorMessage(result.error || 'Gagal menyimpan transaksi.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-emerald-600" />
            <span>Kasir Penjualan (Barang Keluar)</span>
          </h1>
          <p className="text-sm text-slate-500">
            Catat penjualan harian toko sembako, kurangi stok otomatis, dan lihat laba langsung per transaksi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-semibold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <User className="w-3.5 h-3.5 text-emerald-700" />
            <span>Owner: <strong className="font-bold text-emerald-950">{currentUser?.name || 'Via'}</strong></span>
          </div>
          <button
            id="btn-switch-cashier"
            onClick={logout}
            title="Keluar / Kunci Akun"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Keluar</span>
          </button>
        </div>
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

      {/* Grid: Kiri Katalog Sembako, Kanan Keranjang Kasir & Hitung Laba */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Katalog Sembako (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            {/* Search & Category Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="input-pos-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari beras, minyak, gula, telur, gas, mie, atau kode..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition font-medium ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const inCart = cart.find((it) => it.product.id === product.id);
              const marginRp = product.sellPrice - product.costPrice;
              const marginPct = (marginRp / product.sellPrice) * 100;
              const isLowStock = product.stock <= product.minStock && product.stock > 0;
              const isOutOfStock = product.stock <= 0;

              return (
                <div
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className={`p-3.5 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : inCart
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400'
                      : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-xs'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {product.sku || product.category}
                      </span>
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isOutOfStock
                            ? 'bg-red-100 text-red-700'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isOutOfStock ? 'Habis' : `Stok: ${product.stock} ${product.unit}`}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm mt-2 line-clamp-2">
                      {product.name}
                    </h3>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Harga Jual</span>
                        <span className="font-bold text-emerald-700 text-base">
                          {formatRupiah(product.sellPrice)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block">
                          Modal: {formatRupiah(product.costPrice)}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          Untung: +{formatRupiah(marginRp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Keranjang & Kalkulasi Laba (5 cols) */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-5 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-slate-900">Keranjang Kasir</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-red-600 hover:text-red-700 font-medium"
                >
                  Kosongkan
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                Keranjang masih kosong. Klik barang di samping untuk mulai transaksi penjualan.
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {cart.map((item) => {
                  const itemCostTotal = item.product.costPrice * item.quantity;
                  const itemRevenueTotal = item.sellPrice * item.quantity;
                  const itemProfit = itemRevenueTotal - itemCostTotal;

                  return (
                    <div
                      key={item.product.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-bold text-slate-900">{item.product.name}</div>
                          <div className="text-[11px] text-slate-500">
                            Modal: {formatRupiah(item.product.costPrice)} / {item.product.unit}
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2.5 font-bold text-slate-900">
                            {item.quantity} {item.product.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="px-2 py-1 text-slate-600 hover:bg-slate-100"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Subtotal & Profit */}
                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-sm">
                            {formatRupiah(itemRevenueTotal)}
                          </div>
                          <div className="text-[11px] text-emerald-700 font-semibold">
                            Laba: +{formatRupiah(itemProfit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Live Profit Calculation Card */}
            {cart.length > 0 && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Total Penjualan (Omzet):</span>
                  <span className="font-bold text-slate-900 text-sm">{formatRupiah(totalRevenue)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>Total Modal Terjual (HPP):</span>
                  <span className="font-semibold text-slate-700">{formatRupiah(totalCost)}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-emerald-200 text-emerald-900">
                  <span className="font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Laba Langsung Transaksi Ini:
                  </span>
                  <div className="text-right">
                    <span className="font-extrabold text-base text-emerald-800">
                      +{formatRupiah(totalProfit)}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">
                      Margin: {profitMargin.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Active Cashier & Customer & Payment Form */}
            <form onSubmit={handleSubmitSale} className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 font-medium">Kasir Bertugas:</span>
                <span className="font-bold text-slate-900">
                  {currentUser ? currentUser.name : 'Kasir Toko'} ({currentUser?.roleLabel || 'Operator'})
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Pelanggan / Keterangan
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-pos-customer"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Ibu Ani, Warung Bu Siti, Langganan"
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['TUNAI', 'TRANSFER', 'QRIS', 'KASBON'] as const).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 rounded-lg font-medium border text-center transition ${
                        paymentMethod === method
                          ? 'bg-slate-900 text-white border-slate-900 font-bold'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan (opsional)..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                id="btn-pos-checkout"
                type="submit"
                disabled={cart.length === 0}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Keluarkan Barang & Simpan Penjualan</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Riwayat Penjualan Terbaru */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Riwayat Penjualan Terakhir</h2>
            <p className="text-xs text-slate-500">Semua transaksi penjualan keluar & keuntungan yang diperoleh</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">No. Nota</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Kasir</th>
                <th className="py-2.5 px-3">Pelanggan</th>
                <th className="py-2.5 px-3">Barang Terjual</th>
                <th className="py-2.5 px-3 text-right">Omzet</th>
                <th className="py-2.5 px-3 text-right">Modal (HPP)</th>
                <th className="py-2.5 px-3 text-right">Laba Bersih</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-900">{sale.invoiceNumber}</td>
                  <td className="py-2.5 px-3 text-slate-500">{formatDateIndo(sale.date, true)}</td>
                  <td className="py-2.5 px-3">
                    <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      {sale.cashierName || 'Kasir'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{sale.customerName}</td>
                  <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                    {sale.items.map((it) => `${it.productName} (${it.quantity} ${it.unit})`).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                    {formatRupiah(sale.totalRevenue)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-500">
                    {formatRupiah(sale.totalCost)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                    +{formatRupiah(sale.totalProfit)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setSelectedReceipt(sale)}
                        className="p-1 text-slate-500 hover:text-emerald-600 rounded"
                        title="Lihat Nota"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Batalkan dan hapus transaksi ${sale.invoiceNumber}? Stok barang akan dikembalikan.`)) {
                            deleteSale(sale.id);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-red-600 rounded"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Nota / Struk Pop-up Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="text-center border-b border-slate-200 pb-3">
              <h2 className="font-black text-lg text-slate-900 tracking-tight">{storeInfo.name.toUpperCase()}</h2>
              <p className="text-xs text-slate-500">{storeInfo.tagline}</p>
              <p className="text-[11px] text-slate-400">{storeInfo.address} • Telp: {storeInfo.phone}</p>
              <div className="text-xs text-slate-600 mt-1.5 font-mono font-bold">
                {selectedReceipt.invoiceNumber} • {formatDateIndo(selectedReceipt.date, true)}
              </div>
            </div>

            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir / Operator:</span>
                <span className="font-bold text-slate-900">{selectedReceipt.cashierName || currentUser?.name || 'Kasir'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pembayaran:</span>
                <span className="font-semibold text-slate-800">{selectedReceipt.paymentMethod}</span>
              </div>
            </div>

            {/* Items */}
            <div className="border-t border-b border-slate-200 py-3 space-y-2 text-xs">
              {selectedReceipt.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-semibold text-slate-900">{item.productName}</div>
                  <div className="flex justify-between text-slate-500">
                    <span>
                      {item.quantity} {item.unit} x {formatRupiah(item.sellPrice)}
                    </span>
                    <span className="font-bold text-slate-800">{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Total & Profit Calculation */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-sm font-bold text-slate-900">
                <span>TOTAL BELANJA:</span>
                <span>{formatRupiah(selectedReceipt.totalRevenue)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Modal Pokok (HPP):</span>
                <span>{formatRupiah(selectedReceipt.totalCost)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg">
                <span>KEUNTUNGAN BERSIH:</span>
                <span>+{formatRupiah(selectedReceipt.totalProfit)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
