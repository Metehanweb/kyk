import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiClient } from '../api/client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, refreshProfile } = useAuth();
  const { themeMode, setThemeMode } = useTheme();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Sistem Yöneticisi (Super Admin)';
      case 'MANAGER': return 'Yurt Müdürü';
      case 'STAFF': return 'Görevli Personel / Teknisyen';
      case 'STUDENT': return 'Öğrenci';
      default: return 'Kullanıcı';
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Update password / profile endpoint if password provided
      if (newPassword.trim()) {
        await apiClient.put(`/admin/users/${user.id}`, {
          password: newPassword.trim(),
          phone: phone.trim() || null,
        });
      }
      setSuccessMsg('Ayarlarınız başarıyla güncellendi.');
      setNewPassword('');
      setConfirmPassword('');
      refreshProfile();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Güncelleme sırasında bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#1e293b] text-[#111c2d] dark:text-[#f8fafc] rounded-3xl shadow-2xl border border-[#e7eeff] dark:border-[#334155] p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-[#00236f] dark:bg-[#3b82f6] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">settings</span>
            </span>
            <div>
              <h2 className="font-heading font-extrabold text-base text-[#111c2d] dark:text-white">
                Kullanıcı & Sistem Ayarları
              </h2>
              <p className="text-[10px] text-[#757682] dark:text-[#94a3b8]">Profil tercihleri ve tema ayarları</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-[#334155] text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Theme Preference Selection */}
        <div className="flex flex-col gap-2 bg-[#f8fafc] dark:bg-[#0f172a] p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b]">
          <label className="font-heading font-bold text-xs text-[#0f172a] dark:text-white flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00236f] dark:text-[#3b82f6]">palette</span>
            <span>Görünüm Modu (Tema)</span>
          </label>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setThemeMode('light')}
              className={`p-3 rounded-xl border font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                themeMode === 'light'
                  ? 'bg-[#00236f] text-white border-[#00236f] shadow-md'
                  : 'bg-white dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] border-[#e2e8f0] dark:border-[#334155] hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">light_mode</span>
              <span>Açık Tema</span>
            </button>

            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              className={`p-3 rounded-xl border font-heading font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
                themeMode === 'dark'
                  ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-md'
                  : 'bg-white dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] border-[#e2e8f0] dark:border-[#334155] hover:bg-gray-50'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">dark_mode</span>
              <span>Karanlık Tema</span>
            </button>
          </div>
        </div>

        {/* User Info Overview */}
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] p-3.5 rounded-2xl border border-[#e2e8f0] dark:border-[#1e293b] flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748b] dark:text-[#94a3b8]">
            Hesap Bilgileriniz
          </span>
          <div className="flex flex-col gap-1 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#1e293b]">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Ad Soyad:</span>
              <span className="font-bold text-[#0f172a] dark:text-white">{user.full_name}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#1e293b]">
              <span className="text-gray-500 dark:text-gray-400 font-medium">Rol:</span>
              <span className="font-bold text-[#00236f] dark:text-[#3b82f6]">{getRoleLabel(user.role)}</span>
            </div>
            {user.block && (
              <div className="flex justify-between py-1 border-b border-gray-200 dark:border-[#1e293b]">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Yurt Bloğu:</span>
                <span className="font-bold text-[#0f172a] dark:text-white">{user.block.name}</span>
              </div>
            )}
            {user.room_number && (
              <div className="flex justify-between py-1">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Oda Numarası:</span>
                <span className="font-bold text-[#0f172a] dark:text-white">Oda {user.room_number}</span>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Password / Phone Update Form */}
        <form onSubmit={handleSaveSettings} className="flex flex-col gap-3">
          <h3 className="font-heading font-bold text-xs text-[#0f172a] dark:text-white pt-1">
            Güvenlik & Şifre Güncelleme
          </h3>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#334155] dark:text-[#cbd5e1]">Telefon Numarası</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="h-10 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-xs font-semibold outline-none focus:border-[#00236f] dark:focus:border-[#3b82f6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#334155] dark:text-[#cbd5e1]">Yeni Şifre</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni Şifreniz"
                className="h-10 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-xs font-semibold outline-none focus:border-[#00236f] dark:focus:border-[#3b82f6]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#334155] dark:text-[#cbd5e1]">Şifre Tekrar</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni Şifre Tekrar"
                className="h-10 px-3 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] text-xs font-semibold outline-none focus:border-[#00236f] dark:focus:border-[#3b82f6]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-[#334155]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white"
            >
              Kapat
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-[#00236f] dark:bg-[#3b82f6] text-white text-xs font-heading font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
