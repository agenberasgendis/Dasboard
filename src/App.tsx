import React, { useState } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Navbar, TabType } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SaleFormView } from './components/SaleFormView';
import { PurchaseFormView } from './components/PurchaseFormView';
import { StockMovementsView } from './components/StockMovementsView';
import { ProfitLossReportView } from './components/ProfitLossReportView';
import { ProductCatalogView } from './components/ProductCatalogView';
import { ExpensesView } from './components/ExpensesView';
import { LoginView } from './components/LoginView';
import { ExportFinancialModal } from './components/ExportFinancialModal';
import { GoogleDriveSyncModal } from './components/GoogleDriveSyncModal';

export function AppContent() {
  const { currentUser, storeInfo } = useStore();
  const [activeTab, setActiveTab] = useState<TabType>('pos');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);

  // If user is not logged in, render the Login View dashboard
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
        <main className="flex-1 flex items-center justify-center p-4">
          <LoginView onLoginSuccess={() => setActiveTab('pos')} />
        </main>
        <footer className="border-t border-slate-200/80 bg-white py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4">
            <span className="font-bold text-slate-800">{storeInfo.name}</span> • {storeInfo.tagline} • Sistem POS & Laba Rugi Otomatis
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickSale={() => setActiveTab('pos')}
        onOpenQuickPurchase={() => setActiveTab('purchase')}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenGoogleDriveModal={() => setIsGoogleDriveModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => setActiveTab(tab)}
            onOpenSale={() => setActiveTab('pos')}
            onOpenPurchase={() => setActiveTab('purchase')}
            onOpenExportModal={() => setIsExportModalOpen(true)}
            onOpenGoogleDriveModal={() => setIsGoogleDriveModalOpen(true)}
          />
        )}

        {activeTab === 'pos' && <SaleFormView />}

        {activeTab === 'purchase' && <PurchaseFormView />}

        {activeTab === 'movements' && <StockMovementsView />}

        {activeTab === 'profit-loss' && (
          <ProfitLossReportView onOpenExportModal={() => setIsExportModalOpen(true)} />
        )}

        {activeTab === 'products' && <ProductCatalogView />}

        {activeTab === 'expenses' && <ExpensesView />}

        {activeTab === 'login' && (
          <LoginView onLoginSuccess={() => setActiveTab('dashboard')} />
        )}
      </main>

      {/* Export Pemasukan / Pengeluaran Modal (Excel & PDF) */}
      <ExportFinancialModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Google Drive Cloud Sync Modal */}
      <GoogleDriveSyncModal
        isOpen={isGoogleDriveModalOpen}
        onClose={() => setIsGoogleDriveModalOpen(false)}
      />

      {/* Subtle Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-4 mt-auto text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">{storeInfo.name}</span>
            <span>• Agen Beras & Kebutuhan Sembako</span>
          </div>
          <div className="text-slate-400">
            Owner: <span className="font-semibold text-slate-700">{currentUser.name}</span> • Sistem Toko Aktif
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
