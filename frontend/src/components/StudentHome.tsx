import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { apiClient } from '../api/client';
import type { ComplaintResponse, AnnouncementResponse, CafeteriaMenuResponse } from '../types';

interface StudentHomeProps {
  setActiveTab: (tab: string) => void;
}

export const StudentHome: React.FC<StudentHomeProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();

  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [menus, setMenus] = useState<CafeteriaMenuResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals & UI States
  const [showIdCard, setShowIdCard] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWifiModal, setShowWifiModal] = useState(false);
  const [showLaundryModal, setShowLaundryModal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<'DINNER' | 'LUNCH'>('DINNER');
  const [votedMenuId, setVotedMenuId] = useState<string | null>(null);
  const [voteScore, setVoteScore] = useState<number | null>(null);

  // Leave Form State
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveDestination, setLeaveDestination] = useState('');
  const [leaveReason, setLeaveReason] = useState('Aile Ziyareti / Hafta Sonu');
  const [leaveSuccess, setLeaveSuccess] = useState(false);

  // Saved leaves list (persisted in localStorage for student)
  const [leaves, setLeaves] = useState<Array<{
    id: string;
    start: string;
    end: string;
    dest: string;
    reason: string;
    status: 'ONAYLANDI' | 'BEKLEMEDE';
  }>>(() => {
    const saved = localStorage.getItem(`student_leaves_${user?.tc_no}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [complaintsRes, announcementsRes, menusRes] = await Promise.all([
        apiClient.get<ComplaintResponse[]>('/complaints/my').catch(() => ({ data: [] })),
        apiClient.get<AnnouncementResponse[]>('/announcements').catch(() => ({ data: [] })),
        apiClient.get<CafeteriaMenuResponse[]>('/cafeteria/today').catch(() => ({ data: [] })),
      ]);
      setComplaints(complaintsRes.data);
      setAnnouncements(announcementsRes.data);
      setMenus(menusRes.data);
    } catch (err) {
      console.error('Veriler yüklenirken hata oluştu:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRateMenu = async (menuId: string, rating: number) => {
    try {
      setVotedMenuId(menuId);
      setVoteScore(rating);
      await apiClient.post(`/cafeteria/${menuId}/rate`, { rating });
      // update local
      setMenus((prev) =>
        prev.map((m) => (m.id === menuId ? { ...m, rating: Number(((m.rating * m.review_count + rating) / (m.review_count + 1)).toFixed(1)), review_count: m.review_count + 1 } : m))
      );
    } catch (err) {
      console.warn('Oylama yapılamadı:', err);
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStartDate || !leaveEndDate || !leaveDestination) return;
    const newLeave = {
      id: `LV-${Math.floor(100 + Math.random() * 900)}`,
      start: leaveStartDate,
      end: leaveEndDate,
      dest: leaveDestination,
      reason: leaveReason,
      status: 'BEKLEMEDE' as const,
    };
    const updated = [newLeave, ...leaves];
    setLeaves(updated);
    if (user?.tc_no) {
      localStorage.setItem(`student_leaves_${user.tc_no}`, JSON.stringify(updated));
    }
    setLeaveSuccess(true);
    setTimeout(() => {
      setLeaveSuccess(false);
      setShowLeaveModal(false);
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveDestination('');
    }, 1800);
  };

  const activeComplaint = complaints.find((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS');
  const urgentAnnouncements = announcements.filter((a) => a.is_urgent);
  const regularAnnouncements = announcements.filter((a) => !a.is_urgent);

  // Filter today menu by selected meal type if available
  const activeMenu = menus.find((m) => m.meal_type === selectedMealType) || menus[0];


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div 
          className="w-10 h-10 border-3 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: settings.primary_color, borderTopColor: 'transparent' }}
        ></div>
        <span className="text-xs font-heading font-semibold text-[#757682]">Öğrenci Portalı Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-4xl mx-auto pb-16 animate-in fade-in">
      {/* ========================================================================= */}
      {/* 1. STUDENT GREETING & DIGITAL DORM PASS CARD (Mobile-First Hero) */}
      {/* ========================================================================= */}
      <section 
        className="relative overflow-hidden rounded-3xl p-4 sm:p-6 text-white shadow-xl bg-[#00236f] dark:bg-[#1e293b] border border-transparent dark:border-[#334155]"
      >
        {/* Subtle decorative architectural pattern */}
        <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none">
          <svg fill="none" height="190" viewBox="0 0 100 100" width="190">
            <path d="M10 55 L50 20 L90 55" stroke="currentColor" strokeLinecap="round" strokeWidth="10" />
            <circle cx="50" cy="62" r="16" stroke="currentColor" strokeWidth="6" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col gap-3 sm:gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[#89f5e7] text-[10px] sm:text-xs font-bold shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#89f5e7] animate-pulse"></span>
                  {settings.hero_badge}
                </span>
                <span className="text-white/70 text-[11px] font-medium hidden sm:inline">
                  • {settings.site_subtitle}
                </span>
              </div>

              <h1 className="font-heading font-extrabold text-xl sm:text-3xl tracking-tight text-white leading-tight mt-1 truncate">
                Merhaba, {user?.full_name?.split(' ')[0] || 'Öğrenci'} 👋
              </h1>
              
              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/90 mt-0.5 flex-wrap">
                <span className="font-semibold">{user?.block?.name || 'Öğrenci Yurdu'}</span>
                <span className="opacity-60">•</span>
                <span className="bg-white/15 px-2 py-0.5 rounded-lg text-white font-bold text-[11px]">
                  Oda: {user?.room_number || '304'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TOUCH-FRIENDLY QUICK ACTION TILES (Mobile 2x2 / 4x1) */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Action 1: New Request */}
        <button
          onClick={() => setActiveTab('new-request')}
          className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-[#00236f] dark:bg-[#2563eb] text-white shadow-md active:scale-95 transition-transform group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]">add_circle</span>
          </div>
          <span className="font-heading font-bold text-xs">Arıza & Talep Aç</span>
          <span className="text-[9px] text-[#dce1ff] dark:text-blue-100 mt-0.5">Oda & Tesis Bildirimi</span>
        </button>

        {/* Action 2: Leave Request (Evci İzni) */}
        <button
          onClick={() => setShowLeaveModal(true)}
          className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1e293b] text-[#111c2d] dark:text-white border border-[#e7eeff] dark:border-[#334155] shadow-sm active:scale-95 transition-transform group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]">flight_takeoff</span>
          </div>
          <span className="font-heading font-bold text-xs">İzin Talebi (Evci)</span>
          <span className="text-[9px] text-[#757682] dark:text-[#94a3b8] mt-0.5">Hafta Sonu İzni</span>
        </button>

        {/* Action 3: Cafeteria */}
        <button
          onClick={() => setActiveTab('cafeteria')}
          className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1e293b] text-[#111c2d] dark:text-white border border-[#e7eeff] dark:border-[#334155] shadow-sm active:scale-95 transition-transform group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]">restaurant_menu</span>
          </div>
          <span className="font-heading font-bold text-xs">Yemekhane Menüsü</span>
          <span className="text-[9px] text-[#757682] dark:text-[#94a3b8] mt-0.5">Kalori & Oylama</span>
        </button>

        {/* Action 4: Guide & Contact */}
        <button
          onClick={() => setActiveTab('guide')}
          className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#1e293b] text-[#111c2d] dark:text-white border border-[#e7eeff] dark:border-[#334155] shadow-sm active:scale-95 transition-transform group text-center"
        >
          <div className="w-10 h-10 rounded-2xl bg-red-100 dark:bg-red-900/40 text-[#ba1a1a] dark:text-red-300 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-[22px]">contact_support</span>
          </div>
          <span className="font-heading font-bold text-xs">Rehber & Nöbetçi</span>
          <span className="text-[9px] text-[#757682] dark:text-[#94a3b8] mt-0.5">7/24 İletişim</span>
        </button>
      </section>

      {/* ========================================================================= */}
      {/* 3. ACTIVE REQUEST PROCESS TIMELINE (Enhanced Student Lifecycle) */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-2.5 sm:gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#006a61] dark:bg-emerald-400"></span>
            <h2 className="font-heading font-bold text-sm sm:text-base text-[#111c2d] dark:text-white">
              Son Talep Takibi
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('my-requests')}
            className="text-xs font-heading font-semibold text-[#006a61] dark:text-emerald-400 hover:text-[#00236f] dark:hover:text-emerald-300 flex items-center gap-0.5 transition-colors"
          >
            Tüm Taleplerim ({complaints.length})
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>

        {activeComplaint ? (
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-5 shadow-sm border border-[#e7eeff] dark:border-[#334155] hover:shadow-md transition-shadow relative overflow-hidden flex flex-col gap-3">
            <div className="h-1.5 absolute top-0 inset-x-0 bg-[#00236f] dark:bg-[#2563eb]"></div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#f0f3ff] dark:bg-[#0f172a] text-[#00236f] dark:text-blue-400 text-[11px] font-mono font-bold">
                  #TLP-{activeComplaint.id.slice(0, 6).toUpperCase()}
                </span>
                <span className="text-[11px] text-[#757682] dark:text-[#94a3b8]">
                  {new Date(activeComplaint.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {activeComplaint.status === 'RESOLVED' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span> Çözüldü
                </span>
              )}
              {activeComplaint.status === 'IN_PROGRESS' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse"></span> İşlemde
                </span>
              )}
              {activeComplaint.status === 'PENDING' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[13px]">schedule</span> Sıraya Alındı
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-1 text-[#006a61] dark:text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-0.5">
                <span className="material-symbols-outlined text-[15px]">{activeComplaint.category?.icon || 'build'}</span>
                <span>{activeComplaint.category?.name}</span>
              </div>
              <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] dark:text-white leading-snug">
                {activeComplaint.title}
              </h3>
              <p className="text-xs text-[#444651] dark:text-[#cbd5e1] mt-0.5 line-clamp-2">
                {activeComplaint.description}
              </p>
            </div>

            {/* Stepper Progress Visualizer */}
            <div className="bg-[#f0f3ff] dark:bg-[#0f172a] rounded-2xl p-3 sm:p-4 border border-[#e7eeff]/60 dark:border-[#334155]">
              <div className="flex items-center justify-between text-[11px] text-[#444651] dark:text-[#94a3b8] mb-2.5 font-medium">
                <span className="font-heading font-bold text-[#00236f] dark:text-white">Süreç Durumu</span>
                <span className="text-[#006a61] dark:text-emerald-400 font-bold">
                  {activeComplaint.status === 'RESOLVED' ? '4/4 • Tamamlandı' : activeComplaint.status === 'IN_PROGRESS' ? '3/4 • Teknisyen Çalışıyor' : '1/4 • Talebiniz Alındı'}
                </span>
              </div>

              <div className="relative flex items-center justify-between px-2 pt-1 pb-1">
                <div className="absolute left-4 right-4 top-3.5 h-0.5 bg-[#d8e3fb] dark:bg-[#334155] -z-0"></div>
                <div 
                  className="absolute left-4 top-3.5 h-0.5 bg-[#006a61] dark:bg-emerald-500 -z-0 transition-all duration-500"
                  style={{
                    width: activeComplaint.status === 'RESOLVED' ? 'calc(100% - 32px)' : activeComplaint.status === 'IN_PROGRESS' ? '66%' : '10%'
                  }}
                ></div>

                {/* Step 1: Alındı */}
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className="w-6 h-6 rounded-full bg-[#006a61] dark:bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                    ✓
                  </div>
                  <span className="text-[9px] font-bold text-[#006a61] dark:text-emerald-400">Alındı</span>
                </div>

                {/* Step 2: İncelendi */}
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${activeComplaint.status !== 'PENDING' ? 'bg-[#006a61] dark:bg-emerald-500 text-white' : 'bg-white dark:bg-[#1e293b] text-[#757682] dark:text-[#94a3b8] border border-[#c5c5d3] dark:border-[#334155]'}`}>
                    {activeComplaint.status !== 'PENDING' ? '✓' : '2'}
                  </div>
                  <span className={`text-[9px] font-bold ${activeComplaint.status !== 'PENDING' ? 'text-[#006a61] dark:text-emerald-400' : 'text-[#757682] dark:text-[#94a3b8]'}`}>İncelendi</span>
                </div>

                {/* Step 3: İşlemde */}
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${activeComplaint.status === 'IN_PROGRESS' || activeComplaint.status === 'RESOLVED' ? 'bg-[#006a61] dark:bg-emerald-500 text-white' : 'bg-white dark:bg-[#1e293b] text-[#757682] dark:text-[#94a3b8] border border-[#c5c5d3] dark:border-[#334155]'}`}>
                    {activeComplaint.status === 'IN_PROGRESS' || activeComplaint.status === 'RESOLVED' ? '✓' : '3'}
                  </div>
                  <span className={`text-[9px] font-bold ${activeComplaint.status === 'IN_PROGRESS' || activeComplaint.status === 'RESOLVED' ? 'text-[#006a61] dark:text-emerald-400' : 'text-[#757682] dark:text-[#94a3b8]'}`}>Müdahale</span>
                </div>

                {/* Step 4: Çözüldü */}
                <div className="flex flex-col items-center gap-1 z-10">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${activeComplaint.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#1e293b] text-[#757682] dark:text-[#94a3b8] border border-[#c5c5d3] dark:border-[#334155]'}`}>
                    {activeComplaint.status === 'RESOLVED' ? '✓' : '4'}
                  </div>
                  <span className={`text-[9px] font-bold ${activeComplaint.status === 'RESOLVED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#757682] dark:text-[#94a3b8]'}`}>Çözüldü</span>
                </div>
              </div>
            </div>

            {/* Assigned Staff or Resolution Note */}
            {activeComplaint.assigned_to && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 text-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-blue-700 dark:text-blue-300">engineering</span>
                  <span className="text-[#111c2d] dark:text-white font-semibold">
                    Görevli: <strong>{activeComplaint.assigned_to.full_name}</strong>
                  </span>
                </div>
                <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold">Teknik Birim</span>
              </div>
            )}

            {activeComplaint.resolution_note && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2 leading-relaxed">
                <span className="material-symbols-outlined text-[18px] text-emerald-700 dark:text-emerald-400 shrink-0">task_alt</span>
                <div>
                  <span className="font-bold block text-emerald-800 dark:text-emerald-300">Teknik Çözüm Notu:</span>
                  {activeComplaint.resolution_note}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 text-center border border-dashed border-[#c5c5d3] dark:border-[#334155] text-[#444651] dark:text-[#94a3b8] flex flex-col items-center gap-2">
            <span className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">task_alt</span>
            </span>
            <p className="text-xs font-heading font-bold text-[#111c2d] dark:text-white">Şu an aktif bir arıza veya talebiniz bulunmuyor.</p>
            <p className="text-[11px] text-[#757682] dark:text-[#94a3b8]">Odanızda herhangi bir aksaklık olduğunda hemen bildirim oluşturabilirsiniz.</p>
            <button
              onClick={() => setActiveTab('new-request')}
              className="mt-1 px-4 py-2 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-bold active:scale-95 transition-all"
            >
              + Yeni Arıza Bildir
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* 4. TODAY'S CAFETERIA SNAPSHOT & INSTANT VOTING */}
      {/* ========================================================================= */}
      {activeMenu && (
        <section className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-5 shadow-sm border border-[#e7eeff] dark:border-[#334155] flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">restaurant</span>
              </div>
              <div>
                <h3 className="font-heading font-extrabold text-xs sm:text-sm text-[#111c2d] dark:text-white">
                  Günün Yemekhane Menüsü
                </h3>
                <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">
                  {selectedMealType === 'DINNER' ? 'Akşam Servisi' : 'Öğle Servisi'} • {activeMenu.calories} kcal
                </span>
              </div>
            </div>

            {/* Lunch / Dinner Selector */}
            <div className="flex items-center bg-[#f0f3ff] dark:bg-[#0f172a] p-1 rounded-xl text-[10px] font-heading font-bold">
              <button
                onClick={() => setSelectedMealType('LUNCH')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedMealType === 'LUNCH' ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-sm' : 'text-[#757682] dark:text-[#94a3b8]'
                }`}
              >
                Öğle
              </button>
              <button
                onClick={() => setSelectedMealType('DINNER')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedMealType === 'DINNER' ? 'bg-white dark:bg-[#2563eb] text-[#00236f] dark:text-white shadow-sm' : 'text-[#757682] dark:text-[#94a3b8]'
                }`}
              >
                Akşam
              </button>
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-[#f0f3ff] dark:bg-[#0f172a] p-2.5 rounded-2xl flex flex-col">
              <span className="text-[9px] text-[#757682] dark:text-[#94a3b8] uppercase font-bold">Çorba</span>
              <span className="font-bold text-[#111c2d] dark:text-white mt-0.5 truncate">{activeMenu.soup}</span>
            </div>
            <div className="bg-[#f0f3ff] dark:bg-[#0f172a] p-2.5 rounded-2xl flex flex-col">
              <span className="text-[9px] text-[#757682] dark:text-[#94a3b8] uppercase font-bold">Ana Yemek</span>
              <span className="font-bold text-[#00236f] dark:text-[#60a5fa] mt-0.5 truncate">{activeMenu.main_course}</span>
            </div>
            <div className="bg-[#f0f3ff] dark:bg-[#0f172a] p-2.5 rounded-2xl flex flex-col">
              <span className="text-[9px] text-[#757682] dark:text-[#94a3b8] uppercase font-bold">Yan Yemek</span>
              <span className="font-bold text-[#111c2d] dark:text-white mt-0.5 truncate">{activeMenu.side_dish}</span>
            </div>
            <div className="bg-[#f0f3ff] dark:bg-[#0f172a] p-2.5 rounded-2xl flex flex-col">
              <span className="text-[9px] text-[#757682] dark:text-[#94a3b8] uppercase font-bold">Tatlı / Meyve</span>
              <span className="font-bold text-[#111c2d] dark:text-white mt-0.5 truncate">{activeMenu.extra}</span>
            </div>
          </div>

          {/* Quick Rate Widget */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#e7eeff] dark:border-[#334155] text-xs">
            <div className="flex items-center gap-1.5 text-[#444651] dark:text-[#cbd5e1]">
              <span className="material-symbols-outlined text-[18px] text-amber-500 fill-current">star</span>
              <span className="font-bold text-[#111c2d] dark:text-white">{activeMenu.rating}</span>
              <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">({activeMenu.review_count} değerlendirme)</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-[#757682] dark:text-[#94a3b8] mr-1">Öğünü Oyla:</span>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRateMenu(activeMenu.id, star)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                    votedMenuId === activeMenu.id && voteScore && voteScore >= star
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                      : 'hover:bg-gray-100 dark:hover:bg-[#334155] text-[#c5c5d3] dark:text-[#64748b]'
                  }`}
                  title={`${star} Yıldız`}
                >
                  <span className="material-symbols-outlined text-[18px]">star</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. RECENT ANNOUNCEMENTS */}
      {/* ========================================================================= */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-[#60a5fa]">campaign</span>
            <h2 className="font-heading font-bold text-sm sm:text-base text-[#111c2d] dark:text-white">
              Yurt Duyuruları
            </h2>
          </div>
          <span className="text-xs text-[#757682] dark:text-[#94a3b8]">{regularAnnouncements.length} Güncel</span>
        </div>

        <div className="flex flex-col gap-2.5">
          {regularAnnouncements.length === 0 ? (
            <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-5 text-center border border-dashed border-[#c5c5d3] dark:border-[#334155] text-xs text-[#757682] dark:text-[#94a3b8]">
              Şu anda aktif bir yurt duyurusu bulunmamaktadır.
            </div>
          ) : (
            regularAnnouncements.slice(0, 3).map((ann) => (
              <div
                key={ann.id}
                className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 shadow-sm border border-[#e7eeff] dark:border-[#334155] hover:border-[#b6c4ff] dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#e7eeff] dark:bg-[#0f172a] text-[#00236f] dark:text-[#60a5fa] text-[10px] font-bold">
                    {ann.category}
                  </span>
                  <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">
                    {new Date(ann.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-xs sm:text-sm text-[#111c2d] dark:text-white mb-0.5">
                  {ann.title}
                </h3>
                <p className="text-[11px] text-[#444651] dark:text-[#cbd5e1] leading-relaxed line-clamp-2">
                  {ann.content}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL 1: EVCİ / HAFTA SONU İZİN TALEBİ FORMU */}
      {/* ========================================================================= */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md bg-white dark:bg-[#1e293b] rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e7eeff] dark:border-[#334155] p-5 sm:p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">flight_takeoff</span>
                </span>
                <div>
                  <h3 className="font-heading font-extrabold text-sm sm:text-base text-[#111c2d] dark:text-white">
                    Evci & Hafta Sonu İzin Formu
                  </h3>
                  <p className="text-[10px] text-[#757682] dark:text-[#94a3b8]">GSB Yurt İzin Sistemi Entegrasyonu</p>
                </div>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-[#757682] dark:text-[#94a3b8] hover:text-black dark:hover:text-white">
                ✕
              </button>
            </div>

            {leaveSuccess ? (
              <div className="p-6 text-center flex flex-col items-center gap-2 animate-in zoom-in">
                <span className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center text-[30px] font-bold">
                  ✓
                </span>
                <h4 className="font-heading font-bold text-sm text-[#111c2d] dark:text-white">İzin Talebiniz Alındı</h4>
                <p className="text-xs text-[#757682] dark:text-[#94a3b8]">Nöbetçi idare onayına sunuldu. Bildirim durumunuz güncellenecektir.</p>
              </div>
            ) : (
              <form onSubmit={handleLeaveSubmit} className="flex flex-col gap-3 text-xs">
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[#111c2d] dark:text-white">Ayrılış Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={leaveStartDate}
                      onChange={(e) => setLeaveStartDate(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-[#e7eeff] dark:border-[#334155] bg-[#f9f9ff] dark:bg-[#0f172a] text-[#111c2d] dark:text-white text-xs font-semibold outline-none focus:border-[#00236f] dark:focus:border-blue-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="font-bold text-[#111c2d] dark:text-white">Dönüş Tarihi *</label>
                    <input
                      type="date"
                      required
                      value={leaveEndDate}
                      onChange={(e) => setLeaveEndDate(e.target.value)}
                      className="h-10 px-3 rounded-xl border border-[#e7eeff] dark:border-[#334155] bg-[#f9f9ff] dark:bg-[#0f172a] text-[#111c2d] dark:text-white text-xs font-semibold outline-none focus:border-[#00236f] dark:focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-bold text-[#111c2d] dark:text-white">Gidilecek İl & Açık Adres *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Ankara / Çankaya - Aile Yanı"
                    value={leaveDestination}
                    onChange={(e) => setLeaveDestination(e.target.value)}
                    className="h-10 px-3 rounded-xl border border-[#e7eeff] dark:border-[#334155] bg-[#f9f9ff] dark:bg-[#0f172a] text-[#111c2d] dark:text-white text-xs font-semibold outline-none focus:border-[#00236f] dark:focus:border-blue-500"
                  />
                </div>


                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-800 text-[10px] text-purple-900 dark:text-purple-200 leading-snug">
                  📌 <strong>Yurt Kuralı:</strong> Hafta sonu izinleri Cuma günü saat 17:00'a kadar sistem üzerinden girilmelidir. Kalan yıllık izin hakkınız: <strong>26 gün</strong>.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#e7eeff] dark:border-[#334155]">
                  <button
                    type="button"
                    onClick={() => setShowLeaveModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#757682] dark:text-[#94a3b8] hover:bg-gray-100 dark:hover:bg-[#334155]"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-bold shadow-md active:scale-95"
                  >
                    İzin Talebini Onaya Gönder
                  </button>
                </div>
              </form>
            )}

            {/* Leave History List */}
            {leaves.length > 0 && (
              <div className="pt-3 border-t border-[#e7eeff] dark:border-[#334155]">
                <span className="text-[10px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block mb-2">
                  Son İzin Kayıtlarım
                </span>
                <div className="flex flex-col gap-1.5">
                  {leaves.map((l) => (
                    <div key={l.id} className="p-2.5 rounded-xl bg-[#f9f9ff] dark:bg-[#0f172a] border border-[#e7eeff] dark:border-[#334155] flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-[#111c2d] dark:text-white">{l.dest}</div>
                        <div className="text-[10px] text-[#757682] dark:text-[#94a3b8]">{l.start} - {l.end}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        l.status === 'ONAYLANDI' ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                      }`}>
                        {l.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: WIFI HIZLI BAĞLANTI & ŞİFRE YENİLEME */}
      {/* ========================================================================= */}
      {showWifiModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#e7eeff] dark:border-[#334155] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">wifi</span>
                </span>
                <h3 className="font-heading font-extrabold text-sm text-[#111c2d] dark:text-white">KYKWifi Bağlantı Rehberi</h3>
              </div>
              <button onClick={() => setShowWifiModal(false)} className="text-[#757682] dark:text-[#94a3b8]">✕</button>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[#444651] dark:text-[#cbd5e1]">
              <div className="p-3 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#00236f] dark:text-blue-400">Ağ Adı (SSID):</span>
                <span className="font-mono font-bold text-sm text-[#111c2d] dark:text-white">KYK_WIFI</span>
              </div>
              <div className="p-3 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] flex flex-col gap-1">
                <span className="text-[10px] font-bold text-[#00236f] dark:text-blue-400">Kullanıcı Adınız:</span>
                <span className="font-mono font-bold text-sm text-[#111c2d] dark:text-white">{user?.tc_no}</span>
              </div>
              <p className="text-[11px] text-[#757682] dark:text-[#94a3b8] leading-relaxed pt-1">
                Şifrenizi e-Devlet üzerindeki <strong>"GSB Yurt Wi-Fi Hizmeti Taahhütnamesi"</strong> bölümünden görüntüleyebilir ve değiştirebilirsiniz.
              </p>
            </div>

            <button
              onClick={() => setShowWifiModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-bold active:scale-95"
            >
              Anladım
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ÇAMAŞIRHANE DURUM KARTI */}
      {/* ========================================================================= */}
      {showLaundryModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#e7eeff] dark:border-[#334155] flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">local_laundry_service</span>
                </span>
                <h3 className="font-heading font-extrabold text-sm text-[#111c2d] dark:text-white">Çamaşırhane Canlı Durum</h3>
              </div>
              <button onClick={() => setShowLaundryModal(false)} className="text-[#757682] dark:text-[#94a3b8]">✕</button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-center">
                  <span className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300">5</span>
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-200 font-bold block">Boş Yıkama Makinesi</span>
                </div>
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-center">
                  <span className="text-xl font-extrabold text-blue-700 dark:text-blue-300">3</span>
                  <span className="text-[10px] text-blue-800 dark:text-blue-200 font-bold block">Boş Kurutma</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] text-[11px] text-[#444651] dark:text-[#cbd5e1] leading-relaxed">
                📍 <strong>Konum:</strong> Sosyal Tesis Zemin Kat<br />
                ⏰ <strong>Saatler:</strong> Her gün 08:30 - 22:30 (Sıra sistemiyle çalışır)
              </div>
            </div>

            <button
              onClick={() => setShowLaundryModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-bold active:scale-95"
            >
              Tamam
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
