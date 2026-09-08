import React, { useState } from 'react';
import {
  KeyRound,
  Store,
  LogIn,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface LoginViewProps {
  onLoginSuccess?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const { currentUser, login, logout, storeInfo } = useStore();
  const [usernameInput, setUsernameInput] = useState('via');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!usernameInput.trim() && !passwordInput.trim()) {
      setErrorMessage('Silakan masukkan Username dan Password / PIN.');
      return;
    }

    const res = login(usernameInput.trim() || passwordInput.trim(), passwordInput.trim() || undefined);
    if (res.success) {
      if (onLoginSuccess) onLoginSuccess();
    } else {
      setErrorMessage(res.message || 'Login gagal. Periksa kembali username atau password/PIN.');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-8 sm:py-12 px-4">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide shadow-2xs">
          <Store className="w-4 h-4 text-emerald-600" />
          <span>Sistem Manajemen Toko & Kasir</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          {storeInfo.name}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Akses Pemilik Toko (Owner: Via)
        </p>
      </div>

      {/* Login Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-5">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            <span>Masuk Akun Owner</span>
          </h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            Owner: Via
          </span>
        </div>

        {currentUser && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl text-white font-black text-base flex items-center justify-center shadow-xs ${currentUser.avatarColor || 'bg-emerald-600'}`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                  Sedang Masuk
                </div>
                <div className="font-bold text-slate-900 text-sm">{currentUser.name}</div>
                <div className="text-xs text-slate-600">{currentUser.roleLabel || 'Owner (Pemilik Toko)'}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-emerald-200/80">
              <button
                onClick={() => onLoginSuccess && onLoginSuccess()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Buka Aplikasi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-red-600 text-xs font-semibold transition"
              >
                Keluar
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleFormLogin} className="space-y-4">
          {/* Username Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Username Owner
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="input-user-username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="via"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>

          {/* Password / PIN Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password / PIN
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Sembunyikan' : 'Tampilkan'}</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                id="input-user-password"
                type={showPassword ? 'text' : 'password'}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Masukkan PIN / Password"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMessage}
            </div>
          )}

          <button
            id="btn-submit-login"
            type="submit"
            className="w-full py-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm shadow-xs transition flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk ke Sistem</span>
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Akses Khusus Pemilik Toko (Via)</span>
        </div>
      </div>
    </div>
  );
};
