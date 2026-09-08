import React, { useState } from 'react';
import {
  Store,
  LayoutDashboard,
  ShoppingCart,
  Truck,
  ArrowLeftRight,
  TrendingUp,
  PackageCheck,
  Receipt,
  RotateCcw,
  Download,
  Upload,
  Menu,
  X,
  FileSpreadsheet,
  LogOut,
  Cloud,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { formatRupiah } from '../utils/formatters';

export type TabType =
  | 'dashboard'
  | 'pos'
  | 'purchase'
  | 'movements'
  | 'profit-loss'
  | 'products'
  | 'expenses'
  | 'login';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenQuickSale: () => void;
  onOpenQuickPurchase: () => void;
  onOpenExportModal: () => void;
  onOpenGoogleDriveModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenExportModal,
  onOpenGoogleDriveModal,
}) => {
  const {
    sales,
    currentUser,
    logout,
    resetToDefaultData,
    exportDataJSON,
    importDataJSON,
    storeInfo,
    isFirebaseConnected,
    firebaseUser,
    loginWithGoogle,
    logoutGoogle,
  } = useStore();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Today's stats calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySales = sales.filter((s) => s.date.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((acc, s) => acc + s.totalRevenue, 0);
  const todayProfit = todaySales.reduce((acc, s) => acc + s.totalProfit, 0);

  const navItems = [
    { id: 'dashboard' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos' as TabType, label: 'Penjualan (Kasir)', icon: ShoppingCart },
    { id: 'purchase' as TabType, label: 'Pembelian (Kulakan)', icon: Truck },
    { id: 'movements' as TabType, label: 'Arus Barang', icon: ArrowLeftRight },
    { id: 'profit-loss' as TabType, label: 'Laba Rugi Bulanan', icon: TrendingUp },
    { id: 'products' as TabType, label: 'Stok & Harga', icon: PackageCheck },
    { id: 'expenses' as TabType, label: 'Biaya Toko', icon: Receipt },
  ];

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = importDataJSON(content);
        if (ok) {
          alert('Data berhasil dipulihkan dari file backup.');
          setShowSettingsModal(false);
        } else {
          alert('Format file cadangan tidak valid.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 no-print">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Logo & Store Info */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer select-none min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 flex-shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <span className="font-black text-base sm:text-lg text-white tracking-tight truncate">
                {storeInfo.name}
              </span>
              <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                Owner: Via
              </span>
            </div>
          </div>

          {/* Quick Metrics & Firebase Status */}
          <div className="hidden xl:flex items-center gap-3 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Omzet Hari Ini:</span>
              <span className="font-bold text-white text-xs">{formatRupiah(todayRevenue)}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700"></div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[11px]">Laba Bersih:</span>
              <span className="font-bold text-emerald-400 text-xs">{formatRupiah(todayProfit)}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-700"></div>
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]" title="Database Firestore Terhubung Real-Time">
              <span className={`w-2 h-2 rounded-full ${isFirebaseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isFirebaseConnected ? 'Firebase Aktif' : 'Firebase Sync'}</span>
            </div>
          </div>

          {/* Actions & User Profile (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Export Excel / PDF */}
            <button
              id="btn-nav-export"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white font-bold text-xs transition shadow-2xs"
              title="Ekspor Laporan Pemasukan & Pengeluaran ke Excel / PDF"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>

            {/* Google Drive Cloud Sync */}
            {onOpenGoogleDriveModal && (
              <button
                id="btn-nav-google-drive"
                onClick={onOpenGoogleDriveModal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 hover:text-white font-semibold text-xs transition border border-slate-700"
                title="Sinkronisasi & Backup Cloud ke Google Drive"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span>Google Drive</span>
              </button>
            )}

            {/* Settings button */}
            <button
              id="btn-nav-settings"
              onClick={() => setShowSettingsModal(true)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="Cadangan Data & Pengaturan Toko"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Active User (Via - Owner) */}
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700/80 text-xs">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  V
                </div>
                <div className="leading-tight text-left">
                  <span className="font-bold text-slate-200 block text-xs">Via</span>
                  <span className="text-[10px] text-emerald-400 block font-medium">Owner</span>
                </div>
              </div>

              {/* Direct Logout / Lock Button */}
              <button
                id="btn-nav-direct-logout"
                onClick={logout}
                title="Keluar / Kunci Kasir"
                className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/80 hover:text-red-300 text-slate-400 border border-slate-700 transition"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile Actions */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              onClick={onOpenExportModal}
              className="px-2.5 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1"
              title="Ekspor Excel / PDF"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Ekspor</span>
            </button>

            <button
              id="btn-mobile-logout"
              onClick={logout}
              title="Keluar"
              className="p-2 bg-slate-800 text-slate-400 rounded-xl"
            >
              <LogOut className="w-4 h-4" />
            </button>

            <button
              id="btn-mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Nav Tabs (Desktop) */}
      <div className="hidden md:block bg-slate-800/60 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5 overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-4 pt-3 pb-5 space-y-2">
          {/* User info on mobile */}
          <div className="p-3 bg-slate-800 rounded-xl text-xs flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                V
              </div>
              <div>
                <span className="font-bold text-white block">{currentUser?.name || 'Via'}</span>
                <span className="text-[10px] text-emerald-400">Owner (Pemilik Toko)</span>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="px-2.5 py-1 bg-red-900/60 text-red-200 text-xs rounded-lg font-semibold"
            >
              Keluar
            </button>
          </div>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium ${
                    isActive
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800 space-y-2">
            {onOpenGoogleDriveModal && (
              <button
                onClick={() => {
                  onOpenGoogleDriveModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2 bg-blue-700/80 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                <Cloud className="w-4 h-4 text-blue-200" />
                <span>Sinkronkan ke Google Drive</span>
              </button>
            )}

            <button
              onClick={() => {
                setShowSettingsModal(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Cadangan & Reset Data</span>
            </button>
          </div>
        </div>
      )}

      {/* Settings / Backup Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">
                Pengaturan Data Toko • {storeInfo.name}
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Kelola cadangan (backup) dan sinkronisasi cloud database toko beras Anda.
            </p>

            {/* Firebase Cloud Card */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Firebase Firestore Cloud
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {isFirebaseConnected ? 'Tersambung' : 'Menghubungkan...'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">
                Data katalog beras, stok gudang, dan transaksi penjualan disinkronkan secara real-time ke Cloud Firebase.
              </p>
              {firebaseUser ? (
                <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                  <span className="text-[11px] text-slate-600 truncate max-w-[200px]">
                    {firebaseUser.email}
                  </span>
                  <button
                    onClick={logoutGoogle}
                    className="text-[11px] text-red-600 hover:underline font-semibold"
                  >
                    Putus Akun Google
                  </button>
                </div>
              ) : (
                <button
                  onClick={loginWithGoogle}
                  className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-1.5 transition"
                >
                  <span>Hubungkan Akun Google Pemilik (Via)</span>
                </button>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={exportDataJSON}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Lengkap (JSON)</span>
              </button>

              <label className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Pulihkan Data dari File JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    if (
                      confirm(
                        'Peringatan: Seluruh data penjualan, stok, dan pembelian akan direset ke sampel awal. Lanjutkan?'
                      )
                    ) {
                      resetToDefaultData();
                      setShowSettingsModal(false);
                    }
                  }}
                  className="w-full py-2 px-3 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Data Toko ke Awal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
