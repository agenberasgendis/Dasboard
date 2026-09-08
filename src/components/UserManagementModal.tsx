import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  Lock,
  User,
  Mail,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { AppUser, UserRole } from '../types';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; color: string }[] = [
  {
    role: 'OWNER',
    label: 'Pemilik Toko (Owner)',
    description: 'Akses penuh ke seluruh fitur, laporan laba rugi, neraca, dan kontrol data.',
    color: 'bg-emerald-600',
  },
  {
    role: 'KASIR',
    label: 'Kasir Penjualan',
    description: 'Akses kasir barang keluar, cetak struk nota, katalog harga, dan cek stok.',
    color: 'bg-blue-600',
  },
  {
    role: 'GUDANG',
    label: 'Petugas Gudang & Masuk',
    description: 'Akses pencatatan kulakan beras masuk, penyesuaian stok fisik, dan mutasi.',
    color: 'bg-amber-600',
  },
];

export const UserManagementModal: React.FC<UserManagementModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, currentUser, addUser, updateUser, deleteUser } = useStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    pin: string;
  }>({
    name: '',
    email: '',
    role: 'KASIR',
    pin: '',
  });

  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const togglePinVisibility = (userId: string) => {
    setVisiblePins((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleOpenAddForm = () => {
    setEditingUserId(null);
    setFormData({
      name: '',
      email: '',
      role: 'KASIR',
      pin: '',
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (user: AppUser) => {
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      pin: user.pin,
    });
    setErrorMessage('');
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingUserId(null);
    setErrorMessage('');
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!formData.name.trim()) {
      setErrorMessage('Nama lengkap pengguna wajib diisi.');
      return;
    }
    if (!formData.email.trim()) {
      setErrorMessage('Username atau Email akun wajib diisi.');
      return;
    }
    if (!formData.pin.trim() || formData.pin.trim().length < 4) {
      setErrorMessage('PIN akses wajib minimal 4 digit angka.');
      return;
    }

    const selectedRoleMeta = ROLE_OPTIONS.find((r) => r.role === formData.role) || ROLE_OPTIONS[0];

    if (editingUserId) {
      // Update existing
      const res = updateUser(editingUserId, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        roleLabel: selectedRoleMeta.label,
        avatarColor: selectedRoleMeta.color,
        pin: formData.pin.trim(),
      });

      if (res.success) {
        setSuccessMessage('Data pengguna berhasil diperbarui!');
        setIsFormOpen(false);
        setEditingUserId(null);
      } else {
        setErrorMessage(res.message || 'Gagal memperbarui pengguna.');
      }
    } else {
      // Add new
      const res = addUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        roleLabel: selectedRoleMeta.label,
        avatarColor: selectedRoleMeta.color,
        pin: formData.pin.trim(),
      });

      if (res.success) {
        setSuccessMessage('Pengguna baru berhasil ditambahkan!');
        setIsFormOpen(false);
        setEditingUserId(null);
      } else {
        setErrorMessage(res.message || 'Gagal menambahkan pengguna baru.');
      }
    }
  };

  const handleDelete = (user: AppUser) => {
    if (confirm(`Yakin ingin menghapus pengguna "${user.name}" (${user.email})? Tindakan ini tidak dapat dibatalkan.`)) {
      const res = deleteUser(user.id);
      if (res.success) {
        setSuccessMessage(`Pengguna "${user.name}" berhasil dihapus.`);
      } else {
        alert(res.message || 'Gagal menghapus pengguna.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 text-slate-900 shadow-2xl space-y-5 my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Kelola Pengguna & Kontrol Akun
              </h2>
              <p className="text-xs text-slate-500">
                Atur username, peran (Owner/Kasir/Gudang), dan PIN akses petugas toko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback notifications */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Body / Scrollable Content */}
        <div className="overflow-y-auto space-y-5 pr-1 grow">
          {/* Quick Explanation Banner */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-slate-800 block">Cara Kontrol Hak Akses Toko:</span>
              <p>
                Setiap petugas dapat masuk dengan <strong>Username/Email</strong> atau cukup mengetikkan <strong>4 digit PIN Akses</strong> saat membuka kasir.
                Pemilik (Owner) dapat menambah kasir baru, mengganti PIN, atau menonaktifkan akun sewaktu-waktu.
              </p>
            </div>
          </div>

          {/* Form Add / Edit */}
          {isFormOpen ? (
            <form
              onSubmit={handleSubmitForm}
              className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4 shadow-2xs"
            >
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-600" />
                  <span>{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Petugas */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Petugas / Pengguna *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Contoh: Via (Kasir)"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Username / Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Username / Email Login *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Contoh: rizal atau kasir1@toko.id"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Peran & Hak Akses *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.role} value={opt.role}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PIN Akses */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    PIN Akses (Minimal 4 Digit) *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      maxLength={6}
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="Contoh: 1234 atau 5678"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role explanation */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-[11px] text-slate-500">
                <strong>Deskripsi Akses:</strong>{' '}
                {ROLE_OPTIONS.find((r) => r.role === formData.role)?.description}
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCloseForm}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white shadow-xs transition"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Daftar Petugas Aktif ({users.length} Akun)
              </span>
              <button
                id="btn-add-new-user"
                onClick={handleOpenAddForm}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Tambah Pengguna Baru</span>
              </button>
            </div>
          )}

          {/* User List Cards */}
          <div className="space-y-3">
            {users.map((user) => {
              const isCurrent = currentUser?.id === user.id;
              const isPinVisible = visiblePins[user.id] || false;

              return (
                <div
                  key={user.id}
                  className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-300/40'
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  {/* Left: Avatar & Info */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-2xl text-white font-black text-base flex items-center justify-center shadow-xs shrink-0 ${user.avatarColor}`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{user.name}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[10px] font-extrabold tracking-wide">
                            Akun Aktif Anda
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{user.roleLabel}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-600">Username: {user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: PIN indicator & Actions */}
                  <div className="flex items-center gap-3 self-end sm:self-center">
                    {/* PIN badge */}
                    <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl text-xs font-mono">
                      <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-slate-600 font-bold">
                        {isPinVisible ? user.pin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePinVisibility(user.id)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 transition ml-0.5"
                        title={isPinVisible ? 'Sembunyikan PIN' : 'Tampilkan PIN'}
                      >
                        {isPinVisible ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditForm(user)}
                        className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                        title="Edit Akun"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        disabled={isCurrent || users.length <= 1}
                        onClick={() => handleDelete(user)}
                        className={`p-2 rounded-xl transition ${
                          isCurrent || users.length <= 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-rose-500 hover:text-rose-700 hover:bg-rose-50'
                        }`}
                        title={
                          isCurrent
                            ? 'Tidak bisa menghapus akun yang sedang aktif'
                            : users.length <= 1
                            ? 'Minimal harus ada 1 pengguna'
                            : 'Hapus Akun'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 pt-3 flex justify-between items-center shrink-0">
          <span className="text-[11px] text-slate-400">
            Perubahan otomatis tersimpan dan masuk dalam cadangan Google Drive.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
