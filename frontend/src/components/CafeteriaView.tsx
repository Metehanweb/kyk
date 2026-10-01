import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { apiClient } from '../api/client';
import type { CafeteriaMenuResponse, CafeteriaMenuCreatePayload } from '../types';

export const CafeteriaView: React.FC = () => {
  const { user } = useAuth();
  const { settings } = useSiteSettings();
  const [menus, setMenus] = useState<CafeteriaMenuResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [hasRated, setHasRated] = useState<boolean>(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState<boolean>(false);
  const [feedbackNote, setFeedbackNote] = useState<string>('');
  const [feedbackSuccess, setFeedbackSuccess] = useState<boolean>(false);

  // New Menu Modal State (Admin / Staff)
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [isCreatingMenu, setIsCreatingMenu] = useState<boolean>(false);
  const [menuForm, setMenuForm] = useState<CafeteriaMenuCreatePayload>({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'DINNER',
    soup: '',
    main_course: '',
    side_dish: '',
    extra: '',
    calories: 750,
  });

  const isStaffOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER' || user?.role === 'STAFF';

  const fetchMenus = async () => {
    try {
      setIsLoading(true);
      const res = await apiClient.get<CafeteriaMenuResponse[]>('/cafeteria/today');
      setMenus(res.data);
    } catch (err) {
      console.error('Menü yüklenemedi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMenus();
  }, []);

  const todayMenu = menus[0];

  const handleCreateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuForm.soup || !menuForm.main_course || !menuForm.side_dish || !menuForm.extra) {
      alert('Lütfen tüm yemek alanlarını doldurun.');
      return;
    }
    setIsCreatingMenu(true);
    try {
      await apiClient.post('/cafeteria/menu', menuForm);
      setShowAddModal(false);
      setMenuForm({
        date: new Date().toISOString().split('T')[0],
        meal_type: 'DINNER',
        soup: '',
        main_course: '',
        side_dish: '',
        extra: '',
        calories: 750,
      });
      await fetchMenus();
    } catch (err) {
      console.error('Menü eklenirken hata:', err);
      alert('Menü eklenemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsCreatingMenu(false);
    }
  };

  const handleRate = async (score: number) => {
    if (!todayMenu || hasRated) return;
    setSelectedRating(score);
    setIsSubmittingRating(true);
    try {
      await apiClient.post(`/cafeteria/${todayMenu.id}/rate`, { rating: score });
      setHasRated(true);
      await fetchMenus();
    } catch (err) {
      console.error('Puanlama hatası:', err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  const handleSendFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackNote.trim()) return;
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackNote('');
      setFeedbackSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-3xl mx-auto pb-16 flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#86f2e4] dark:bg-emerald-900/40 text-[#006f66] dark:text-emerald-300 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">restaurant</span>
            </span>
            <span className="text-[11px] font-heading font-bold text-[#006a61] dark:text-emerald-400 uppercase tracking-wider">
              Yemekhane & Beslenme
            </span>
          </div>
          <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00236f] dark:text-white tracking-tight">
            Günün Menüsü & Değerlendirme
          </h1>
          <p className="text-xs text-[#444651] dark:text-[#94a3b8]">
            Yemek listesi ve öğrenci memnuniyet anketi.
          </p>
        </div>

        {isStaffOrAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="self-start sm:self-auto px-4 py-2.5 rounded-2xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-heading font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ Menü Ekle</span>
          </button>
        )}
      </div>

      {/* Meal Hours & Dining Rules Banner (Mobile-First) */}
      <div className="bg-[#f0f3ff] dark:bg-[#1e293b] rounded-2xl p-3 sm:p-4 border border-[#d8e3fb] dark:border-[#334155] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-[#00236f] dark:text-white font-heading font-bold">
          <span className="material-symbols-outlined text-[20px] text-[#006a61] dark:text-emerald-400">schedule</span>
          <span>Yemekhane Servis Saatleri:</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#444651] dark:text-[#cbd5e1]">
          <span>☀️ Öğle: <strong>{settings.cafeteria_lunch_hours}</strong></span>
          <span>🌙 Akşam: <strong>{settings.cafeteria_dinner_hours}</strong></span>
        </div>
      </div>

      {/* Main Menu Card or Empty State */}
      {todayMenu ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 shadow-md border border-[#e7eeff] dark:border-[#334155] overflow-hidden relative">
          <div className="h-2 absolute top-0 inset-x-0 bg-[#006a61] dark:bg-emerald-500"></div>

          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#e7eeff] dark:bg-[#0f172a] text-[#00236f] dark:text-blue-400 text-xs font-bold">
                {todayMenu.date ? new Date(todayMenu.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : 'Bugün'} • {todayMenu.meal_type === 'LUNCH' ? 'Öğle' : 'Akşam'}
              </span>
              <span className="text-[11px] text-[#757682] dark:text-[#94a3b8] ml-1.5">
                {todayMenu.meal_type === 'LUNCH' ? '12:00 - 14:00' : '16:30 - 22:30'}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
              <span className="material-symbols-outlined text-[16px] text-amber-500 fill-current">star</span>
              <span className="text-xs font-bold text-amber-900 dark:text-amber-300">{todayMenu.rating}</span>
              <span className="text-[10px] text-amber-700 dark:text-amber-400">({todayMenu.review_count})</span>
            </div>
          </div>

          {/* 4 Course Dish Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">soup_kitchen</span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Çorba</span>
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#111c2d] dark:text-white truncate">{todayMenu.soup}</h4>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#e7eeff] dark:bg-[#0f172a] border border-[#c5c5d3]/50 dark:border-[#334155] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#006a61] dark:bg-emerald-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">dinner_dining</span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-[#006a61] dark:text-emerald-400 uppercase tracking-wider block">Ana Yemek</span>
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#00236f] dark:text-[#60a5fa] truncate">{todayMenu.main_course}</h4>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#1e3a8a] dark:bg-blue-700 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">grain</span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Yan Yemek</span>
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#111c2d] dark:text-white truncate">{todayMenu.side_dish}</h4>
              </div>
            </div>

            <div className="p-3 sm:p-3.5 rounded-2xl bg-[#f0f3ff] dark:bg-[#0f172a] border border-[#d8e3fb] dark:border-[#334155] flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">icecream</span>
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-[#757682] dark:text-[#94a3b8] uppercase tracking-wider block">Tatlı / Meyve</span>
                <h4 className="font-heading font-bold text-xs sm:text-sm text-[#111c2d] dark:text-white truncate">{todayMenu.extra}</h4>
              </div>
            </div>
          </div>

          {/* Calorie & Nutrition Bar */}
          <div className="p-3 rounded-2xl bg-[#f9f9ff] dark:bg-[#0f172a] border border-[#e7eeff] dark:border-[#334155] flex flex-wrap items-center justify-between gap-2 text-xs mb-4">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px] text-[#006a61] dark:text-emerald-400">energy_savings_leaf</span>
              <span className="font-bold text-[#111c2d] dark:text-white text-xs">Toplam: {todayMenu.calories} kcal</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-semibold">38g Protein</span>
              <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-semibold">82g Karb</span>
            </div>
          </div>

          {/* Interactive Rating Section */}
          <div className="bg-[#f0f3ff] dark:bg-[#0f172a] rounded-2xl p-4 border border-[#d8e3fb] dark:border-[#334155] text-center flex flex-col items-center">
            <h3 className="font-heading font-bold text-xs sm:text-sm text-[#00236f] dark:text-white mb-0.5">
              Günün Yemeğini Puanlayın
            </h3>
            <p className="text-[10px] sm:text-[11px] text-[#444651] dark:text-[#94a3b8] mb-2.5">
              Değerlendirmeniz yemekhane idaresine doğrudan iletilir.
            </p>

            <div className="flex items-center justify-center gap-1.5 mb-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  disabled={hasRated || isSubmittingRating}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white dark:bg-[#1e293b] border border-[#c5c5d3] dark:border-[#334155] hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center justify-center text-amber-500 transition-all active:scale-90 disabled:cursor-default"
                >
                  <span className={`material-symbols-outlined text-[24px] ${selectedRating >= star ? 'font-fill text-amber-500' : 'text-[#c5c5d3] dark:text-[#64748b]'}`}>
                    star
                  </span>
                </button>
              ))}
            </div>

            {hasRated ? (
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full animate-in fade-in">
                ✓ Puanınız kaydedildi. Afiyet olsun!
              </span>
            ) : (
              <span className="text-[9px] text-[#757682] dark:text-[#94a3b8]">1 (Zayıf) - 5 (Çok Lezzetli)</span>
            )}
          </div>
        </div>
      ) : isLoading ? (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 text-center text-xs text-[#757682] dark:text-[#94a3b8] border border-[#e7eeff] dark:border-[#334155]">
          <div className="w-8 h-8 border-3 border-[#00236f] dark:border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          Menü yükleniyor...
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-8 text-center border border-dashed border-[#c5c5d3] dark:border-[#334155] flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#e7eeff] dark:bg-[#0f172a] text-[#00236f] dark:text-blue-400 flex items-center justify-center">
            <span className="material-symbols-outlined text-[28px]">restaurant_menu</span>
          </div>
          <div>
            <h3 className="font-heading font-bold text-sm text-[#111c2d] dark:text-white">Henüz Yemek Menüsü Girilmedi</h3>
            <p className="text-xs text-[#757682] dark:text-[#94a3b8] mt-1 max-w-sm">
              Bugüne ait yemek menüsü yetkili personel tarafından sisteme girildiğinde burada görüntülenecektir.
            </p>
          </div>
          {isStaffOrAdmin && (
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-[#00236f] dark:bg-[#2563eb] text-white text-xs font-heading font-bold shadow-sm active:scale-95 transition-transform flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Günün Menüsünü Girin
            </button>
          )}
        </div>
      )}

      {/* Suggestion / Feedback Form */}
      <form onSubmit={handleSendFeedback} className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 shadow-sm border border-[#e7eeff] dark:border-[#334155] flex flex-col gap-2.5">
        <h3 className="font-heading font-bold text-xs sm:text-sm text-[#111c2d] dark:text-white">
          Yemekhane İdaresine Not Bırak
        </h3>
        <textarea
          value={feedbackNote}
          onChange={(e) => setFeedbackNote(e.target.value)}
          rows={3}
          placeholder="Yemek porsiyonu, hijyen veya önerilerinizi paylaşın..."
          className="w-full p-3 rounded-xl bg-[#f0f3ff] dark:bg-[#0f172a] text-xs text-[#111c2d] dark:text-white outline-none border border-transparent focus:border-[#00236f] dark:focus:border-blue-500 resize-none"
        ></textarea>

        {feedbackSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
            ✓ Geri bildiriminiz yemek komisyonuna iletildi.
          </div>
        )}

        <button
          type="submit"
          className="self-end px-4 py-2.5 rounded-xl bg-[#006a61] text-white text-xs font-heading font-bold shadow-sm active:scale-95 transition-transform"
        >
          İlet
        </button>
      </form>

      {/* New Menu Modal (For Admin & Staff) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-lg shadow-2xl border border-[#e7eeff] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7eeff]">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#e7eeff] text-[#00236f] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">restaurant_menu</span>
                </span>
                <h3 className="font-heading font-bold text-sm sm:text-base text-[#111c2d]">
                  Yeni Günlük Menü Tanımla
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 flex items-center justify-center text-[#757682]"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateMenu} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">Tarih</label>
                  <input
                    type="date"
                    required
                    value={menuForm.date}
                    onChange={(e) => setMenuForm({ ...menuForm, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none border border-transparent focus:border-[#00236f]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">Öğün</label>
                  <select
                    value={menuForm.meal_type}
                    onChange={(e) => setMenuForm({ ...menuForm, meal_type: e.target.value as 'LUNCH' | 'DINNER' })}
                    className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none border border-transparent focus:border-[#00236f]"
                  >
                    <option value="DINNER">Akşam Yemeği</option>
                    <option value="LUNCH">Öğle Yemeği</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">1. Çorba</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Süzme Mercimek Çorbası"
                  value={menuForm.soup}
                  onChange={(e) => setMenuForm({ ...menuForm, soup: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none border border-transparent focus:border-[#00236f]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">2. Ana Yemek</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Orman Kebabı / İzmir Köfte"
                  value={menuForm.main_course}
                  onChange={(e) => setMenuForm({ ...menuForm, main_course: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none border border-transparent focus:border-[#00236f]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#444651] mb-1">3. Yan Yemek</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Şehriyeli Pirinç Pilavı"
                  value={menuForm.side_dish}
                  onChange={(e) => setMenuForm({ ...menuForm, side_dish: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none border border-transparent focus:border-[#00236f]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">4. Tatlı / Meyve / İçecek</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Fırın Sütlaç"
                    value={menuForm.extra}
                    onChange={(e) => setMenuForm({ ...menuForm, extra: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none border border-transparent focus:border-[#00236f]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#444651] mb-1">Kalori (kcal)</label>
                  <input
                    type="number"
                    required
                    min={100}
                    max={2500}
                    placeholder="750"
                    value={menuForm.calories}
                    onChange={(e) => setMenuForm({ ...menuForm, calories: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#f0f3ff] text-xs text-[#111c2d] outline-none border border-transparent focus:border-[#00236f]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#e7eeff] mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingMenu}
                  className="px-5 py-2 rounded-xl bg-[#00236f] text-white text-xs font-heading font-bold shadow-md hover:bg-[#1e3a8a] active:scale-95 transition-all disabled:opacity-50"
                >
                  {isCreatingMenu ? 'Kaydediliyor...' : 'Menüyü Yayınla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
