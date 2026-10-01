import React from 'react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, pendingCount = 0 }) => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT';

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border-t border-[#e7eeff] dark:border-[#1e293b] shadow-xs px-2 pt-1 pb-safe transition-colors">
      <div className="flex items-center justify-around relative max-w-lg mx-auto">
        {/* 1. Home / Dashboard / Admin */}
        <button
          onClick={() => setActiveTab(isStudent ? 'home' : user?.role === 'ADMIN' ? 'admin-panel' : 'dashboard')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
            (isStudent && activeTab === 'home') || (user?.role === 'ADMIN' && activeTab === 'admin-panel') || (user?.role !== 'ADMIN' && !isStudent && activeTab === 'dashboard')
              ? 'text-[#00236f] dark:text-[#3b82f6] font-bold'
              : 'text-[#757682] dark:text-[#94a3b8] hover:text-[#111c2d] dark:hover:text-white'
          }`}
        >
          <span className={`material-symbols-outlined text-[22px] ${((isStudent && activeTab === 'home') || (user?.role === 'ADMIN' && activeTab === 'admin-panel') || (user?.role !== 'ADMIN' && !isStudent && activeTab === 'dashboard')) ? 'fill-current' : ''}`}>
            {isStudent ? 'home' : user?.role === 'ADMIN' ? 'admin_panel_settings' : 'space_dashboard'}
          </span>
          <span className="text-[10px] font-heading mt-0.5">
            {isStudent ? 'Ana Sayfa' : user?.role === 'ADMIN' ? 'Admin' : 'Yönetim'}
          </span>
        </button>

        {/* 2. Requests */}
        <button
          onClick={() => setActiveTab('my-requests')}
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative ${
            activeTab === 'my-requests' ? 'text-[#00236f] dark:text-[#3b82f6] font-bold' : 'text-[#757682] dark:text-[#94a3b8] hover:text-[#111c2d] dark:hover:text-white'
          }`}
        >
          <div className="relative">
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'my-requests' ? 'fill-current' : ''}`}>
              assignment
            </span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 py-0.2 rounded-full bg-[#ba1a1a] text-white text-[9px] font-bold">
                {pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-heading mt-0.5">
            {isStudent ? 'Taleplerim' : 'Arızalar'}
          </span>
        </button>

        {/* 3. Central Elevated Action FAB */}
        <button
          onClick={() => setActiveTab(isStudent ? 'new-request' : 'dashboard')}
          className="flex flex-col items-center justify-center -mt-6 active:scale-95 transition-transform"
        >
          <div className="w-13 h-13 rounded-full bg-[#00236f] dark:bg-[#3b82f6] text-white flex items-center justify-center shadow-md ring-4 ring-[#f9f9ff] dark:ring-[#0f172a]">
            <span className="material-symbols-outlined text-[26px]">
              {isStudent ? 'add' : 'campaign'}
            </span>
          </div>
          <span className="text-[10px] font-heading font-extrabold text-[#00236f] dark:text-[#3b82f6] mt-1">
            {isStudent ? 'Yeni Talep' : 'Duyuru'}
          </span>
        </button>

        {/* 4. Dining (Hidden for STAFF role) */}
        {user?.role !== 'STAFF' && (
          <button
            onClick={() => setActiveTab('cafeteria')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'cafeteria' ? 'text-[#00236f] font-bold' : 'text-[#757682] hover:text-[#111c2d]'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'cafeteria' ? 'fill-current' : ''}`}>
              restaurant
            </span>
            <span className="text-[10px] font-heading mt-0.5">Yemekhane</span>
          </button>
        )}

        {/* 5. Guide (Hidden for STAFF and MANAGER roles) */}
        {(user?.role === 'STUDENT' || user?.role === 'ADMIN') && (
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all ${
              activeTab === 'guide' ? 'text-[#00236f] font-bold' : 'text-[#757682] hover:text-[#111c2d]'
            }`}
          >
            <span className={`material-symbols-outlined text-[22px] ${activeTab === 'guide' ? 'fill-current' : ''}`}>
              contact_support
            </span>
            <span className="text-[10px] font-heading mt-0.5">Rehber</span>
          </button>
        )}
      </div>
    </nav>
  );
};
