import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import type {
  ComplaintResponse,
  AnnouncementResponse,
  DashboardStatsResponse,
  BuildingBlockResponse,
  CategoryResponse,
  UserSimple,
  ComplaintStatus,
  PriorityLevel,
} from '../types';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [blocks, setBlocks] = useState<BuildingBlockResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [staffList, setStaffList] = useState<UserSimple[]>([]);

  // Filters (Defaults to ACTIVE so RESOLVED complaints don't clog active dashboard)
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [blockFilter, setBlockFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintResponse | null>(null);
  const [updateStatus, setUpdateStatus] = useState<ComplaintStatus>('PENDING');
  const [updatePriority, setUpdatePriority] = useState<PriorityLevel>('NORMAL');
  const [updateAssignedTo, setUpdateAssignedTo] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // New Announcement Box state
  const [annTitle, setAnnTitle] = useState<string>('');
  const [annContent, setAnnContent] = useState<string>('');
  const [annCategory, setAnnCategory] = useState<string>('Genel');
  const [annBlockId, setAnnBlockId] = useState<string>('');
  const [annIsUrgent, setAnnIsUrgent] = useState<boolean>(false);
  const [annDurationDays, setAnnDurationDays] = useState<number>(7);
  const [isPublishingAnn, setIsPublishingAnn] = useState<boolean>(false);
  const [annSuccessMsg, setAnnSuccessMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, complaintsRes, annRes, blocksRes, catsRes, staffRes] = await Promise.all([
        apiClient.get<DashboardStatsResponse>('/stats'),
        apiClient.get<ComplaintResponse[]>('/complaints'),
        apiClient.get<AnnouncementResponse[]>('/announcements').catch(() => ({ data: [] })),
        apiClient.get<BuildingBlockResponse[]>('/blocks'),
        apiClient.get<CategoryResponse[]>('/categories'),
        apiClient.get<UserSimple[]>('/staff').catch(() => ({ data: [] })),
      ]);
      setStats(statsRes.data);
      setComplaints(complaintsRes.data);
      setAnnouncements(annRes.data);
      setBlocks(blocksRes.data);
      setCategories(catsRes.data);
      setStaffList(staffRes.data);
    } catch (err) {
      console.error('Yönetim verileri alınamadı:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      !statusFilter
        ? true
        : statusFilter === 'ACTIVE'
        ? c.status === 'PENDING' || c.status === 'IN_PROGRESS'
        : c.status === statusFilter;
    const matchesBlock = !blockFilter || c.block.id === blockFilter;
    const matchesCategory = !categoryFilter || c.category.id === categoryFilter;
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.student.tc_no.includes(searchQuery) ||
      c.room_number.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesBlock && matchesCategory && matchesSearch;
  });

  const handleOpenUpdateModal = (c: ComplaintResponse) => {
    setSelectedComplaint(c);
    setUpdateStatus(c.status);
    setUpdatePriority(c.priority);
    setUpdateAssignedTo(c.assigned_to ? c.assigned_to.id : '');
    setResolutionNote(c.resolution_note || '');
  };

  const handleSaveComplaintUpdate = async () => {
    if (!selectedComplaint) return;
    setIsUpdating(true);
    try {
      await apiClient.patch(`/complaints/${selectedComplaint.id}`, {
        status: updateStatus,
        priority: updatePriority,
        assigned_to_id: updateAssignedTo || null,
        resolution_note: resolutionNote.trim(),
      });
      setSelectedComplaint(null);
      await fetchDashboardData();
    } catch (err) {
      console.error('Talep güncellenirken hata oluştu:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePublishAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    setIsPublishingAnn(true);
    setAnnSuccessMsg(null);
    try {
      await apiClient.post('/announcements', {
        title: annTitle.trim(),
        content: annContent.trim(),
        category: annCategory,
        block_id: annBlockId || null,
        is_urgent: annIsUrgent,
        duration_days: annDurationDays,
      });
      setAnnTitle('');
      setAnnContent('');
      setAnnIsUrgent(false);
      setAnnSuccessMsg('Duyuru başarıyla tüm öğrencilerin ana sayfasına yayınlandı!');
      setTimeout(() => setAnnSuccessMsg(null), 4000);
      await fetchDashboardData();
    } catch (err) {
      console.error('Duyuru yayınlanırken hata oluştu:', err);
    } finally {
      setIsPublishingAnn(false);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (!window.confirm('Bu duyuruyu kaldırmak istediğinize emin misiniz?')) return;
    try {
      await apiClient.delete(`/announcements/${id}`);
      await fetchDashboardData();
    } catch (err) {
      console.error('Duyuru silinirken hata oluştu:', err);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6 max-w-7xl mx-auto pb-16">
      {/* 1. Header / Welcome Banner (Mobile-First) */}
      <section className="relative overflow-hidden rounded-3xl bg-[#00236f] dark:bg-[#1e293b] p-4 sm:p-8 text-white shadow-md">
        <div className="relative z-10 flex flex-col gap-1.5">
          <span className="text-[10px] sm:text-xs text-[#dce1ff]/80 font-medium">
            Kırşehir Mucur KYK • Elvin Buğra Arslan Yurdu
          </span>
          <h1 className="font-heading font-extrabold text-xl sm:text-3xl text-white tracking-tight leading-tight">
            Hoş Geldiniz, {user?.full_name}
          </h1>
        </div>
      </section>

      {/* 2. KPI Cards (2 Columns on mobile, 4 on desktop) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-[#e7eeff]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Aktif Talep
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-heading font-extrabold text-2xl sm:text-3xl text-[#111c2d]">
                  {(stats?.pending_complaints || 0) + (stats?.in_progress_complaints || 0)}
                </span>
                <span className="text-[10px] font-bold text-[#ba1a1a] bg-red-100 px-1.5 py-0.2 rounded-full">
                  {stats?.pending_complaints || 0} bekleyen
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-red-50 text-[#ba1a1a] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">assignment_late</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#e7eeff] text-[10px] text-[#444651] truncate">
            {stats?.in_progress_complaints || 0} teknisyende
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-[#e7eeff]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Doluluk Oranı
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-heading font-extrabold text-2xl sm:text-3xl text-[#00236f]">
                  %{stats?.occupancy_rate || 88.5}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-[#e7eeff] text-[#00236f] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">hotel</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#e7eeff] text-[10px] text-[#444651] truncate">
            Kapasite 960 yatak
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-[#e7eeff]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Çözüm Başarısı
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-heading font-extrabold text-2xl sm:text-3xl text-emerald-600">
                  %{stats?.resolution_rate || 94.2}
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">verified</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#e7eeff] text-[10px] text-[#444651] truncate">
            {stats?.resolved_complaints || 0} çözüldü
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-sm border border-[#e7eeff]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] sm:text-[11px] font-bold text-[#757682] uppercase tracking-wider block">
                Yanıt Süresi
              </span>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="font-heading font-extrabold text-2xl sm:text-3xl text-[#111c2d]">
                  {stats?.avg_resolution_hours || 4.2}
                  <span className="text-xs font-normal text-[#757682] ml-0.5">saat</span>
                </span>
              </div>
            </div>
            <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">timer</span>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-[#e7eeff] text-[10px] text-blue-700 font-semibold truncate">
            Hedef &lt; 6 saat
          </div>
        </div>
      </section>

      {/* 3. DUYURU PAYLAŞ & YÖNET KUTUSU (Announcement Box for Yurt Müdürü / Admin) */}
      <section className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 shadow-sm border border-[#e7eeff] dark:border-[#334155] flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#e7eeff] dark:border-[#334155] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#00236f] dark:bg-[#2563eb] text-white flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">campaign</span>
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-base sm:text-lg text-[#111c2d] dark:text-white">
                Yurt Duyurusu Paylaş & Yönet
              </h2>
              <p className="text-xs text-[#757682] dark:text-[#94a3b8]">
                Yurtta kalan öğrencilerin ana sayfasına ve bildirim ekranına düşecek yeni duyuru yayınlayın.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-[#f0f3ff] dark:bg-[#0f172a] text-[#00236f] dark:text-blue-400 text-xs font-bold border border-[#d8e3fb] dark:border-[#334155]">
            {announcements.length} Aktif Duyuru
          </span>
        </div>

        {annSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <span className="material-symbols-outlined text-[20px] text-emerald-600 dark:text-emerald-400">check_circle</span>
            <span>{annSuccessMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Post Creation Form (7 cols on lg) */}
          <form onSubmit={handlePublishAnnouncement} className="lg:col-span-7 flex flex-col gap-3 text-xs bg-[#f9f9ff] dark:bg-[#0f172a] p-4 sm:p-5 rounded-2xl border border-[#e7eeff] dark:border-[#334155]">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs text-[#00236f] dark:text-blue-400 uppercase tracking-wider">
                Yeni Duyuru Oluştur
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={annIsUrgent}
                  onChange={(e) => setAnnIsUrgent(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded"
                />
                <span className="text-xs font-bold text-red-600 dark:text-red-400">
                  🚨 Acil Duyuru
                </span>
              </label>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#111c2d] dark:text-white">Duyuru Başlığı *</label>
              <input
                type="text"
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder="Örn: Sıcak Su Bakım Çalışması, Yemekhane Saatleri"
                required
                className="h-10 px-3.5 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] text-xs font-semibold text-[#111c2d] dark:text-white outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#111c2d] dark:text-white">Hedef Blok</label>
                <select
                  value={annBlockId}
                  onChange={(e) => setAnnBlockId(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] text-xs font-semibold text-[#111c2d] dark:text-white outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors"
                >
                  <option value="">Tüm Yurt (Genel)</option>
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#111c2d] dark:text-white">Kategori</label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value)}
                  className="h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] text-xs font-semibold text-[#111c2d] dark:text-white outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors"
                >
                  <option value="Genel">Genel Bilgilendirme</option>
                  <option value="Yemekhane">Yemekhane Duyurusu</option>
                  <option value="Bakım/Arıza">Bakım / Onarım</option>
                  <option value="Acil">Acil Durum Bildirimi</option>
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="font-bold text-[#111c2d] dark:text-white">Yayında Kalma Süresi</label>
                <select
                  value={annDurationDays}
                  onChange={(e) => setAnnDurationDays(Number(e.target.value))}
                  className="h-10 px-3 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] text-xs font-semibold text-[#00236f] dark:text-blue-400 outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors"
                >
                  <option value={1}>1 Gün (24 Saat)</option>
                  <option value={3}>3 Gün</option>
                  <option value={7}>1 Hafta (7 Gün)</option>
                  <option value={14}>2 Hafta (14 Gün)</option>
                  <option value={30}>1 Ay (30 Gün)</option>
                  <option value={0}>Süresiz (Kalıcı)</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-bold text-[#111c2d] dark:text-white">Duyuru İçeriği & Detaylar *</label>
              <textarea
                value={annContent}
                onChange={(e) => setAnnContent(e.target.value)}
                rows={3}
                placeholder="Öğrencilere iletmek istediğiniz detaylı açıklama..."
                required
                className="p-3 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] text-xs font-medium text-[#111c2d] dark:text-white outline-none focus:border-[#00236f] dark:focus:border-blue-500 transition-colors resize-none leading-relaxed"
              ></textarea>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isPublishingAnn}
                className="px-6 py-2.5 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-heading font-bold shadow-md hover:bg-[#1e3a8a] dark:hover:bg-blue-600 disabled:opacity-50 active:scale-95 transition-all flex items-center gap-2"
              >
                {isPublishingAnn ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Yayınlanıyor...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Duyuruyu Yayınla</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Active Published Announcements Sidebar (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-2.5">
            <span className="font-heading font-bold text-xs text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider">
              Yayındaki Aktif Duyurular
            </span>

            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#757682] dark:text-[#94a3b8] bg-[#f9f9ff] dark:bg-[#0f172a] rounded-2xl border border-dashed border-[#c5c5d3] dark:border-[#334155]">
                  Henüz yayınlanmış aktif bir duyuru bulunmuyor.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className="p-3 rounded-2xl bg-[#f9f9ff] dark:bg-[#0f172a] border border-[#e7eeff] dark:border-[#334155] flex items-start justify-between gap-2 text-xs hover:border-[#b6c4ff] dark:hover:border-blue-500 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {ann.is_urgent && (
                          <span className="px-2 py-0.2 rounded-full bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 text-[9px] font-bold">
                            🚨 ACİL
                          </span>
                        )}
                        <span className="px-2 py-0.2 rounded-full bg-[#e7eeff] dark:bg-[#1e293b] text-[#00236f] dark:text-blue-300 text-[10px] font-bold">
                          {ann.category}
                        </span>
                        <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">
                          {ann.block?.name || 'Tüm Yurt'}
                        </span>
                      </div>
                      <h4 className="font-heading font-bold text-xs text-[#111c2d] dark:text-white truncate">
                        {ann.title}
                      </h4>
                      <p className="text-[11px] text-[#444651] dark:text-[#cbd5e1] line-clamp-2 leading-tight">
                        {ann.content}
                      </p>

                      <div className="text-[10px] text-[#006a61] dark:text-emerald-400 font-semibold flex items-center gap-1 pt-1">
                        <span className="material-symbols-outlined text-[13px]">schedule</span>
                        <span>
                          {ann.expires_at
                            ? `Bitiş: ${new Date(ann.expires_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}`
                            : 'Süresiz Yayında'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      title="Duyuruyu Sil"
                      className="w-7 h-7 rounded-lg text-[#ba1a1a] dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center justify-center shrink-0 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Filter Controls & Search (Mobile-First Wrap) */}
      <section className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-[#e7eeff] flex flex-col md:flex-row items-stretch gap-2.5">
        <div className="flex-1 flex items-center gap-2 bg-[#f0f3ff] rounded-xl px-3 py-2">
          <span className="material-symbols-outlined text-[18px] text-[#757682]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Öğrenci, oda no veya arıza ara..."
            className="w-full bg-transparent text-xs text-[#111c2d] placeholder:text-[#757682] outline-none font-medium"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <select
            value={blockFilter}
            onChange={(e) => setBlockFilter(e.target.value)}
            className="h-9 px-2 rounded-xl bg-[#f0f3ff] text-[11px] font-semibold text-[#111c2d] outline-none"
          >
            <option value="">Bloklar</option>
            {blocks.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 px-2 rounded-xl bg-[#f0f3ff] text-[11px] font-semibold text-[#111c2d] outline-none"
          >
            <option value="">Kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-2 rounded-xl bg-[#f0f3ff] text-[11px] font-bold text-[#00236f] outline-none"
          >
            <option value="ACTIVE">⚡ Aktif Talepler</option>
            <option value="RESOLVED">✅ Çözülen / Tamamlanan</option>
            <option value="PENDING">🕒 Bekleyen</option>
            <option value="IN_PROGRESS">🛠️ İşlemde</option>
            <option value="">📋 Tüm Talepler (Geçmiş Dahil)</option>
          </select>
        </div>
      </section>

      {/* 4. Complaints List: Responsive Hybrid (Card view on mobile, Table on desktop) */}
      <section className="bg-white rounded-3xl shadow-sm border border-[#e7eeff] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e7eeff] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00236f]"></span>
            <h2 className="font-heading font-bold text-sm sm:text-base text-[#111c2d]">
              Arıza & Talep Yönetim Masası
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-[#e7eeff] text-[#00236f] text-[10px] font-bold">
              {filteredComplaints.length}
            </span>
          </div>
        </div>

        {/* MOBILE CARDS VIEW (block md:hidden) */}
        <div className="block md:hidden divide-y divide-[#e7eeff]">
          {filteredComplaints.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#757682]">Kayıt bulunamadı.</div>
          ) : (
            filteredComplaints.map((comp) => (
              <div key={comp.id} className="p-4 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#f0f3ff] text-[#00236f] text-[10px] font-bold">
                      #TLP-{comp.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#757682]">
                      {new Date(comp.created_at).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  {comp.status === 'RESOLVED' ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      ✓ Çözüldü
                    </span>
                  ) : comp.status === 'IN_PROGRESS' ? (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                      ⚙ İşlemde
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                      ⏱ Beklemede
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="font-heading font-bold text-xs text-[#111c2d] leading-snug">
                    {comp.title}
                  </h3>
                  <p className="text-[11px] text-[#444651] mt-0.5 line-clamp-2">
                    {comp.description}
                  </p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#757682] pt-1 border-t border-[#f0f3ff]">
                  <div>
                    <span className="font-semibold text-[#111c2d]">{comp.student.full_name}</span>
                    <span className="mx-1">•</span>
                    <span>{comp.block.name} / {comp.room_number}</span>
                  </div>
                  <button
                    onClick={() => handleOpenUpdateModal(comp)}
                    className="px-3 py-1.5 rounded-xl bg-[#00236f] text-white font-heading font-bold text-[11px] active:scale-95"
                  >
                    Yönet
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP TABLE VIEW (hidden md:table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#f9f9ff] text-[#757682] uppercase text-[10px] font-bold border-b border-[#e7eeff]">
              <tr>
                <th className="py-3.5 px-4">Talep No / Tarih</th>
                <th className="py-3.5 px-4">Öğrenci / Oda</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-4">Konu & Açıklama</th>
                <th className="py-3.5 px-4">Öncelik</th>
                <th className="py-3.5 px-4">Görevli</th>
                <th className="py-3.5 px-4">Durum</th>
                <th className="py-3.5 px-4 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e7eeff]">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#757682]">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((comp) => (
                  <tr key={comp.id} className="hover:bg-[#f0f3ff]/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#00236f]">
                      <div>#TLP-{comp.id.slice(0, 6).toUpperCase()}</div>
                      <div className="text-[10px] text-[#757682] font-sans">
                        {new Date(comp.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-heading font-bold text-[#111c2d]">
                        {comp.student.full_name}
                      </div>
                      <div className="text-[10px] text-[#757682]">
                        {comp.block.name} • {comp.room_number}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#e7eeff] text-[#00236f] font-semibold text-[11px]">
                        <span className="material-symbols-outlined text-[14px]">
                          {comp.category.icon || 'build'}
                        </span>
                        {comp.category.name}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-[#111c2d] truncate">{comp.title}</div>
                      <div className="text-[11px] text-[#444651] truncate">{comp.description}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {comp.priority === 'URGENT' ? (
                        <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-bold text-[10px]">
                          Acil
                        </span>
                      ) : comp.priority === 'HIGH' ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">
                          Yüksek
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          Normal
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-[#444651]">
                      {comp.assigned_to ? (
                        <span className="font-semibold text-[#006a61]">
                          {comp.assigned_to.full_name.split(' ')[0]}
                        </span>
                      ) : (
                        <span className="text-[#757682] italic">Atama Yok</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {comp.status === 'RESOLVED' ? (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] inline-flex items-center gap-1">
                          ✓ Çözüldü
                        </span>
                      ) : comp.status === 'IN_PROGRESS' ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px] inline-flex items-center gap-1">
                          ⚙ İşlemde
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 font-bold text-[11px] inline-flex items-center gap-1">
                          ⏱ Beklemede
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenUpdateModal(comp)}
                        className="px-3 py-1.5 rounded-xl bg-[#00236f] hover:bg-[#1e3a8a] text-white font-heading font-semibold text-[11px] transition-colors"
                      >
                        Yönet & Not Ekle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Status Update Modal (Bottom sheet on mobile) */}
      {selectedComplaint && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in"
          onClick={() => setSelectedComplaint(null)}
        >
          <div 
            className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-[#e7eeff] flex flex-col gap-3.5 max-h-[90vh] overflow-y-auto pb-safe"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#e7eeff] pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#00236f] uppercase">
                  #TLP-{selectedComplaint.id.slice(0, 6).toUpperCase()}
                </span>
                <h3 className="font-heading font-extrabold text-base sm:text-lg text-[#111c2d]">
                  Talep Durumunu Yönet
                </h3>
              </div>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#757682] hover:bg-[#f0f3ff]"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#f0f3ff] p-3 rounded-2xl flex flex-col gap-0.5">
              <span className="text-xs font-bold text-[#00236f]">{selectedComplaint.title}</span>
              <span className="text-[11px] text-[#444651]">
                {selectedComplaint.student.full_name} • {selectedComplaint.block.name} • {selectedComplaint.room_number}
              </span>
            </div>

            {/* Status Selector */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#111c2d]">Statü Seçimi</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'PENDING', label: 'Beklemede', color: 'bg-blue-600 text-white' },
                  { id: 'IN_PROGRESS', label: 'İşleme Alındı', color: 'bg-amber-600 text-white' },
                  { id: 'RESOLVED', label: 'Çözüldü', color: 'bg-emerald-600 text-white' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setUpdateStatus(st.id as ComplaintStatus)}
                    className={`py-2 px-1 rounded-xl text-xs font-heading font-bold border transition-all active:scale-95 ${
                      updateStatus === st.id ? st.color : 'bg-white text-[#444651] border-[#c5c5d3]'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Assigned Staff */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#111c2d]">Görevli Personel Ata</label>
              <select
                value={updateAssignedTo}
                onChange={(e) => setUpdateAssignedTo(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-[#f0f3ff] text-xs font-semibold text-[#111c2d] outline-none"
              >
                <option value="">Personel Seçilmedi</option>
                {staffList.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.full_name} ({st.role === 'MANAGER' ? 'Yurt Müdürü' : 'Görevli'})
                  </option>
                ))}
              </select>
            </div>

            {/* Resolution Note */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#111c2d]">Çözüm & Süreç Açıklama Notu</label>
              <textarea
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                rows={3}
                placeholder="Öğrencinin takip ekranında görebileceği not..."
                className="w-full p-3 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none resize-none"
              ></textarea>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedComplaint(null)}
                className="flex-1 py-3 rounded-xl border border-[#c5c5d3] text-xs font-heading font-semibold text-[#444651] active:scale-95"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSaveComplaintUpdate}
                disabled={isUpdating}
                className="flex-[2] py-3 rounded-xl bg-[#00236f] text-white text-xs font-heading font-bold shadow-md hover:bg-[#1e3a8a] disabled:opacity-50 active:scale-95"
              >
                {isUpdating ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
