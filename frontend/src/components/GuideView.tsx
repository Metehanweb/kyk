import React, { useState } from 'react';
import { useSiteSettings } from '../context/SiteSettingsContext';

export const GuideView: React.FC = () => {
  const { settings } = useSiteSettings();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'KYKWifi ağına nasıl bağlanabilirim ve şifremi nasıl sıfırlarım?',
      a: 'KYKWifi ağına bağlanmak için e-Devlet şifrenizle GSB Portal üzerinden Wi-Fi taahhütnamesini onaylamanız ve kullanıcı adı olarak T.C. kimlik numaranızı girmeniz gerekmektedir. Şifre sıfırlama işlemi yurt bilgi işlem biriminden veya e-Devlet üzerinden yapılabilmektedir.'
    },
    {
      q: 'Odamdaki teknik arıza ne kadar sürede çözülür?',
      a: 'Bu sistem üzerinden açtığınız talepler anlık olarak nöbetçi teknik personele iletilir. Acil arızalar ortalama 30 dakika içerisinde; rutin arızalar ise 24 saat içinde müdahale edilerek sonuçlandırılır.'
    },
    {
      q: 'Kargolarımı nereden ve ne zaman teslim alabilirim?',
      a: 'Yurda gelen kargolar güvenlik nizamiyesine teslim edilir. Güvenlik biriminden mesai günlerinde 09:00 - 20:00 saatleri arasında kimlik kartınızı göstererek kargonuzu teslim alabilirsiniz.'
    },
    {
      q: 'Çamaşırhane kullanımı için rezervasyon gerekli midir?',
      a: 'Sosyal Tesis zemin katındaki çamaşırhanemiz her gün 08:30 - 22:30 saatleri arasında hizmet vermektedir. Sıra sistemi ile çalışmaktadır.'
    },
    {
      q: 'Hafta sonu evci veya memleket iznini nasıl alabilirim?',
      a: 'GSB GencizBiz mobil uygulaması veya web portali üzerinden izin talebi oluşturabilir, cuma günü mesai bitimine kadar sistem üzerinden onay durumunuzu kontrol edebilirsiniz.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto pb-16 flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-[#e7eeff] dark:bg-[#0f172a] text-[#00236f] dark:text-[#60a5fa] flex items-center justify-center">
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
          </span>
          <span className="text-[11px] font-heading font-bold text-[#00236f] dark:text-emerald-400 uppercase tracking-wider">
            Kurumsal Bilgi & Rehber
          </span>
        </div>
        <h1 className="font-heading font-extrabold text-xl sm:text-2xl text-[#00236f] dark:text-white tracking-tight">
          {settings.site_title} • Rehber & İletişim
        </h1>
        <p className="text-xs text-[#444651] dark:text-[#94a3b8]">
          {settings.contact_address}
        </p>
      </div>

      {/* Emergency Contacts Cards (Mobile Direct Tap-to-Call) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        <a 
          href={`tel:${settings.security_phone.replace(/\D/g, '')}`}
          className="bg-white dark:bg-[#1e293b] p-3.5 sm:p-4 rounded-2xl shadow-sm border border-red-200 dark:border-red-900/60 flex items-center justify-between gap-3 active:scale-98 transition-transform"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">phone_in_talk</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">7/24 Nöbetçi Memurluk</span>
              <div className="font-heading font-bold text-sm text-[#111c2d] dark:text-white">{settings.security_phone}</div>
              <span className="text-[10px] text-[#444651] dark:text-[#94a3b8]">Dokun ve Ara</span>
            </div>
          </div>
          <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]">call</span>
          </span>
        </a>

        <a 
          href={`tel:${settings.contact_phone.replace(/\D/g, '')}`}
          className="bg-white dark:bg-[#1e293b] p-3.5 sm:p-4 rounded-2xl shadow-sm border border-[#e7eeff] dark:border-[#334155] flex items-center justify-between gap-3 active:scale-98 transition-transform"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#e7eeff] dark:bg-[#0f172a] text-[#00236f] dark:text-[#60a5fa] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">apartment</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-[#00236f] dark:text-blue-400 uppercase tracking-wider">Yurt İdare / Müdürlük</span>
              <div className="font-heading font-bold text-sm text-[#111c2d] dark:text-white">{settings.contact_phone}</div>
              <span className="text-[10px] text-[#444651] dark:text-[#94a3b8]">{settings.contact_email}</span>
            </div>
          </div>
          <span className="w-8 h-8 rounded-full bg-[#00236f] dark:bg-[#2563eb] text-white flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[16px]">call</span>
          </span>
        </a>
      </div>

      {/* Dormitory Info & Rules Bar */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-5 shadow-sm border border-[#e7eeff] dark:border-[#334155]">
        <h3 className="font-heading font-bold text-xs sm:text-sm text-[#111c2d] dark:text-white mb-2.5 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[18px] text-[#006a61] dark:text-emerald-400">schedule</span>
          <span>Önemli Saatler & Servis Bilgisi</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-[#f0f3ff] dark:bg-[#0f172a]">
            <span className="font-bold text-[#00236f] dark:text-blue-400 block">Öğle Yemeği</span>
            <span className="text-[#444651] dark:text-[#cbd5e1] text-[11px] block">{settings.cafeteria_lunch_hours}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#f0f3ff] dark:bg-[#0f172a]">
            <span className="font-bold text-[#00236f] dark:text-blue-400 block">Akşam Yemeği</span>
            <span className="text-[#444651] dark:text-[#cbd5e1] text-[11px] block">{settings.cafeteria_dinner_hours}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-[#f0f3ff] dark:bg-[#0f172a]">
            <span className="font-bold text-[#00236f] dark:text-blue-400 block">Yurda Son Giriş</span>
            <span className="text-[#444651] dark:text-[#cbd5e1] text-[11px] block">Her Gün: 23:00 (Sabit)</span>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white dark:bg-[#1e293b] rounded-3xl p-4 sm:p-6 shadow-sm border border-[#e7eeff] dark:border-[#334155]">
        <h3 className="font-heading font-bold text-sm sm:text-base text-[#111c2d] dark:text-white mb-3 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[20px] text-[#00236f] dark:text-[#60a5fa]">help_outline</span>
          <span>Sıkça Sorulan Sorular</span>
        </h3>

        <div className="flex flex-col gap-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="border border-[#e7eeff] dark:border-[#334155] rounded-2xl overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-3.5 text-left flex items-center justify-between gap-2 bg-[#f9f9ff] dark:bg-[#0f172a] hover:bg-[#f0f3ff] dark:hover:bg-[#111c2d] transition-colors"
                >
                  <span className="font-heading font-bold text-xs text-[#111c2d] dark:text-white leading-snug">
                    {faq.q}
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-[#757682] dark:text-[#94a3b8] shrink-0">
                    {isOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-3.5 bg-white dark:bg-[#1e293b] text-xs text-[#444651] dark:text-[#cbd5e1] leading-relaxed border-t border-[#e7eeff] dark:border-[#334155] animate-in fade-in">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
