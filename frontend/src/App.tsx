import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SiteSettingsProvider } from './context/SiteSettingsContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/Navbar';
import { BottomNav } from './components/BottomNav';
import { StudentHome } from './components/StudentHome';
import { NewComplaint } from './components/NewComplaint';
import { MyComplaints } from './components/MyComplaints';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminSystemPanel } from './components/AdminSystemPanel';
import { CafeteriaView } from './components/CafeteriaView';
import { GuideView } from './components/GuideView';
import { SettingsView } from './components/SettingsView';
import { LoginView } from './components/LoginView';

const MainLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f9f9ff] dark:bg-[#0f172a]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#00236f] dark:bg-[#3b82f6] text-white flex items-center justify-center animate-bounce shadow-md">
            <span className="material-symbols-outlined text-[28px]">apartment</span>
          </div>
          <span className="text-xs font-heading font-bold text-[#00236f] dark:text-[#3b82f6]">Portala Bağlanılıyor...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  // Adjust default tab according to role
  const currentTab =
    activeTab === 'home'
      ? user.role === 'ADMIN'
        ? 'admin-panel'
        : user.role !== 'STUDENT'
        ? 'dashboard'
        : 'home'
      : activeTab;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#f9f9ff] dark:bg-[#0f172a] text-[#111c2d] dark:text-[#f8fafc] transition-colors">
      <Navbar activeTab={currentTab} setActiveTab={setActiveTab} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 lg:pb-12">
        {currentTab === 'home' && <StudentHome setActiveTab={setActiveTab} />}
        {currentTab === 'admin-panel' && user.role === 'ADMIN' && <AdminSystemPanel />}
        {currentTab === 'dashboard' && <AdminDashboard />}
        {currentTab === 'new-request' && <NewComplaint setActiveTab={setActiveTab} />}
        {currentTab === 'my-requests' && <MyComplaints setActiveTab={setActiveTab} />}
        {currentTab === 'cafeteria' && <CafeteriaView />}
        {currentTab === 'guide' && <GuideView />}
        {currentTab === 'settings' && <SettingsView setActiveTab={setActiveTab} />}
      </main>

      {/* Mobile-first bottom navigation for all roles on mobile/tablets */}
      <BottomNav activeTab={currentTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SiteSettingsProvider>
          <MainLayout />
        </SiteSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
