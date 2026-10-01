import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings, defaultSettings } from '../context/SiteSettingsContext';
import { apiClient } from '../api/client';
import type {
  UserAdminView,
  UserRole,
  RoleStatItem,
  DataOverview,
  BuildingBlockResponse,
  ComplaintResponse,
  AnnouncementResponse,
  CafeteriaMenuResponse,
} from '../types';

export const AdminSystemPanel: React.FC = () => {
  const { user } = useAuth();
  const { settings, updateSettings, resetSettings, isLoading: isSettingsSaving } = useSiteSettings();

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'branding' | 'users' | 'roles' | 'data'>('branding');

  // Notifications / Toasts
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // --- BRANDING & STYLES STATE ---
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSettingsSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSettings(localSettings);
      showToast('Sistem görsel ve metin ayarları başarıyla kaydedildi!');
    } catch (err) {
      showToast('Ayarlar kaydedilirken hata oluştu.', 'error');
    }
  };

  const handleResetDefaults = async () => {
    if (window.confirm('Tüm renk, stil ve metin ayarlarını orijinal fabrika ayarlarına sıfırlamak istiyor musunuz?')) {
      await resetSettings();
      setLocalSettings(defaultSettings);
      showToast('Tüm ayarlar varsayılana sıfırlandı.');
    }
  };

  // Preset Color Palettes
  const presetPalettes = [
    {
      name: 'Resmi KYK Mavisi',
      primary: '#00236f',
      primaryContainer: '#1e3a8a',
      secondary: '#006a61',
      secondaryContainer: '#86f2e4',
      surface: '#f9f9ff',
    },
    {
      name: 'Zümrüt Yeşil',
      primary: '#064e3b',
      primaryContainer: '#047857',
      secondary: '#0f766e',
      secondaryContainer: '#99f6e4',
      surface: '#f6faf7',
    },
    {
      name: 'Kraliyet Moru',
      primary: '#3b0764',
      primaryContainer: '#581c87',
      secondary: '#7c3aed',
      secondaryContainer: '#ddd6fe',
      surface: '#faf8fc',
    },
    {
      name: 'Modern Gece (Dark)',
      primary: '#2563eb',
      primaryContainer: '#1d4ed8',
      secondary: '#06b6d4',
      secondaryContainer: '#22d3ee',
      surface: '#0f172a',
      onSurface: '#f8fafc',
    },
    {
      name: 'Kızılcık & Mercan',
      primary: '#7f1d1d',
      primaryContainer: '#991b1b',
      secondary: '#ea580c',
      secondaryContainer: '#ffedd5',
      surface: '#fdfbfb',
    },
  ];

  const applyPalette = (palette: typeof presetPalettes[0]) => {
    const updated = {
      ...localSettings,
      primary_color: palette.primary,
      primary_container: palette.primaryContainer,
      secondary_color: palette.secondary,
      secondary_container: palette.secondaryContainer,
      surface_color: palette.surface,
      ...(palette.onSurface ? { on_surface_color: palette.onSurface } : { on_surface_color: '#111c2d' }),
    };
    setLocalSettings(updated);
    updateSettings(updated);
    showToast(`'${palette.name}' renk paleti uygulandı!`);
  };

  // --- USERS MANAGEMENT STATE ---
  const [users, setUsers] = useState<UserAdminView[]>([]);
  const [blocks, setBlocks] = useState<BuildingBlockResponse[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // New User Modal
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newTcNo, setNewTcNo] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('STUDENT');
  const [newBlockId, setNewBlockId] = useState('');
  const [newRoomNumber, setNewRoomNumber] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  // Edit User Modal
  const [editingUser, setEditingUser] = useState<UserAdminView | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('STUDENT');
  const [editBlockId, setEditBlockId] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editNewPassword, setEditNewPassword] = useState('');
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const params: any = {};
      if (userSearch) params.q = userSearch;
      if (userRoleFilter) params.role = userRoleFilter;

      const res = await apiClient.get<UserAdminView[]>('/admin/users', { params });
      setUsers(res.data);
    } catch (err) {
      console.error('Kullanıcılar alınamadı:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users') {
      fetchUsers();
    }
  }, [activeSubTab, userRoleFilter]);

  // Load building blocks once
  useEffect(() => {
    apiClient.get<BuildingBlockResponse[]>('/blocks').then((res) => {
      setBlocks(res.data);
      if (res.data.length > 0 && !newBlockId) {
        setNewBlockId(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTcNo.length !== 11) {
      alert('T.C. Kimlik Numarası tam 11 haneli olmalıdır.');
      return;
    }
    try {
      setIsSubmittingUser(true);
      await apiClient.post('/admin/users', {
        tc_no: newTcNo,
        full_name: newFullName,
        password: newPassword,
        role: newRole,
        block_id: newBlockId || null,
        room_number: newRoomNumber || null,
        phone: newPhone || null,
        is_active: true,
      });
      showToast('Kullanıcı başarıyla oluşturuldu!');
      setShowAddUserModal(false);
      // Reset form
      setNewTcNo('');
      setNewFullName('');
      setNewPassword('');
      setNewRole('STUDENT');
      setNewRoomNumber('');
      setNewPhone('');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Kullanıcı oluşturulamadı.', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const openEditModal = (u: UserAdminView) => {
    setEditingUser(u);
    setEditFullName(u.full_name);
    setEditRole(u.role);
    setEditBlockId(u.block?.id || '');
    setEditRoomNumber(u.room_number || '');
    setEditPhone(u.phone || '');
    setEditIsActive(u.is_active);
    setEditNewPassword('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setIsUpdatingUser(true);
      await apiClient.put(`/admin/users/${editingUser.id}`, {
        full_name: editFullName,
        role: editRole,
        block_id: editBlockId || null,
        room_number: editRoomNumber || null,
        phone: editPhone || null,
        is_active: editIsActive,
        password: editNewPassword.trim() ? editNewPassword : null,
      });
      showToast(`${editingUser.full_name} hesabı güncellendi!`);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Güncelleme başarısız.', 'error');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  const handleDeleteUser = async (u: UserAdminView) => {
    if (!window.confirm(`${u.full_name} (${u.tc_no}) kullanıcısını kalıcı olarak silmek istediğinize emin misiniz?`)) {
      return;
    }
    try {
      await apiClient.delete(`/admin/users/${u.id}`);
      showToast('Kullanıcı sistemden silindi.');
      fetchUsers();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Kullanıcı silinemedi.', 'error');
    }
  };

  // --- ROLES & PERMISSIONS STATE ---
  const [roleStats, setRoleStats] = useState<RoleStatItem[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const fetchRoleStats = async () => {
    try {
      setIsLoadingRoles(true);
      const res = await apiClient.get<RoleStatItem[]>('/admin/roles');
      setRoleStats(res.data);
    } catch (err) {
      console.error('Rol verileri alınamadı:', err);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'roles') {
      fetchRoleStats();
    }
  }, [activeSubTab]);

  // --- DATA & RECORDS STATE ---
  const [dataOverview, setDataOverview] = useState<DataOverview | null>(null);
  const [allComplaints, setAllComplaints] = useState<ComplaintResponse[]>([]);
  const [allAnnouncements, setAllAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [allCafeteria, setAllCafeteria] = useState<CafeteriaMenuResponse[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  const fetchDataTab = async () => {
    try {
      setIsLoadingData(true);
      const [overviewRes, complaintsRes, annRes, cafeRes] = await Promise.all([
        apiClient.get<DataOverview>('/admin/data-overview'),
        apiClient.get<ComplaintResponse[]>('/complaints'),
        apiClient.get<AnnouncementResponse[]>('/announcements'),
        apiClient.get<CafeteriaMenuResponse[]>('/cafeteria/today').catch(() => ({ data: [] })),
      ]);
      setDataOverview(overviewRes.data);
      setAllComplaints(complaintsRes.data);
      setAllAnnouncements(annRes.data);
      setAllCafeteria(cafeRes.data);
    } catch (err) {
      console.error('Veriler alınamadı:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'data') {
      fetchDataTab();
    }
  }, [activeSubTab]);

  const handleDeleteComplaint = async (id: string, title: string) => {
    if (!window.confirm(`'${title}' başlıklı arıza kaydını kalıcı olarak silmek istiyor musunuz?`)) return;
    try {
      await apiClient.delete(`/admin/complaints/${id}`);
      showToast('Arıza kaydı silindi.');
      fetchDataTab();
    } catch (err) {
      showToast('Silme işlemi başarısız.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!window.confirm(`'${title}' başlıklı duyuruyu silmek istiyor musunuz?`)) return;
    try {
      await apiClient.delete(`/admin/announcements/${id}`);
      showToast('Duyuru silindi.');
      fetchDataTab();
    } catch (err) {
      showToast('Duyuru silinemedi.', 'error');
    }
  };

  const exportDataJson = () => {
    const dataToExport = {
      settings,
      dataOverview,
      complaints: allComplaints,
      announcements: allAnnouncements,
      cafeteria: allCafeteria,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dorm_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('Tüm sistem verileri JSON olarak dışa aktarıldı.');
  };

  // Helper labels
  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'Sistem Yöneticisi';
      case 'MANAGER': return 'Yurt Müdürü';
      case 'STAFF': return 'Personel / Görevli';
      case 'STUDENT': return 'Öğrenci';
      default: return role;
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MANAGER':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'STUDENT':
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16 animate-in fade-in">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 animate-in slide-in-from-bottom-2 text-xs font-semibold ${
          toastMessage.type === 'success'
            ? 'bg-emerald-900 text-white border-emerald-700 shadow-emerald-900/20'
            : 'bg-red-900 text-white border-red-700 shadow-red-900/20'
        }`}>
          <span className="material-symbols-outlined text-[20px]">
            {toastMessage.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Banner / Hero Header */}
      <section className="relative overflow-hidden rounded-3xl bg-[#00236f] dark:bg-[#1e293b] border border-transparent dark:border-[#334155] p-5 sm:p-7 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-[32px] sm:text-[36px] text-amber-300">
                admin_panel_settings
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-extrabold uppercase tracking-wider">
                  Süper Yönetici Paneli
                </span>
                <span className="text-white/60 text-xs">• Tam Sistem Kontrolü</span>
              </div>
              <h1 className="font-heading font-extrabold text-xl sm:text-2xl mt-1 tracking-tight">
                {localSettings.site_title} • Yönetim Merkezi
              </h1>
              <p className="text-xs sm:text-sm text-white/80 max-w-2xl mt-0.5">
                Rolleri, görsel stilleri, renkleri, metinleri, kullanıcıları ve verileri tek merkezden canlı yönetin.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={exportDataJson}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all active:scale-95"
              title="Sistem yedeğini JSON olarak indir"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="hidden sm:inline">Veri Yedeği İndir</span>
            </button>
          </div>
        </div>

        {/* Quick Nav Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-5 border-t border-white/15 mt-5">
          <button
            onClick={() => setActiveSubTab('branding')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSubTab === 'branding'
                ? 'bg-white text-[#00236f] shadow-lg'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">palette</span>
            <span>Görsellik, Stil & Text Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('users')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSubTab === 'users'
                ? 'bg-white text-[#00236f] shadow-lg'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">group</span>
            <span>Kullanıcı Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('roles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSubTab === 'roles'
                ? 'bg-white text-[#00236f] shadow-lg'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">badge</span>
            <span>Roller & Yetki Matrisi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('data')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSubTab === 'data'
                ? 'bg-white text-[#00236f] shadow-lg'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">database</span>
            <span>Veri & İçerik Yönetimi</span>
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. BRANDING, STYLES, COLORS & TEXTS STUDIO */}
      {/* ========================================================================= */}
      {activeSubTab === 'branding' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          {/* Controls Form (8 cols) */}
          <form onSubmit={handleSettingsSave} className="lg:col-span-8 flex flex-col gap-6">
            {/* 1.1 Preset Palettes */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e7eeff] shadow-sm flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00236f] text-[20px]">format_paint</span>
                    Hazır Tasarım & Renk Temaları
                  </h3>
                  <p className="text-[11px] text-[#757682]">Tek tıkla tüm sitede anında canlı renklere geçiş yapın</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                {presetPalettes.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => applyPalette(p)}
                    className="p-3 rounded-2xl border border-[#e7eeff] hover:border-[#00236f] transition-all flex flex-col items-center gap-2 text-center group bg-[#f9f9ff] hover:bg-white active:scale-95"
                  >
                    <div className="flex items-center gap-1">
                      <span className="w-5 h-5 rounded-full shadow-sm" style={{ backgroundColor: p.primary }}></span>
                      <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: p.secondary }}></span>
                    </div>
                    <span className="text-[11px] font-heading font-bold text-[#111c2d] group-hover:text-[#00236f]">
                      {p.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 1.2 Institutional Identity & Titles */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e7eeff] shadow-sm flex flex-col gap-4">
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] flex items-center gap-2 border-b border-[#e7eeff] pb-3">
                <span className="material-symbols-outlined text-[#00236f] text-[20px]">apartment</span>
                Kurumsal Kimlik & Başlık Metinleri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Yurt / Kurum Adı (Site Başlığı)</label>
                  <input
                    type="text"
                    value={localSettings.site_title}
                    onChange={(e) => setLocalSettings({ ...localSettings, site_title: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                    placeholder="Örn: Elvin Buğra Arslan Yurdu"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Slogan / Alt Başlık</label>
                  <input
                    type="text"
                    value={localSettings.site_subtitle}
                    onChange={(e) => setLocalSettings({ ...localSettings, site_subtitle: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                    placeholder="Örn: Kırşehir Mucur KYK Portalı"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Karşılama Rozeti (Badge)</label>
                  <input
                    type="text"
                    value={localSettings.hero_badge}
                    onChange={(e) => setLocalSettings({ ...localSettings, hero_badge: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Karşılama Banner Başlığı</label>
                  <input
                    type="text"
                    value={localSettings.hero_title}
                    onChange={(e) => setLocalSettings({ ...localSettings, hero_title: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-heading font-bold text-[#111c2d]">Banner Alt Açıklama Metni</label>
                <input
                  type="text"
                  value={localSettings.hero_subtitle}
                  onChange={(e) => setLocalSettings({ ...localSettings, hero_subtitle: e.target.value })}
                  className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-heading font-bold text-[#111c2d]">Alt Bilgi (Footer) Kurumsal Telif Metni</label>
                <input
                  type="text"
                  value={localSettings.footer_text}
                  onChange={(e) => setLocalSettings({ ...localSettings, footer_text: e.target.value })}
                  className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                />
              </div>
            </div>

            {/* 1.3 Custom Colors & Typography */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e7eeff] shadow-sm flex flex-col gap-4">
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] flex items-center gap-2 border-b border-[#e7eeff] pb-3">
                <span className="material-symbols-outlined text-[#00236f] text-[20px]">palette</span>
                Özel Renkler, Font ve Yuvarlaklık
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Ana Renk (Primary)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localSettings.primary_color}
                      onChange={(e) => setLocalSettings({ ...localSettings, primary_color: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#e7eeff] p-0.5"
                    />
                    <input
                      type="text"
                      value={localSettings.primary_color}
                      onChange={(e) => setLocalSettings({ ...localSettings, primary_color: e.target.value })}
                      className="h-10 w-full px-2 rounded-xl border border-[#e7eeff] text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Vurgu (Gradient)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localSettings.primary_container}
                      onChange={(e) => setLocalSettings({ ...localSettings, primary_container: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#e7eeff] p-0.5"
                    />
                    <input
                      type="text"
                      value={localSettings.primary_container}
                      onChange={(e) => setLocalSettings({ ...localSettings, primary_container: e.target.value })}
                      className="h-10 w-full px-2 rounded-xl border border-[#e7eeff] text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">İkincil Renk (Teal)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localSettings.secondary_color}
                      onChange={(e) => setLocalSettings({ ...localSettings, secondary_color: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#e7eeff] p-0.5"
                    />
                    <input
                      type="text"
                      value={localSettings.secondary_color}
                      onChange={(e) => setLocalSettings({ ...localSettings, secondary_color: e.target.value })}
                      className="h-10 w-full px-2 rounded-xl border border-[#e7eeff] text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Sayfa Arkaplanı</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={localSettings.surface_color}
                      onChange={(e) => setLocalSettings({ ...localSettings, surface_color: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-[#e7eeff] p-0.5"
                    />
                    <input
                      type="text"
                      value={localSettings.surface_color}
                      onChange={(e) => setLocalSettings({ ...localSettings, surface_color: e.target.value })}
                      className="h-10 w-full px-2 rounded-xl border border-[#e7eeff] text-xs font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Tipografi (Yazı Tipi)</label>
                  <select
                    value={localSettings.font_family}
                    onChange={(e) => setLocalSettings({ ...localSettings, font_family: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none"
                  >
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans (Modern & Şık)</option>
                    <option value="Inter">Inter (Temiz & Kurumsal)</option>
                    <option value="Outfit">Outfit (Cesur & Geometrik)</option>
                    <option value="Roboto">Roboto (Google Standart)</option>
                    <option value="Poppins">Poppins (Yumuşak & Canlı)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Kart Köşe Yuvarlaklığı</label>
                  <select
                    value={localSettings.border_radius}
                    onChange={(e) => setLocalSettings({ ...localSettings, border_radius: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none"
                  >
                    <option value="rounded-xl">Hafif Yuvarlak (rounded-xl)</option>
                    <option value="rounded-2xl">Modern Dengeli (rounded-2xl)</option>
                    <option value="rounded-3xl">Geniş Yumuşak (rounded-3xl)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 1.4 Contact & Cafeteria Info Texts */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#e7eeff] shadow-sm flex flex-col gap-4">
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] flex items-center gap-2 border-b border-[#e7eeff] pb-3">
                <span className="material-symbols-outlined text-[#00236f] text-[20px]">contact_support</span>
                İletişim, Rehber & Yemekhane Bilgi Metinleri
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">İdare Telefonu</label>
                  <input
                    type="text"
                    value={localSettings.contact_phone}
                    onChange={(e) => setLocalSettings({ ...localSettings, contact_phone: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">İdare E-Posta</label>
                  <input
                    type="email"
                    value={localSettings.contact_email}
                    onChange={(e) => setLocalSettings({ ...localSettings, contact_email: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Nöbetçi Memur / Güvenlik Tel</label>
                  <input
                    type="text"
                    value={localSettings.security_phone}
                    onChange={(e) => setLocalSettings({ ...localSettings, security_phone: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Yurt Tam Adresi</label>
                  <input
                    type="text"
                    value={localSettings.contact_address}
                    onChange={(e) => setLocalSettings({ ...localSettings, contact_address: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Yemekhane Öğle Servis Saatleri</label>
                  <input
                    type="text"
                    value={localSettings.cafeteria_lunch_hours}
                    onChange={(e) => setLocalSettings({ ...localSettings, cafeteria_lunch_hours: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-heading font-bold text-[#111c2d]">Yemekhane Akşam Servis Saatleri</label>
                  <input
                    type="text"
                    value={localSettings.cafeteria_dinner_hours}
                    onChange={(e) => setLocalSettings({ ...localSettings, cafeteria_dinner_hours: e.target.value })}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold focus:bg-white focus:border-[#00236f] outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save & Reset Actions */}
            <div className="flex items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#e7eeff] shadow-sm">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2.5 rounded-xl border border-[#ba1a1a]/30 text-[#ba1a1a] hover:bg-[#ba1a1a]/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                <span>Varsayılanlara Sıfırla</span>
              </button>

              <button
                type="submit"
                disabled={isSettingsSaving}
                className="px-6 py-2.5 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white font-heading font-bold text-xs shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              >
                {isSettingsSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Kaydediliyor...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                    <span>Tüm Siteye Uygula & Kaydet</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Preview Card (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="sticky top-20 bg-white rounded-3xl p-5 border border-[#e7eeff] shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#e7eeff] pb-3">
                <span className="font-heading font-bold text-xs uppercase tracking-wider text-[#757682] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Canlı Önizleme (Live Preview)
                </span>
                <span className="text-[10px] text-[#757682]">Anlık Değişim</span>
              </div>

              {/* Preview Mini Navbar */}
              <div className="p-3 rounded-2xl border border-gray-200 bg-[#f9f9ff] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-xl text-white flex items-center justify-center font-bold shadow"
                    style={{ backgroundColor: localSettings.primary_color }}
                  >
                    <span className="material-symbols-outlined text-[18px]">apartment</span>
                  </div>
                  <div>
                    <div className="font-heading font-extrabold text-xs leading-tight" style={{ color: localSettings.primary_color }}>
                      {localSettings.site_title || 'Kurum Adı'}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {localSettings.site_subtitle || 'Portal Alt Başlığı'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview Mini Hero Banner */}
              <div
                className="p-4 rounded-2xl text-white shadow-md relative overflow-hidden"
                style={{
                  backgroundColor: localSettings.primary_color,
                }}
              >
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-bold uppercase tracking-wider inline-block mb-1.5">
                  {localSettings.hero_badge}
                </span>
                <h4 className="font-heading font-extrabold text-xs sm:text-sm leading-snug">
                  {localSettings.hero_title}
                </h4>
                <p className="text-[10px] text-white/80 mt-1">
                  {localSettings.hero_subtitle}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold shadow text-white"
                    style={{ backgroundColor: localSettings.secondary_color }}
                  >
                    İşlem Butonu
                  </span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/15 text-white">
                    Detay
                  </span>
                </div>
              </div>

              {/* Preview Contact capsule */}
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs flex flex-col gap-1.5">
                <div className="font-bold text-[11px] text-gray-700 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-emerald-600">call</span>
                  {localSettings.contact_phone}
                </div>
                <div className="text-[11px] text-gray-600 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-blue-600">mail</span>
                  {localSettings.contact_email}
                </div>
                <div className="text-[10px] text-gray-500 border-t pt-1.5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  <span className="truncate">{localSettings.contact_address}</span>
                </div>
              </div>

              <div className="text-[10px] text-center text-gray-400">
                {localSettings.footer_text}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. USER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'users' && (
        <div className="flex flex-col gap-4 animate-in fade-in">
          {/* Action Bar & Search */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#e7eeff] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#757682] text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                  placeholder="İsim, T.C. No, Oda veya Tel..."
                  className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:bg-white focus:border-[#00236f]"
                />
              </div>

              <button
                onClick={fetchUsers}
                className="h-10 px-3.5 rounded-xl bg-[#00236f] text-white text-xs font-bold active:scale-95 shrink-0"
              >
                Ara
              </button>
            </div>

            {/* Role Filter Pills & Add User Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none"
              >
                <option value="">Tüm Roller</option>
                <option value="ADMIN">Sistem Yöneticisi</option>
                <option value="MANAGER">Yurt Müdürü</option>
                <option value="STAFF">Personel / Teknisyen</option>
                <option value="STUDENT">Öğrenci</option>
              </select>

              <button
                onClick={() => setShowAddUserModal(true)}
                className="h-10 px-4 rounded-xl bg-[#006a61] dark:bg-emerald-600 text-white text-xs font-bold shadow-md flex items-center gap-1.5 active:scale-95 shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>Yeni Kullanıcı Ekle</span>
              </button>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-3xl border border-[#e7eeff] shadow-sm overflow-hidden">
            {isLoadingUsers ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-8 h-8 border-3 border-[#00236f] border-t-transparent rounded-full animate-spin"></div>
                <span className="text-xs text-[#757682]">Kullanıcı verileri yükleniyor...</span>
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-[#757682] gap-2">
                <span className="material-symbols-outlined text-[36px]">person_off</span>
                <span className="text-xs font-bold">Kriterlere uygun kullanıcı bulunamadı.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f0f3ff] text-[#444651] font-heading font-bold border-b border-[#e7eeff]">
                      <th className="py-3 px-4">Kullanıcı Bilgileri</th>
                      <th className="py-3 px-4">T.C. Kimlik No</th>
                      <th className="py-3 px-4">Rol & Yetki</th>
                      <th className="py-3 px-4">Blok & Oda</th>
                      <th className="py-3 px-4">Telefon</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e7eeff]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#f9f9ff] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#00236f] dark:bg-[#2563eb] text-white flex items-center justify-center font-bold text-xs">
                              {u.full_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-heading font-bold text-[#111c2d]">{u.full_name}</div>
                              <div className="text-[10px] text-[#757682]">Kayıt: {new Date(u.created_at).toLocaleDateString('tr-TR')}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-[#444651]">
                          {u.tc_no}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${getRoleBadge(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-[#444651]">
                          {u.block?.name ? (
                            <span>{u.block.name} • Oda {u.room_number || '-'}</span>
                          ) : (
                            <span className="text-[#757682]">Tanımsız (İdari)</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-[#444651]">
                          {u.phone || <span className="text-[#757682]">-</span>}
                        </td>

                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                            u.is_active ? 'text-emerald-700' : 'text-red-600'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                            {u.is_active ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditModal(u)}
                              className="w-8 h-8 rounded-lg text-[#00236f] hover:bg-[#e7eeff] flex items-center justify-center active:scale-95"
                              title="Düzenle / Rol Değiştir"
                            >
                              <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>

                            {u.id !== user?.id && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="w-8 h-8 rounded-lg text-[#ba1a1a] hover:bg-[#ffdad6]/40 flex items-center justify-center active:scale-95"
                                title="Kullanıcıyı Sil"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Modal 1: Add New User */}
          {showAddUserModal && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#e7eeff] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#e7eeff] pb-3">
                  <h3 className="font-heading font-extrabold text-base text-[#111c2d] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00236f]">person_add</span>
                    Yeni Kullanıcı Tanımla
                  </h3>
                  <button onClick={() => setShowAddUserModal(false)} className="text-[#757682] hover:text-black">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">T.C. Kimlik No (11 hane)*</label>
                      <input
                        type="text"
                        maxLength={11}
                        required
                        value={newTcNo}
                        onChange={(e) => setNewTcNo(e.target.value.replace(/\D/g, ''))}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                        placeholder="11111111111"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Kullanıcı Rolü*</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      >
                        <option value="STUDENT">Öğrenci</option>
                        <option value="STAFF">Personel / Teknisyen</option>
                        <option value="MANAGER">Yurt Müdürü</option>
                        <option value="ADMIN">Sistem Yöneticisi</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Ad Soyad*</label>
                      <input
                        type="text"
                        required
                        value={newFullName}
                        onChange={(e) => setNewFullName(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                        placeholder="Örn: Ayşe Demir"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Giriş Şifresi*</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                        placeholder="En az 4 karakter"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Bağlı Olduğu Blok</label>
                      <select
                        value={newBlockId}
                        onChange={(e) => setNewBlockId(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      >
                        <option value="">Seçiniz / Yok</option>
                        {blocks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.gender_type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Oda Numarası</label>
                      <input
                        type="text"
                        value={newRoomNumber}
                        onChange={(e) => setNewRoomNumber(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                        placeholder="Örn: 204"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-[#111c2d]">Telefon Numarası</label>
                    <input
                      type="text"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7eeff] mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#757682] hover:bg-gray-100"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingUser}
                      className="px-5 py-2.5 rounded-xl bg-[#00236f] text-white text-xs font-bold shadow-md shadow-[#00236f]/25 active:scale-95"
                    >
                      {isSubmittingUser ? 'Kaydediliyor...' : 'Kullanıcıyı Oluştur'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Modal 2: Edit User / Change Role */}
          {editingUser && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#e7eeff] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#e7eeff] pb-3">
                  <div>
                    <h3 className="font-heading font-extrabold text-base text-[#111c2d] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00236f]">manage_accounts</span>
                      Kullanıcı & Rol Düzenleme
                    </h3>
                    <p className="text-[11px] text-[#757682]">T.C: {editingUser.tc_no}</p>
                  </div>
                  <button onClick={() => setEditingUser(null)} className="text-[#757682] hover:text-black">
                    ✕
                  </button>
                </div>

                <form onSubmit={handleUpdateUser} className="flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Ad Soyad</label>
                      <input
                        type="text"
                        required
                        value={editFullName}
                        onChange={(e) => setEditFullName(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d] text-[#00236f]">Kullanıcı Rolü Değiştir*</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as UserRole)}
                        className="h-10 px-3 rounded-xl border-2 border-[#00236f] bg-white text-xs font-bold text-[#00236f] outline-none"
                      >
                        <option value="STUDENT">Öğrenci</option>
                        <option value="STAFF">Personel / Teknisyen</option>
                        <option value="MANAGER">Yurt Müdürü</option>
                        <option value="ADMIN">Sistem Yöneticisi</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Bağlı Olduğu Blok</label>
                      <select
                        value={editBlockId}
                        onChange={(e) => setEditBlockId(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      >
                        <option value="">Seçiniz / Yok</option>
                        {blocks.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name} ({b.gender_type})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Oda No</label>
                      <input
                        type="text"
                        value={editRoomNumber}
                        onChange={(e) => setEditRoomNumber(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Telefon</label>
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-[#111c2d]">Hesap Durumu</label>
                      <select
                        value={editIsActive ? 'active' : 'passive'}
                        onChange={(e) => setEditIsActive(e.target.value === 'active')}
                        className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#00236f]"
                      >
                        <option value="active">Aktif Hesap</option>
                        <option value="passive">Pasife Al (Dondur)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 pt-1">
                    <label className="text-[11px] font-bold text-[#ba1a1a]">Şifre Sıfırlama (Boş bırakırsanız değişmez)</label>
                    <input
                      type="password"
                      value={editNewPassword}
                      onChange={(e) => setEditNewPassword(e.target.value)}
                      placeholder="Yeni şifre belirleyin..."
                      className="h-10 px-3 rounded-xl border border-[#e7eeff] bg-[#f9f9ff] text-xs font-semibold outline-none focus:border-[#ba1a1a]"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7eeff] mt-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-[#757682] hover:bg-gray-100"
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingUser}
                      className="px-5 py-2.5 rounded-xl bg-[#00236f] text-white text-xs font-bold shadow-md shadow-[#00236f]/25 active:scale-95"
                    >
                      {isUpdatingUser ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ROLES & PERMISSIONS INSPECTOR */}
      {/* ========================================================================= */}
      {activeSubTab === 'roles' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {isLoadingRoles ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-[#00236f] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-[#757682]">Rol yetki analizi yapılıyor...</span>
            </div>
          ) : (
            <>
              {/* Role Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {roleStats.map((item) => (
                  <div
                    key={item.role}
                    className="bg-white rounded-3xl p-5 border border-[#e7eeff] shadow-sm flex flex-col justify-between gap-4 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadge(item.role)}`}>
                          {item.role}
                        </span>
                        <div className="text-right">
                          <span className="font-heading font-extrabold text-lg text-[#111c2d]">{item.count}</span>
                          <span className="text-[10px] text-[#757682] block">Kullanıcı</span>
                        </div>
                      </div>

                      <h3 className="font-heading font-bold text-sm text-[#111c2d] mt-2">
                        {item.name}
                      </h3>
                      <p className="text-[11px] text-[#757682] mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-[#e7eeff]">
                      <span className="text-[10px] font-bold text-[#444651] uppercase tracking-wider block mb-1.5">
                        Yetki Kapsamı
                      </span>
                      <ul className="flex flex-col gap-1 text-[11px] text-[#444651]">
                        {item.permissions.map((perm, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[14px] text-emerald-600">check</span>
                            <span>{perm}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparative Role Matrix Table */}
              <div className="bg-white rounded-3xl p-5 border border-[#e7eeff] shadow-sm flex flex-col gap-4">
                <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#00236f] text-[20px]">grid_view</span>
                  Yetki & İşlem Karşılaştırma Matrisi
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f0f3ff] text-[#444651] font-heading font-bold border-b border-[#e7eeff]">
                        <th className="py-3 px-4">Modül / İşlem</th>
                        <th className="py-3 px-4 text-center">Öğrenci (STUDENT)</th>
                        <th className="py-3 px-4 text-center">Personel (STAFF)</th>
                        <th className="py-3 px-4 text-center">Yurt Müdürü (MANAGER)</th>
                        <th className="py-3 px-4 text-center">Sistem Yöneticisi (ADMIN)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7eeff]">
                      <tr>
                        <td className="py-3 px-4 font-semibold">Yeni Arıza / Şikayet Talebi Açma</td>
                        <td className="text-center text-emerald-600 font-bold">✓ (Kendi Odası)</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Talepleri Personele Atama</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Arıza Durumunu Değiştirme & Çözme</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Resmi Duyuru Yayınlama</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-semibold">Yemekhane Menüsü Yönetimi</td>
                        <td className="text-center text-gray-300">✕ (Sadece Oylar)</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                        <td className="text-center text-emerald-600 font-bold">✓</td>
                      </tr>
                      <tr className="bg-purple-50/50">
                        <td className="py-3 px-4 font-bold text-purple-900">Site Görsellik, Renk, Stil ve Metin Yönetimi</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-purple-700 font-extrabold">✓ Sadece Admin</td>
                      </tr>
                      <tr className="bg-purple-50/50">
                        <td className="py-3 px-4 font-bold text-purple-900">Kullanıcı Rolü Değiştirme & Hesap Silme</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-gray-300">✕</td>
                        <td className="text-center text-purple-700 font-extrabold">✓ Sadece Admin</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DATA & SYSTEM RECORDS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSubTab === 'data' && (
        <div className="flex flex-col gap-6 animate-in fade-in">
          {isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-3 border-[#00236f] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-[#757682]">Veri varlıkları taranıyor...</span>
            </div>
          ) : (
            <>
              {/* Overview Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white rounded-2xl p-4 border border-[#e7eeff] shadow-sm flex flex-col">
                  <span className="text-[10px] font-bold text-[#757682] uppercase">Arıza Kayıtları</span>
                  <span className="font-heading font-extrabold text-xl text-[#00236f] mt-1">{dataOverview?.complaints_count || 0}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#e7eeff] shadow-sm flex flex-col">
                  <span className="text-[10px] font-bold text-[#757682] uppercase">Duyurular</span>
                  <span className="font-heading font-extrabold text-xl text-[#006a61] mt-1">{dataOverview?.announcements_count || 0}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#e7eeff] shadow-sm flex flex-col">
                  <span className="text-[10px] font-bold text-[#757682] uppercase">Menüler</span>
                  <span className="font-heading font-extrabold text-xl text-amber-600 mt-1">{dataOverview?.cafeteria_menus_count || 0}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#e7eeff] shadow-sm flex flex-col">
                  <span className="text-[10px] font-bold text-[#757682] uppercase">Yurt Blokları</span>
                  <span className="font-heading font-extrabold text-xl text-purple-600 mt-1">{dataOverview?.blocks_count || 0}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#e7eeff] shadow-sm flex flex-col">
                  <span className="text-[10px] font-bold text-[#757682] uppercase">Kategoriler</span>
                  <span className="font-heading font-extrabold text-xl text-blue-600 mt-1">{dataOverview?.categories_count || 0}</span>
                </div>
                <div className="bg-white rounded-2xl p-4 border border-[#e7eeff] shadow-sm flex flex-col">
                  <span className="text-[10px] font-bold text-[#757682] uppercase">Kullanıcılar</span>
                  <span className="font-heading font-extrabold text-xl text-emerald-600 mt-1">{dataOverview?.users_count || 0}</span>
                </div>
              </div>

              {/* Data Table 1: Complaints Records Manager */}
              <div className="bg-white rounded-3xl p-5 border border-[#e7eeff] shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#e7eeff] pb-3">
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#00236f] text-[20px]">assignment</span>
                      Talepler & Arıza Verileri ({allComplaints.length})
                    </h3>
                    <p className="text-[11px] text-[#757682]">Admin yetkisiyle kayıtları inceleyin veya kalıcı olarak silin</p>
                  </div>
                </div>

                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f0f3ff] text-[#444651] font-heading font-bold border-b border-[#e7eeff] sticky top-0">
                        <th className="py-2.5 px-3">Başlık</th>
                        <th className="py-2.5 px-3">Öğrenci</th>
                        <th className="py-2.5 px-3">Blok / Oda</th>
                        <th className="py-2.5 px-3">Kategori</th>
                        <th className="py-2.5 px-3">Durum</th>
                        <th className="py-2.5 px-3 text-right">Sil</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e7eeff]">
                      {allComplaints.map((c) => (
                        <tr key={c.id} className="hover:bg-[#f9f9ff]">
                          <td className="py-2.5 px-3 font-semibold text-[#111c2d] max-w-xs truncate">
                            {c.title}
                          </td>
                          <td className="py-2.5 px-3 text-[#444651]">
                            {c.student?.full_name || 'Öğrenci'}
                          </td>
                          <td className="py-2.5 px-3 text-[#444651]">
                            {c.block?.name} • {c.room_number}
                          </td>
                          <td className="py-2.5 px-3 text-[#444651]">
                            {c.category?.name}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100">
                              {c.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => handleDeleteComplaint(c.id, c.title)}
                              className="w-7 h-7 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center ml-auto active:scale-95"
                              title="Kaydı kalıcı sil"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Data Table 2: Announcements Manager */}
              <div className="bg-white rounded-3xl p-5 border border-[#e7eeff] shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#e7eeff] pb-3">
                  <div>
                    <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#006a61] text-[20px]">campaign</span>
                      Duyuru Verileri ({allAnnouncements.length})
                    </h3>
                    <p className="text-[11px] text-[#757682]">Yayındaki duyuruları listeleme ve kaldırma</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {allAnnouncements.map((a) => (
                    <div key={a.id} className="p-4 rounded-2xl bg-[#f9f9ff] border border-[#e7eeff] flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            a.is_urgent ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {a.is_urgent ? 'Acil Duyuru' : a.category}
                          </span>
                          <span className="text-[10px] text-[#757682]">
                            {new Date(a.created_at).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <h4 className="font-heading font-bold text-xs text-[#111c2d] mt-2">{a.title}</h4>
                        <p className="text-[11px] text-[#444651] mt-1 line-clamp-2">{a.content}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#e7eeff]">
                        <span className="text-[10px] text-[#757682]">Yayınlayan: {a.author?.full_name || 'İdare'}</span>
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id, a.title)}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-red-600 hover:bg-red-100/50 flex items-center gap-1 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>Kaldır</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
