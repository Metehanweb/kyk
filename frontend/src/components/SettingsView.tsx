import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

interface SettingsViewProps {
  setActiveTab: (tab: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ setActiveTab }) => {
  const { user, refreshProfile } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper functions to mask / censor sensitive personal information
  const maskTC = (tc?: string) => {
    if (!tc || tc.length < 11) return '*** *** ** **';
    return `${tc.slice(0, 3)}*****${tc.slice(-2)}`;
  };

  const maskName = (name?: string) => {
    if (!name) return '*** ***';
    return name
      .split(' ')
      .map((part) => (part.length > 1 ? `${part[0]}${'*'.repeat(part.length - 1)}` : part))
      .join(' ');
  };

  const maskPhone = (ph?: string) => {
    if (!ph || ph.length < 10) return '05** *** ** **';
    const digits = ph.replace(/\D/g, '');
    if (digits.length >= 10) {
      return `${digits.slice(0, 4)} *** ** ${digits.slice(-2)}`;
    }
    return '05** *** ** **';
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Sistem Yöneticisi (Super Admin)';
      case 'MANAGER': return 'Yurt Müdürü';
      case 'STAFF': return 'Görevli Personel / Teknisyen';
      case 'STUDENT': return 'Öğrenci Kaydı (GSB)';
      default: return 'Kullanıcı';
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword && newPassword.length < 4) {
      setErrorMsg('Şifre en az 4 karakter olmalıdır.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('Yeni şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (user?.id) {
        await apiClient.put(`/admin/users/${user.id}`, {
          password: newPassword.trim() || undefined,
          phone: phone.trim() || null,
        });
      }
      setSuccessMsg('Hesap ve güvenlik ayarlarınız başarıyla güncellendi.');
      setNewPassword('');
      setConfirmPassword('');
      refreshProfile();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Ayarlar güncellenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 flex flex-col gap-4 sm:gap-6 animate-in fade-in">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#00236f] dark:bg-[#2563eb] text-white flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-[22px]">manage_accounts</span>
          </div>
          <div>
            <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00236f] dark:text-white tracking-tight">
              Hesap & Güvenlik Ayarları
            </h1>
            <p className="text-xs text-[#444651] dark:text-[#94a3b8]">
              Kişisel bilgilerinizi inceleyin ve giriş bilgilerinizi güncelleyin.
            </p>
          </div>
        </div>

        <button
          onClick={() => setActiveTab(user?.role === 'STUDENT' ? 'home' : user?.role === 'ADMIN' ? 'admin-panel' : 'dashboard')}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] border border-[#e7eeff] dark:border-[#334155] hover:bg-gray-50 dark:hover:bg-[#334155] text-xs font-bold transition-all flex items-center gap-1 active:scale-95"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="hidden sm:inline">Geri Dön</span>
        </button>
      </div>

      {/* SECTION 1: Masked / Censored Personal Profile Data Boxes */}
      <section className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 shadow-sm border border-[#e7eeff] dark:border-[#334155] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#006a61] dark:text-emerald-400">shield</span>
            <h2 className="font-heading font-bold text-sm sm:text-base text-[#111c2d] dark:text-white">
              Sistem Kayıtlı Kimlik & Profil Bilgileri
            </h2>
          </div>
        </div>

        <p className="text-xs text-[#757682] dark:text-[#94a3b8] leading-relaxed">
          KVKK ve Bilgi Güvenliği Standartları uyarınca T.C. Kimlik No ve Ad Soyad bilgileriniz sansürlenmiş olarak görüntülenmektedir.
        </p>

        {/* 2x3 Grid of Censored Data Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Card 1: T.C. Kimlik No (Censored) */}
          <div className="p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1e293b] text-[#00236f] dark:text-blue-400 flex items-center justify-center shrink-0 border border-[#e7eeff] dark:border-[#334155]">
                <span className="material-symbols-outlined text-[18px]">badge</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">T.C. Kimlik No</span>
                <span className="font-mono font-bold text-sm text-[#111c2d] dark:text-white tracking-widest">
                  {maskTC(user?.tc_no)}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#64748b]">lock</span>
          </div>

          {/* Card 2: Ad Soyad (Censored) */}
          <div className="p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1e293b] text-[#00236f] dark:text-blue-400 flex items-center justify-center shrink-0 border border-[#e7eeff] dark:border-[#334155]">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Ad Soyad</span>
                <span className="font-heading font-bold text-sm text-[#111c2d] dark:text-white">
                  {maskName(user?.full_name)}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#64748b]">lock</span>
          </div>

          {/* Card 3: Yurt Bloğu */}
          <div className="p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1e293b] text-[#006a61] dark:text-emerald-400 flex items-center justify-center shrink-0 border border-[#e7eeff] dark:border-[#334155]">
                <span className="material-symbols-outlined text-[18px]">apartment</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Yurt Bloğu</span>
                <span className="font-heading font-bold text-sm text-[#111c2d] dark:text-white">
                  {user?.block?.name || 'A İdari Blok'}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#64748b]">verified</span>
          </div>

          {/* Card 4: Oda Numarası */}
          <div className="p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1e293b] text-[#00236f] dark:text-blue-400 flex items-center justify-center shrink-0 border border-[#e7eeff] dark:border-[#334155]">
                <span className="material-symbols-outlined text-[18px]">meeting_room</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Oda Numarası</span>
                <span className="font-heading font-bold text-sm text-[#111c2d] dark:text-white">
                  {user?.room_number ? `Oda ${user.room_number}` : 'Yönetim Birimi'}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#64748b]">verified</span>
          </div>

          {/* Card 5: Telefon Numarası (Censored) */}
          <div className="p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1e293b] text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-[#e7eeff] dark:border-[#334155]">
                <span className="material-symbols-outlined text-[18px]">phone_android</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Kayıtlı Telefon</span>
                <span className="font-mono font-bold text-sm text-[#111c2d] dark:text-white">
                  {maskPhone(user?.phone)}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#64748b]">lock</span>
          </div>

          {/* Card 6: Rol / Yetki Seviyesi */}
          <div className="p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#1e293b] text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 border border-[#e7eeff] dark:border-[#334155]">
                <span className="material-symbols-outlined text-[18px]">admin_panel_settings</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Sistem Rolü</span>
                <span className="font-heading font-bold text-xs text-[#00236f] dark:text-blue-400">
                  {getRoleLabel(user?.role)}
                </span>
              </div>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#64748b]">verified</span>
          </div>
        </div>
      </section>

      {/* SECTION 2: Password Update & Contact Form */}
      <section className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 shadow-sm border border-[#e7eeff] dark:border-[#334155] flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-[#e7eeff] dark:border-[#334155] pb-3">
          <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-blue-400">key</span>
          <h2 className="font-heading font-bold text-sm sm:text-base text-[#111c2d] dark:text-white">
            Güvenlik & Şifre Güncelleme
          </h2>
        </div>

        {/* Feedback Banners */}
        {successMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400">check_circle</span>
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[20px] text-red-600 dark:text-red-400">error</span>
            <span className="font-semibold">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="flex flex-col gap-4 text-xs" autoComplete="off">
          {/* Dummy hidden inputs to trick aggressive browser password auto-fillers */}
          <input type="text" name="prevent_autofill_user" className="hidden" tabIndex={-1} aria-hidden="true" autoComplete="off" />
          <input type="password" name="prevent_autofill_pass" className="hidden" tabIndex={-1} aria-hidden="true" autoComplete="off" />

          <div className="flex flex-col gap-1">
            <label className="font-bold text-[#111c2d] dark:text-white">Telefon Numarasını Güncelle</label>
            <input
              type="tel"
              name="user_new_phone_field"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05XX XXX XX XX"
              autoComplete="off"
              className="h-11 px-3.5 rounded-xl bg-[#f9f9ff] dark:bg-[#0f172a] border border-[#c5c5d3] dark:border-[#334155] text-xs text-[#111c2d] dark:text-white font-semibold outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors"
            />
            <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">Acil bildirimler ve SMS doğrulamaları için kullanılır.</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#111c2d] dark:text-white">Yeni Şifre</label>
              <input
                type="password"
                name="user_new_password_field"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Yeni Şifreniz"
                autoComplete="new-password"
                className="h-11 px-3.5 rounded-xl bg-[#f9f9ff] dark:bg-[#0f172a] border border-[#c5c5d3] dark:border-[#334155] text-xs text-[#111c2d] dark:text-white font-semibold outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#111c2d] dark:text-white">Yeni Şifre Tekrar</label>
              <input
                type="password"
                name="user_confirm_password_field"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Yeni Şifre Tekrar"
                autoComplete="new-password"
                className="h-11 px-3.5 rounded-xl bg-[#f9f9ff] dark:bg-[#0f172a] border border-[#c5c5d3] dark:border-[#334155] text-xs text-[#111c2d] dark:text-white font-semibold outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7eeff] dark:border-[#334155] mt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-heading font-bold shadow-md active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Kaydediliyor...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>Değişiklikleri Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};
