import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { settings } = useSiteSettings();

  // Login states
  const [loginTcNo, setLoginTcNo] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginTcNo.length !== 11) {
      setErrorMessage('T.C. Kimlik Numarası 11 haneli olmalıdır.');
      return;
    }
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login(loginTcNo, loginPassword);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Giriş yapılamadı. Bilgilerinizi kontrol ediniz.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (tc: string, pass: string) => {
    setLoginTcNo(tc);
    setLoginPassword(pass);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 sm:p-6 bg-[#f0f3ff] dark:bg-[#0f172a] text-[#111c2d] dark:text-[#f8fafc] transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1e293b] rounded-3xl shadow-xl border border-[#e7eeff] dark:border-[#334155] p-6 sm:p-8 flex flex-col gap-6 my-auto">
        {/* Institutional Brand Header */}
        <div className="flex flex-col items-center text-center gap-2">
          <div 
            className="w-16 h-16 rounded-2xl text-white flex items-center justify-center shadow-md transform transition-transform hover:scale-105"
            style={{
              backgroundColor: settings.primary_color,
            }}
          >
            <span className="material-symbols-outlined text-[36px]">apartment</span>
          </div>
          <h1 
            className="font-heading font-extrabold text-xl sm:text-2xl tracking-tight mt-1 text-[#111c2d] dark:text-white"
            style={{ color: settings.primary_color }}
          >
            {settings.site_title}
          </h1>
          <p className="text-xs text-[#595c6c] dark:text-[#94a3b8]">
            {settings.site_subtitle}
          </p>
        </div>

        {/* Form Title */}
        <div className="bg-[#f8fafc] dark:bg-[#0f172a] border border-[#e2e8f0] dark:border-[#1e293b] rounded-2xl p-4 text-center flex flex-col gap-1">
          <h2 className="font-heading font-bold text-sm text-[#0f172a] dark:text-white flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-[#00236f] dark:text-[#3b82f6]">lock</span>
            Sistem Kullanıcı Girişi
          </h2>
          <p className="text-[11px] text-[#64748b] dark:text-[#94a3b8]">
            Hesabınıza erişmek için T.C. Kimlik numaranızı ve şifrenizi giriniz.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-xs flex items-center gap-2.5 animate-in fade-in">
            <span className="material-symbols-outlined text-[20px] text-red-600 shrink-0">error</span>
            <span className="font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Login Credentials Form */}
        <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="font-heading font-bold text-xs text-[#1e293b] dark:text-white">
              T.C. Kimlik Numarası (Kullanıcı Adı)
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#64748b] dark:text-[#94a3b8] text-[20px]">
                badge
              </span>
              <input
                type="text"
                value={loginTcNo}
                onChange={(e) => setLoginTcNo(e.target.value.replace(/\D/g, '').slice(0, 11))}
                placeholder="11 Haneli T.C. Kimlik No"
                required
                maxLength={11}
                className="w-full h-12 pl-10 pr-3.5 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] focus:border-[#00236f] dark:focus:border-[#3b82f6] text-sm font-semibold text-[#0f172a] dark:text-white outline-none transition-all font-mono tracking-wide"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-heading font-bold text-xs text-[#1e293b] dark:text-white">
              Şifre
            </label>
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3.5 text-[#64748b] dark:text-[#94a3b8] text-[20px]">
                key
              </span>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-12 pl-10 pr-3.5 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] border border-[#cbd5e1] dark:border-[#334155] focus:border-[#00236f] dark:focus:border-[#3b82f6] text-sm font-semibold text-[#0f172a] dark:text-white outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 rounded-xl bg-[#00236f] dark:bg-[#3b82f6] text-white font-heading font-bold text-sm shadow-md active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1"
          >
            {isLoading ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Giriş Yapılıyor...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[20px]">login</span>
                <span>Portala Giriş Yap</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Fill Buttons (Subtle helper chips for testing) */}
        <div className="pt-2 border-t border-[#f1f5f9] flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#94a3b8] text-center">
            Hızlı Test Hesapları (Tıkla - Doldur)
          </span>
          <div className="flex flex-wrap gap-1.5 justify-center">
            <button
              type="button"
              onClick={() => handleFillDemo('98765432109', 'ogrenci123')}
              className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-emerald-600">school</span>
              Öğrenci (Eren)
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('12345678901', 'ogrenci123')}
              className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-rose-600">school</span>
              Öğrenci (Zeynep)
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('22222222220', 'mudur123')}
              className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-amber-600">corporate_fare</span>
              Yurt Müdürü
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('33333333330', 'personel123')}
              className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-blue-600">engineering</span>
              Personel
            </button>

            <button
              type="button"
              onClick={() => handleFillDemo('11111111110', 'admin123')}
              className="px-2.5 py-1 rounded-lg bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] text-[11px] font-semibold transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px] text-purple-600">admin_panel_settings</span>
              Admin
            </button>
          </div>
        </div>

        {/* Institutional Footer */}
        <div className="text-[10px] text-center text-[#94a3b8] pt-1">
          {settings.footer_text}
        </div>
      </div>
    </div>
  );
};
