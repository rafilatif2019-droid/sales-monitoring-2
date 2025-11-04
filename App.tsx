
import React, { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import Dashboard from './pages/Dashboard';
import Stores from './pages/Stores';
import Targets from './pages/Targets';
import Settings from './pages/Settings';
import Chat from './pages/Chat';
import Admin from './pages/Admin';
// FIX: Import Inbox page component
import Inbox from './pages/Inbox';
// FIX: Import InboxIcon for the navigation
import { DashboardIcon, StoreIcon, TargetIcon, SettingsIcon, ChatIcon, LogoIcon, AdminIcon, UserCircleIcon, InboxIcon } from './components/icons';
import NotificationCenter from './components/NotificationCenter';
import useDeadlineNotifier from './hooks/useDeadlineNotifier';
import useTargetCompletionNotifier from './hooks/useTargetCompletionNotifier';
// FIX: Import useInbox hook to get unread message count
import { useInbox } from './contexts/InboxContext';

// FIX: Add 'inbox' to the Page type
type Page = 'dashboard' | 'stores' | 'targets' | 'settings' | 'chat' | 'admin' | 'inbox';

const ProfileHeader: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-700 flex-shrink-0">
          {currentUser.profilePicture ? (
            <img src={currentUser.profilePicture} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <UserCircleIcon className="text-slate-500" />
          )}
        </div>
        <div className="overflow-hidden hidden sm:block">
          <p className="font-semibold text-white leading-tight truncate">{currentUser.name}</p>
          <p className="text-xs text-slate-400 leading-tight capitalize">{currentUser.role}</p>
        </div>
      </div>
  );
};


const MainApp: React.FC = () => {
  const { currentUser } = useAuth();
  // FIX: Get unread count from inbox context for notifications
  const { unreadCount } = useInbox();
  const [activePage, setActivePage] = useState<Page>('dashboard');
  useDeadlineNotifier();
  useTargetCompletionNotifier();

  const handlePageChange = (page: Page) => {
    setActivePage(page);
    if (page === 'inbox') {
      // Future improvement: mark as read can be called here
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <Dashboard />;
      case 'stores': return <Stores />;
      case 'targets': return <Targets />;
      case 'settings': return <Settings />;
      case 'chat': return <Chat />;
      // FIX: Add case to render Inbox page
      case 'inbox': return <Inbox />;
      case 'admin': return currentUser?.role === 'superuser' ? <Admin /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };
  
  // FIX: Add notificationCount property to nav items and include Inbox
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <DashboardIcon />, notificationCount: 0 },
    { id: 'stores', label: 'Stores', icon: <StoreIcon />, notificationCount: 0 },
    { id: 'targets', label: 'Targets', icon: <TargetIcon />, notificationCount: 0 },
    { id: 'chat', label: 'Chat AI', icon: <ChatIcon />, notificationCount: 0 },
    { id: 'inbox' as Page, label: 'Inbox', icon: <InboxIcon />, notificationCount: unreadCount },
    ...(currentUser?.role === 'superuser' ? [{ id: 'admin' as Page, label: 'Admin', icon: <AdminIcon />, notificationCount: 0 }] : []),
    { id: 'settings', label: 'Settings', icon: <SettingsIcon />, notificationCount: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-40 border-b border-slate-800 flex-shrink-0">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10">
                    <LogoIcon />
                </div>
                <h1 className="text-xl font-bold text-brand-400 tracking-tight hidden sm:block">Sales Monitor</h1>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(item => {
                const isActive = activePage === item.id;
                const showNotification = (item.notificationCount || 0) > 0;
                return (
                  <button
                    key={item.id}
                    onClick={() => handlePageChange(item.id as Page)}
                    className={`group relative py-2 px-3 rounded-md flex items-center gap-2 text-sm font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-brand-500 ${
                      isActive
                        ? 'bg-brand-600/20 text-brand-300'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className={`w-5 h-5 shrink-0 ${isActive ? 'text-brand-400' : 'text-slate-400 group-hover:text-brand-300'}`}>
                      {item.icon}
                    </div>
                    <span>{item.label}</span>
                    {showNotification && (
                       <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-slate-900">
                        {item.notificationCount}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="flex items-center gap-4">
                <ProfileHeader />
            </div>
          </div>
        </div>
      </header>
      
      {/* Mobile nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-40 flex-shrink-0">
        <div className="flex justify-around">
           {navItems.map(item => {
            const isActive = activePage === item.id;
            const showNotification = (item.notificationCount || 0) > 0;
            return (
              <button
                key={item.id}
                onClick={() => handlePageChange(item.id as Page)}
                className={`group relative flex-1 flex flex-col items-center justify-center py-2 text-xs font-medium transition-colors duration-200 focus:outline-none ${
                  isActive ? 'text-brand-400' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="w-6 h-6 mb-0.5">
                  {item.icon}
                </div>
                <span>{item.label}</span>
                 {showNotification && (
                  <div className="absolute top-1 right-1/2 translate-x-3 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-slate-900">
                    {item.notificationCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="relative flex-1 flex flex-col pb-16 md:pb-0">
        <NotificationCenter />
        <main className="flex-1 flex flex-col">
           <div key={activePage} className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in flex-1 flex flex-col">
             {renderPage()}
           </div>
        </main>
      </div>
    </div>
  );
};


const App: React.FC = () => {
  const { currentUser } = useAuth();
  
  return (
    <AppProvider user={currentUser}>
      <MainApp />
    </AppProvider>
  );
};

export default App;