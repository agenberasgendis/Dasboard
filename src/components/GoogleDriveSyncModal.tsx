import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  FileJson,
  Calendar,
  LogOut,
  FolderSync,
  ShieldCheck,
  HardDrive,
  Info,
  Check,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import {
  signInWithGoogleDrive,
  signOutGoogleDrive,
  getDriveAccessToken,
  uploadBackupToDrive,
  listBackupsFromDrive,
  downloadBackupFromDrive,
  GoogleDriveUser,
  DriveBackupFile,
  initGoogleAuth,
} from '../services/googleDrive';
import { formatDateIndo } from '../utils/formatters';

interface GoogleDriveSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoogleDriveSyncModal: React.FC<GoogleDriveSyncModalProps> = ({ isOpen, onClose }) => {
  const { getBackupData, restoreFromBackupData, products, sales, purchases, stockMovements } =
    useStore();

  const [googleUser, setGoogleUser] = useState<GoogleDriveUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  const [backups, setBackups] = useState<DriveBackupFile[]>([]);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Confirmation state for restore (MANDATORY destructive confirmation pattern)
  const [fileToRestore, setFileToRestore] = useState<DriveBackupFile | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Initialize listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, _token) => {
        setGoogleUser(user);
        loadCloudBackups();
      },
      () => {
        // Not connected with in-memory token
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const loadCloudBackups = async () => {
    const token = getDriveAccessToken();
    if (!token) return;

    setIsLoadingBackups(true);
    try {
      const files = await listBackupsFromDrive(token);
      setBackups(files);
    } catch (err: any) {
      console.error('Failed to list backups:', err);
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const result = await signInWithGoogleDrive();
      if (result) {
        setGoogleUser(result.user);
        setStatusMessage({
          type: 'success',
          text: `Berhasil terhubung dengan Google Drive: ${result.user.email}`,
        });
        await loadCloudBackups();
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal menghubungkan Google Drive. Silakan coba lagi.',
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogleDrive();
    setGoogleUser(null);
    setBackups([]);
    setStatusMessage({
      type: 'info',
      text: 'Akun Google Drive berhasil diputuskan.',
    });
  };

  const handleBackupNow = async () => {
    const token = getDriveAccessToken();
    if (!token) {
      setStatusMessage({
        type: 'error',
        text: 'Silakan hubungkan akun Google Drive terlebih dahulu.',
      });
      return;
    }

    setIsSyncing(true);
    setStatusMessage(null);
    try {
      const currentData = getBackupData();
      const res = await uploadBackupToDrive(
        token,
        currentData,
        `Cadangan manual oleh ${googleUser?.email || 'Admin'}`
      );
      setStatusMessage({
        type: 'success',
        text: `Data toko berhasil dicadangkan ke Google Drive (${res.fileName})!`,
      });
      await loadCloudBackups();
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal mencadangkan data ke Google Drive.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConfirmRestore = async () => {
    if (!fileToRestore) return;
    const token = getDriveAccessToken();
    if (!token) return;

    setIsRestoring(true);
    try {
      const backupJson = await downloadBackupFromDrive(token, fileToRestore.id);
      const success = restoreFromBackupData(backupJson);

      if (success) {
        setStatusMessage({
          type: 'success',
          text: `Berhasil memulihkan data dari Google Drive (${fileToRestore.name}). Data toko kini tersinkronisasi!`,
        });
        setFileToRestore(null);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Format data cadangan tidak valid atau rusak.',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Gagal memulihkan cadangan dari Google Drive.',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 text-slate-900 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Sinkronisasi Cloud & Google Drive
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan akun Google untuk backup dan sinkronisasi data toko Agen Beras Gendis.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl text-xs flex items-start gap-2.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border border-rose-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Google Account Section */}
        {!googleUser ? (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-slate-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">
                Belum Terhubung ke Akun Google
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                Anda dapat memilih akun Google apa saja (akun pribadi maupun akun khusus toko) untuk menyimpan folder cadangan otomatis.
              </p>
            </div>

            {/* Official Material Google Sign-in Button */}
            <div className="flex justify-center pt-1">
              <button
                id="btn-google-drive-signin"
                onClick={handleSignIn}
                disabled={isAuthenticating}
                className="inline-flex items-center gap-3 px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 shadow-xs hover:shadow-md transition active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                    <path fill="none" d="M0 0h48v48H0z" />
                  </svg>
                )}
                <span>{isAuthenticating ? 'Menghubungkan...' : 'Sign in with Google'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50/60 border border-emerald-200/90 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-10 h-10 rounded-full border border-emerald-300"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                  {googleUser.displayName?.[0] || 'G'}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <span>{googleUser.displayName || 'Pengguna Google'}</span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] bg-emerald-100 text-emerald-800 font-semibold">
                    <Check className="w-2.5 h-2.5" /> Terhubung
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">{googleUser.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSignIn}
                className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold transition"
                title="Ganti ke akun Google yang lain"
              >
                Ganti Akun
              </button>
              <button
                onClick={handleSignOut}
                className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold transition flex items-center gap-1"
                title="Putuskan sambungan Google Drive"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}

        {/* Data Overview & Cloud Actions */}
        <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                Status Data Toko Lokal
              </span>
              <span className="text-[11px] text-slate-500">
                Data yang tersimpan di browser perangkat saat ini
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[11px]">
              Siap Disinkronkan
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Produk</span>
              <span className="text-sm font-extrabold text-slate-900">{products.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Penjualan</span>
              <span className="text-sm font-extrabold text-slate-900">{sales.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Kulakan</span>
              <span className="text-sm font-extrabold text-slate-900">{purchases.length}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Mutasi Stok</span>
              <span className="text-sm font-extrabold text-slate-900">{stockMovements.length}</span>
            </div>
          </div>

          {/* Backup Action Button */}
          <button
            id="btn-cloud-backup-now"
            onClick={handleBackupNow}
            disabled={!googleUser || isSyncing}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
            <span>
              {isSyncing
                ? 'Sedang Mencadangkan ke Google Drive...'
                : 'Cadangkan Data Toko ke Google Drive Sekarang'}
            </span>
          </button>
        </div>

        {/* Cloud Backups List Section */}
        {googleUser && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <FolderSync className="w-4 h-4 text-blue-600" />
                <span>Riwayat Cadangan di Folder Google Drive</span>
              </div>
              <button
                onClick={loadCloudBackups}
                disabled={isLoadingBackups}
                className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 text-[11px]"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingBackups ? 'animate-spin' : ''}`} />
                <span>Segarkan</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {isLoadingBackups ? (
                <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Memuat file cadangan dari Google Drive...</span>
                </div>
              ) : backups.length === 0 ? (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Belum ada file cadangan di folder Google Drive Anda.
                </div>
              ) : (
                backups.map((file) => (
                  <div
                    key={file.id}
                    className="p-3 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileJson className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-semibold text-slate-800 block truncate">
                          {file.name}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          {formatDateIndo(file.createdTime, true)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setFileToRestore(file)}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] shrink-0 transition flex items-center gap-1"
                    >
                      <CloudDownload className="w-3 h-3" />
                      <span>Pulihkan</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Security & Scope Disclosure Badge */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-start gap-2.5 text-[11px] text-slate-600">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <p>
            Aplikasi hanya mengakses folder khusus yang dibuatnya di Google Drive Anda (
            <em>Agen Beras Gendis - Data Backup & Laporan</em>). File pribadi lainnya di Google Drive Anda
            tetap aman dan tidak dapat diakses.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Destructive Restore Operation */}
      {fileToRestore && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Konfirmasi Pemulihan Data
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin memulihkan data dari file cadangan Google Drive ini?
            </p>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800">{fileToRestore.name}</div>
              <div className="text-slate-500 text-[11px]">
                Dibuat pada: {formatDateIndo(fileToRestore.createdTime, true)}
              </div>
            </div>

            <p className="text-[11px] text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              Perhatian: Data produk, penjualan, kulakan, dan mutasi stok di perangkat saat ini akan digantikan dengan data yang ada di file cadangan tersebut.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setFileToRestore(null)}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={isRestoring}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                {isRestoring ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CloudDownload className="w-3.5 h-3.5" />
                )}
                <span>{isRestoring ? 'Memulihkan Data...' : 'Ya, Pulihkan Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
