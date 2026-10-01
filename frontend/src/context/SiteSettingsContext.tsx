import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';
import type { SiteSettings } from '../types';

export const defaultSettings: SiteSettings = {
  site_title: 'Elvin Buğra Arslan Yurdu',
  site_subtitle: 'Kırşehir Mucur KYK Portalı',
  primary_color: '#00236f',
  primary_container: '#1e3a8a',
  secondary_color: '#006a61',
  secondary_container: '#86f2e4',
  surface_color: '#f9f9ff',
  on_surface_color: '#111c2d',
  accent_color: '#ba1a1a',
  border_radius: 'rounded-2xl',
  font_family: 'Plus Jakarta Sans',
  hero_badge: '2026 Bahar Dönemi Aktif',
  hero_title: 'GSB Kırşehir Mucur Yurt Talep & Yaşam Yönetim Sistemi',
  hero_subtitle: 'Arıza bildirimleri, oda talepleri ve yemekhane menüleri tek portalda',
  contact_phone: '0 (386) 812 45 67',
  contact_email: 'mucuryurt@gsb.gov.tr',
  contact_address: 'Yenice Mah. KYK Cad. No:12 Mucur / Kırşehir',
  security_phone: '0 (386) 812 45 99 (Nöbetçi Memur Dahili: 104)',
  cafeteria_lunch_hours: '12:00 - 13:30',
  cafeteria_dinner_hours: '18:00 - 21:00',
  footer_text: 'T.C. Gençlik ve Spor Bakanlığı • Kredi ve Yurtlar Genel Müdürlüğü',
};

interface SiteSettingsContextType {
  settings: SiteSettings;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  isLoading: boolean;
}

const SiteSettingsContext = createContext<SiteSettingsContextType | undefined>(undefined);

export const SiteSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(() => {
    const cached = localStorage.getItem('site_settings');
    if (cached) {
      try {
        return { ...defaultSettings, ...JSON.parse(cached) };
      } catch (e) {
        // fallback
      }
    }
    return defaultSettings;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Apply CSS custom variables to :root whenever settings change
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--color-primary', settings.primary_color);
    root.style.setProperty('--color-primary-container', settings.primary_container);
    root.style.setProperty('--color-secondary', settings.secondary_color);
    root.style.setProperty('--color-secondary-container', settings.secondary_container);
    root.style.setProperty('--color-surface', settings.surface_color);
    root.style.setProperty('--color-on-surface', settings.on_surface_color);
    root.style.setProperty('--font-heading', `'${settings.font_family}', sans-serif`);
    
    document.title = `${settings.site_title} | ${settings.site_subtitle}`;
  }, [settings]);

  // Fetch latest settings from server on initial load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.get<SiteSettings>('/settings');
        if (res.data) {
          const merged = { ...defaultSettings, ...res.data };
          setSettings(merged);
          localStorage.setItem('site_settings', JSON.stringify(merged));
        }
      } catch (err) {
        // use local cache if network/server is offline
      }
    };
    fetchSettings();
  }, []);

  const updateSettings = async (newValues: Partial<SiteSettings>) => {
    setIsLoading(true);
    const updated = { ...settings, ...newValues };
    setSettings(updated);
    localStorage.setItem('site_settings', JSON.stringify(updated));

    try {
      await apiClient.put<SiteSettings>('/admin/settings', updated);
    } catch (err) {
      console.warn('Ayarlar sunucuya kaydedilemedi, yerel hafızada güncellendi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    setIsLoading(true);
    setSettings(defaultSettings);
    localStorage.setItem('site_settings', JSON.stringify(defaultSettings));
    try {
      await apiClient.put<SiteSettings>('/admin/settings', defaultSettings);
    } catch (err) {
      console.warn('Varsayılan ayarlar sunucuya aktarılamadı:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, updateSettings, resetSettings, isLoading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};
