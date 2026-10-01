import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import type { ComplaintResponse, ComplaintStatus } from '../types';

interface MyComplaintsProps {
  setActiveTab: (tab: string) => void;
}

export const MyComplaints: React.FC<MyComplaintsProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintResponse[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchComplaints = async () => {
    setIsLoading(true);
    try {
      const endpoint = user?.role === 'STUDENT' ? '/complaints/my' : '/complaints';
      const res = await apiClient.get<ComplaintResponse[]>(endpoint);
      setComplaints(res.data);
    } catch (err) {
      console.error('Talepler yüklenemedi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [user]);

  const filteredComplaints = complaints.filter((c) => {
    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'ACTIVE'
        ? c.status === 'PENDING' || c.status === 'IN_PROGRESS'
        : c.status === filterStatus;

    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.name.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shadow-sm">
            <span className="material-symbols-outlined text-[13px]">check_circle</span> Çözüldü
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span> İşlemde
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-bold shadow-sm">
            <span className="material-symbols-outlined text-[13px]">schedule</span> Beklemede
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold shadow-sm">
            <span className="material-symbols-outlined text-[13px]">cancel</span> İptal
          </span>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 gap-2">
        <div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00236f] dark:text-white tracking-tight">
            {user?.role === 'STUDENT' ? 'Taleplerim & Süreç Takibi' : 'Arıza & Bildirim Listesi'}
          </h1>
          <p className="text-[11px] sm:text-xs text-[#444651] dark:text-[#94a3b8]">
            Gerçek zamanlı arıza ve onarım aşamaları.
          </p>
        </div>

        {user?.role === 'STUDENT' && (
          <button
            onClick={() => setActiveTab('new-request')}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-heading font-bold shadow-sm active:scale-95 transition-transform shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            <span className="hidden sm:inline">Yeni Talep</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-white dark:bg-[#1e293b] rounded-2xl p-2 sm:p-2.5 shadow-sm border border-[#e7eeff] dark:border-[#334155] mb-3">
        <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#94a3b8] ml-2">search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Talep no, konu, kategori veya oda ara..."
          className="flex-1 bg-transparent text-xs text-[#111c2d] dark:text-white placeholder:text-[#757682] dark:placeholder:text-[#64748b] outline-none font-medium"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-[#757682] dark:text-[#94a3b8] hover:text-[#111c2d] dark:hover:text-white pr-2">
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* Horizontally Swipeable Filter Pills (Mobile-First) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-4">
        {[
          { id: 'ACTIVE', label: '⚡ Aktif Talepler', count: complaints.filter((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length },
          { id: 'RESOLVED', label: '✅ Çözülen Talepler', count: complaints.filter((c) => c.status === 'RESOLVED').length },
          { id: 'PENDING', label: 'Bekleyen', count: complaints.filter((c) => c.status === 'PENDING').length },
          { id: 'IN_PROGRESS', label: 'İşlemde', count: complaints.filter((c) => c.status === 'IN_PROGRESS').length },
          { id: 'ALL', label: 'Tüm Kayıtlar', count: complaints.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`py-1.5 px-3 rounded-xl text-xs font-heading font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
              filterStatus === tab.id
                ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-sm font-bold'
                : 'bg-white dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] border border-[#e7eeff] dark:border-[#334155] hover:bg-[#f0f3ff] dark:hover:bg-[#0f172a]'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterStatus === tab.id ? 'bg-white/20 text-white' : 'bg-[#f0f3ff] dark:bg-[#0f172a] text-[#00236f] dark:text-blue-400'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Complaints List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <span className="w-8 h-8 border-3 border-[#00236f] dark:border-blue-500 border-t-transparent rounded-full animate-spin"></span>
          <span className="text-xs text-[#757682] dark:text-[#94a3b8]">Talepler yükleniyor...</span>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 text-center border border-[#e7eeff] dark:border-[#334155] text-[#444651] dark:text-[#cbd5e1] flex flex-col items-center gap-3 shadow-sm animate-in fade-in">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">task_alt</span>
          </div>
          <div>
            <h3 className="font-heading font-extrabold text-base text-[#111c2d] dark:text-white">
              {complaints.length === 0 ? 'Kayıtlı Arıza / Şikayetiniz Bulunmuyor' : 'Bu filtrede talep kaydı bulunamadı'}
            </h3>
            <p className="text-xs text-[#757682] dark:text-[#94a3b8] max-w-sm mt-1">
              {complaints.length === 0
                ? 'Odanızda veya ortak alanlarda herhangi bir teknik arıza, bakım veya temizlik ihtiyacı olduğunda hemen bildirim oluşturabilirsiniz.'
                : 'Farklı bir arama veya filtre kriteri seçebilirsiniz.'}
            </p>
          </div>
          {user?.role === 'STUDENT' && (
            <button
              onClick={() => setActiveTab('new-request')}
              className="mt-1 px-5 py-2.5 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-heading font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>+ Yeni Arıza / Talep Bildir</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredComplaints.map((comp) => (
            <article
              key={comp.id}
              className="bg-white dark:bg-[#1e293b] rounded-2xl shadow-sm border border-[#e7eeff] dark:border-[#334155] overflow-hidden hover:shadow-md transition-all"
            >
              {/* Top Accent Color Bar */}
              <div
                className={`h-1.5 w-full ${
                  comp.status === 'RESOLVED'
                    ? 'bg-emerald-500'
                    : comp.status === 'IN_PROGRESS'
                    ? 'bg-amber-500'
                    : 'bg-blue-500'
                }`}
              ></div>

              <div className="p-4 sm:p-5 flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full bg-[#f0f3ff] dark:bg-[#0f172a] font-heading font-bold text-[10px] sm:text-xs text-[#00236f] dark:text-blue-400">
                      #TLP-{comp.id.slice(0, 6).toUpperCase()}
                    </span>
                    <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">
                      {new Date(comp.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  {getStatusBadge(comp.status)}
                </div>

                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1 text-[#006a61] dark:text-emerald-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-[15px]">{comp.category.icon || 'build'}</span>
                    <span>{comp.category.name}</span>
                  </div>

                  <h2 className="font-heading font-bold text-sm sm:text-base text-[#111c2d] dark:text-white leading-snug">
                    {comp.title}
                  </h2>

                  <p className="text-xs text-[#444651] dark:text-[#cbd5e1] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-[#757682] dark:text-[#94a3b8]">apartment</span>
                    <span className="font-semibold">{comp.block.name}</span>
                    <span>•</span>
                    <span>{comp.room_number}</span>
                    {comp.student && comp.student.full_name && user?.role !== 'STUDENT' && (
                      <>
                        <span>•</span>
                        <span className="text-[#00236f] dark:text-blue-400 font-semibold">{comp.student.full_name}</span>
                      </>
                    )}
                  </p>
                </div>

                <p className="text-xs text-[#444651] dark:text-[#cbd5e1] bg-[#f9f9ff] dark:bg-[#0f172a] p-3 rounded-xl border border-[#e7eeff] dark:border-[#334155] leading-relaxed">
                  {comp.description}
                </p>

                {/* Stepper Visualization */}
                <div className="bg-[#f0f3ff] dark:bg-[#0f172a] rounded-xl p-3 border border-[#e7eeff]/60 dark:border-[#334155] flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-[#444651] dark:text-[#94a3b8] font-medium">
                    <span className="font-heading font-bold text-[#00236f] dark:text-white">Süreç Aşaması</span>
                    <span className="text-[#006a61] dark:text-emerald-400 font-bold">
                      {comp.status === 'RESOLVED' ? '4/4 (Tamamlandı)' : comp.status === 'IN_PROGRESS' ? '3/4 (Teknisyende)' : '1/4 (Kayıt Alındı)'}
                    </span>
                  </div>

                  <div className="relative flex items-center justify-between px-1 pt-1 pb-1">
                    <div className="absolute left-3 right-3 top-3 h-0.5 bg-[#d8e3fb] dark:bg-[#334155] -z-0"></div>
                    <div 
                      className="absolute left-3 top-3 h-0.5 bg-[#006a61] dark:bg-emerald-500 -z-0 transition-all duration-500"
                      style={{
                        width: comp.status === 'RESOLVED' ? 'calc(100% - 24px)' : comp.status === 'IN_PROGRESS' ? '66%' : '10%'
                      }}
                    ></div>

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-6 h-6 rounded-full bg-[#006a61] dark:bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">
                        ✓
                      </div>
                      <span className="text-[9px] font-bold text-[#006a61] dark:text-emerald-400">Alındı</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${comp.status !== 'PENDING' ? 'bg-[#006a61] dark:bg-emerald-500 text-white' : 'bg-white dark:bg-[#1e293b] text-[#757682] dark:text-[#94a3b8] border border-[#c5c5d3] dark:border-[#334155]'}`}>
                        {comp.status !== 'PENDING' ? '✓' : '2'}
                      </div>
                      <span className={`text-[9px] font-bold ${comp.status !== 'PENDING' ? 'text-[#006a61] dark:text-emerald-400' : 'text-[#757682] dark:text-[#94a3b8]'}`}>İncelendi</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${comp.status === 'IN_PROGRESS' || comp.status === 'RESOLVED' ? 'bg-[#006a61] dark:bg-emerald-500 text-white' : 'bg-white dark:bg-[#1e293b] text-[#757682] dark:text-[#94a3b8] border border-[#c5c5d3] dark:border-[#334155]'}`}>
                        {comp.status === 'IN_PROGRESS' || comp.status === 'RESOLVED' ? '✓' : '3'}
                      </div>
                      <span className={`text-[9px] font-bold ${comp.status === 'IN_PROGRESS' || comp.status === 'RESOLVED' ? 'text-[#006a61] dark:text-emerald-400' : 'text-[#757682] dark:text-[#94a3b8]'}`}>Teknisyen</span>
                    </div>

                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shadow-sm ${comp.status === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-[#1e293b] text-[#757682] dark:text-[#94a3b8] border border-[#c5c5d3] dark:border-[#334155]'}`}>
                        {comp.status === 'RESOLVED' ? '✓' : '4'}
                      </div>
                      <span className={`text-[9px] font-bold ${comp.status === 'RESOLVED' ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#757682] dark:text-[#94a3b8]'}`}>Çözüldü</span>
                    </div>
                  </div>
                </div>

                {/* Resolution note banner */}
                {comp.resolution_note && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-emerald-700 dark:text-emerald-400 shrink-0">verified</span>
                    <div className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
                      <span className="font-bold">Çözüm Raporu:</span> {comp.resolution_note}
                    </div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
