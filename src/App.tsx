import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileDrawer, MobileBottomBar } from './components/layout/MobileNav';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/TasksPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { TeamPage } from './pages/TeamPage';
import { MessagesPage } from './pages/MessagesPage';
import { LoginPage } from './pages/LoginPage';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { CreateTaskModal } from './components/common/CreateTaskModal';
import { CreateProjectModal } from './components/common/CreateProjectModal';
import { CreateEmployeeModal } from './components/common/CreateEmployeeModal';
import { TaskDetailModal } from './components/common/TaskDetailModal';
import { ConfirmModal } from './components/common/ConfirmModal';
import { ToastContainer } from './components/common/Toast';
import { InstallAppModal, MobileFloatingInstallPrompt } from './components/common/InstallAppModal';
import { OfflineBanner } from './components/common/OfflineBanner';
import { NotificationDropdown } from './components/common/NotificationDropdown';
import { Layers, Search, Menu } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { currentView, isAuthenticated, isSearchOpen, setIsSearchOpen } = useApp();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  // If unauthenticated, render the full enterprise Login Portal
  if (!isAuthenticated) {
    return (
      <>
        <OfflineBanner />
        <LoginPage />
        <ToastContainer />
        <ConfirmModal />
        <InstallAppModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </>
    );
  }

  const renderActiveView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TasksPage />;
      case 'projects':
      case 'project_detail':
        return <ProjectsPage />;
      case 'team':
        return <TeamPage />;
      case 'messages':
        return <MessagesPage />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Offline Status Alert Banner */}
      <OfflineBanner />

      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar onOpenInstallModal={() => setIsInstallModalOpen(true)} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
          {/* Mobile Header (Only visible on mobile screens) */}
          <div className="lg:hidden h-14 border-b border-slate-200 bg-white px-4 flex items-center justify-between z-20 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-soft">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">TaskFlow</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Search tasks, projects..."
              >
                <Search className="w-4 h-4" />
              </button>
              <NotificationDropdown align="right" />
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Dynamic Page Content */}
          <main
            className={`flex-1 min-w-0 min-h-0 ${
              currentView === 'messages'
                ? 'overflow-hidden flex flex-col p-0 pb-14 lg:pb-0'
                : 'overflow-y-auto pb-20 lg:pb-6'
            }`}
          >
            {renderActiveView()}
          </main>

          {/* Mobile Navigation Bar */}
          <MobileBottomBar />
        </div>
      </div>

      {/* Global Modals & Drawers */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
      <CreateTaskModal />
      <CreateProjectModal />
      <CreateEmployeeModal />
      <TaskDetailModal />
      <ConfirmModal />
      <ToastContainer />
      <MobileDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenInstallModal={() => setIsInstallModalOpen(true)}
      />
      <InstallAppModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
      <MobileFloatingInstallPrompt
        onOpenModal={() => setIsInstallModalOpen(true)}
      />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

export default App;
