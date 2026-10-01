import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import type { CategoryResponse, BuildingBlockResponse, PriorityLevel } from '../types';

interface NewComplaintProps {
  setActiveTab: (tab: string) => void;
}

export const NewComplaint: React.FC<NewComplaintProps> = ({ setActiveTab }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedBlockId, setSelectedBlockId] = useState<string>('');
  const roomNumber = user?.room_number || '304';
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('NORMAL');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [catsRes, blocksRes] = await Promise.all([
          apiClient.get<CategoryResponse[]>('/categories'),
          apiClient.get<BuildingBlockResponse[]>('/blocks'),
        ]);
        setCategories(catsRes.data);

        if (catsRes.data.length > 0) {
          setSelectedCategoryId(catsRes.data[0].id);
        }

        if (user?.block) {
          setSelectedBlockId(user.block.id);
        } else if (blocksRes.data.length > 0) {
          setSelectedBlockId(blocksRes.data[0].id);
        }
      } catch (err) {
        console.error('Metadata yükleme hatası:', err);
      }
    };
    fetchMetadata();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMessage('Lütfen başlık ve detaylı açıklama alanlarını eksiksiz doldurunuz.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await apiClient.post('/complaints', {
        category_id: selectedCategoryId,
        block_id: user?.block?.id || selectedBlockId,
        room_number: user?.room_number || roomNumber || '304',
        title: title.trim(),
        description: description.trim(),
        priority: priority,
      });

      setSuccessMessage('Arıza ve talep bildiriminiz başarıyla iletildi. Nöbetçi ekibe atanmıştır.');
      setTimeout(() => {
        setActiveTab('my-requests');
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.detail || 'Talep oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col gap-1 mb-5">
        <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00236f] dark:text-white tracking-tight">
          Yeni Bildirim Oluştur
        </h1>
      </div>

      {successMessage && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in">
          <span className="material-symbols-outlined text-[22px] text-emerald-600 dark:text-emerald-400">check_circle</span>
          <div className="text-xs font-semibold">{successMessage}</div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-5 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[22px] text-red-600 dark:text-red-400">error</span>
          <div className="text-xs font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Category Selection: Horizontally swipeable on mobile */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="font-heading font-bold text-xs text-[#111c2d] dark:text-white">
              Kategori Seçimi
            </label>
            <span className="text-[10px] font-semibold text-[#006a61] dark:text-emerald-400">Zorunlu</span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-heading font-semibold transition-all shrink-0 active:scale-95 ${
                    isSelected
                      ? 'bg-[#00236f] dark:bg-[#2563eb] text-white shadow-md scale-[1.02]'
                      : 'bg-white dark:bg-[#1e293b] text-[#444651] dark:text-[#cbd5e1] border border-[#e7eeff] dark:border-[#334155] hover:bg-[#f0f3ff] dark:hover:bg-[#0f172a]'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon || 'build'}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1">
          <label className="font-heading font-bold text-xs text-[#111c2d] dark:text-white flex justify-between">
            <span>Bildirim Başlığı</span>
            <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">{title.length}/100</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            placeholder="Örn: Çalışma Masası Prizi Arızalı"
            required
            className="w-full h-11 px-3.5 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] focus:border-[#00236f] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#00236f]/15 text-xs text-[#111c2d] dark:text-white outline-none transition-all shadow-sm font-medium"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="font-heading font-bold text-xs text-[#111c2d] dark:text-white flex justify-between">
            <span>Detaylı Açıklama</span>
            <span className="text-[10px] text-[#757682] dark:text-[#94a3b8]">{description.length} karakter</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Arızanın tam konumunu ve durumunu açıklayınız..."
            required
            className="w-full p-3.5 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] focus:border-[#00236f] dark:focus:border-blue-500 focus:ring-2 focus:ring-[#00236f]/15 text-xs text-[#111c2d] dark:text-white outline-none transition-all shadow-sm resize-none leading-relaxed"
          ></textarea>
        </div>

        {/* Submit Button (Touch Friendly) */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className="flex-1 py-3.5 rounded-xl border border-[#c5c5d3] dark:border-[#334155] text-xs font-heading font-semibold text-[#444651] dark:text-[#cbd5e1] hover:bg-gray-100 dark:hover:bg-[#334155] active:scale-95 transition-transform"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-[2] py-3.5 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-heading font-bold shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>İletiliyor...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>Talebi İlet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
