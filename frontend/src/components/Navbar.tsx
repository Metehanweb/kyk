import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();
  const { settings } = useSiteSettings();
  const { themeMode, toggleTheme } = useTheme();

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'Sistem Yöneticisi';
      case 'MANAGER': return 'Yurt Müdürü';
      case 'STAFF': return 'Görevli Personel';
      case 'STUDENT': return 'Öğrenci';
      default: return 'Kullanıcı';
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'MANAGER': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'STAFF': return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      default: return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    }
  };

  return (
    <>
      <header className="sticky top-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border-b border-[#e7eeff] dark:border-[#1e293b] shadow-xs pt-safe transition-colors">
        <div className="max-w-7xl mx-auto h-14 sm:h-16 px-3 sm:px-6 flex items-center justify-between gap-2">
          {/* Brand & Logo */}
          <div 
            onClick={() => setActiveTab(user?.role === 'STUDENT' ? 'home' : user?.role === 'ADMIN' ? 'admin-panel' : 'dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
          >
            <div 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform shrink-0"
              style={{ backgroundColor: settings.primary_color }}
            >
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">apartment</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span 
                className="font-heading font-extrabold text-xs sm:text-base tracking-tight leading-tight truncate text-[#00236f] dark:text-white"
              >
                {settings.site_title}
              </span>
              <span className="text-[10px] sm:text-[11px] font-medium text-[#444651] dark:text-[#94a3b8] tracking-normal leading-tight truncate">
                {settings.site_subtitle}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-[#f0f3ff] dark:bg-[#1e293b] p-1 rounded-xl border border-[#e7eeff] dark:border-[#334155]">
            {user?.role === 'STUDENT' ? (
              <>
                <button
                  onClick={() => setActiveTab('home')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'home'
                      ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                      : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                  }`}
                >
                  Ana Sayfa
                </button>
                <button
                  onClick={() => setActiveTab('my-requests')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'my-requests'
                      ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                      : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                  }`}
                >
                  Taleplerim
                </button>
                <button
                  onClick={() => setActiveTab('new-request')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'new-request'
                      ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-xs font-bold'
                      : 'text-[#00236f] dark:text-[#60a5fa] hover:bg-white/50 dark:hover:bg-white/10'
                  }`}
                >
                  + Yeni Bildirim
                </button>
                <button
                  onClick={() => setActiveTab('cafeteria')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'cafeteria'
                      ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                      : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                  }`}
                >
                  Yemekhane
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'guide'
                      ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                      : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                  }`}
                >
                  Rehber & İletişim
                </button>
              </>
            ) : (
              <>
                {/* Only ADMIN sees the dedicated Admin Panel tab */}
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setActiveTab('admin-panel')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                      activeTab === 'admin-panel'
                        ? 'bg-purple-800 text-white shadow-sm'
                        : 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 hover:bg-purple-200'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
                    <span>Sistem Yönetim Paneli</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                      : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                  }`}
                >
                  Yönetim Masası
                </button>
                <button
                  onClick={() => setActiveTab('my-requests')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    activeTab === 'my-requests'
                      ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                      : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                  }`}
                >
                  Arıza Listesi
                </button>
                {user?.role !== 'STAFF' && (
                  <button
                    onClick={() => setActiveTab('cafeteria')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'cafeteria'
                        ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                        : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                    }`}
                  >
                    Yemekhane
                  </button>
                )}
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setActiveTab('guide')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'guide'
                        ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-xs font-bold'
                        : 'text-[#444651] dark:text-[#cbd5e1] hover:text-[#111c2d] dark:hover:text-white'
                    }`}
                  >
                    Rehber
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Right Section: User Profile & Dropdown Menu */}
          <div className="flex items-center gap-2 shrink-0 relative" ref={dropdownRef}>
            {/* User Dropdown Trigger Button */}
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#1e293b] border border-[#e7eeff] dark:border-[#334155] hover:border-[#00236f] dark:hover:border-[#3b82f6] transition-all active:scale-95 text-left"
              title="Kullanıcı Menüsü"
            >
              <div className="w-8 h-8 rounded-xl bg-[#00236f] dark:bg-[#3b82f6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.full_name?.charAt(0) || 'K'}
              </div>

              <div className="hidden sm:flex flex-col text-left">
                <span className="font-heading font-bold text-xs text-[#111c2d] dark:text-white leading-tight truncate max-w-[110px]">
                  {user?.full_name}
                </span>
                <span className="text-[10px] text-[#757682] dark:text-[#94a3b8] leading-tight">
                  {getRoleLabel(user?.role)}
                </span>
              </div>

              <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#94a3b8]">
                {showDropdown ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Dropdown Menu Overlay */}
            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-[#e7eeff] dark:border-[#334155] p-2 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95">
                {/* User Info Header in Dropdown */}
                <div className="p-2.5 rounded-xl bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col gap-0.5 border border-[#e2e8f0] dark:border-[#1e293b]">
                  <span className="font-heading font-bold text-xs text-[#0f172a] dark:text-white truncate">
                    {user?.full_name}
                  </span>
                  <span className="text-[10px] text-[#64748b] dark:text-[#94a3b8]">
                    T.C: {user?.tc_no}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold border inline-block mt-1 w-max ${getRoleBadgeColor(user?.role)}`}>
                    {getRoleLabel(user?.role)}
                  </span>
                </div>

                <div className="h-px bg-[#e7eeff] dark:bg-[#334155] my-0.5"></div>

                {/* Option 1: Ayarlar */}
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setActiveTab('settings');
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors flex items-center gap-2 ${
                    activeTab === 'settings'
                      ? 'bg-[#00236f] dark:bg-[#2563eb] text-white font-bold'
                      : 'text-[#111c2d] dark:text-white hover:bg-[#f0f3ff] dark:hover:bg-[#334155]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#00236f] dark:text-[#3b82f6]">settings</span>
                  <span>Kullanıcı Ayarları</span>
                </button>

                {/* Option 2: Tema Değiştir (Açık/Karanlık) */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-[#111c2d] dark:text-white hover:bg-[#f0f3ff] dark:hover:bg-[#334155] flex items-center justify-between gap-2 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-500">
                      {themeMode === 'dark' ? 'dark_mode' : 'light_mode'}
                    </span>
                    <span>Tema: {themeMode === 'dark' ? 'Karanlık' : 'Açık'}</span>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    {themeMode === 'dark' ? 'Karanlık' : 'Açık'}
                  </span>
                </button>

                <div className="h-px bg-[#e7eeff] dark:bg-[#334155] my-0.5"></div>

                {/* Option 3: Güvenli Çıkış */}
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    logout();
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Güvenli Çıkış Yap</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
