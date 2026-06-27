import React from 'react';
import { TrackerProvider, useTracker } from './context/TrackerContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/Toast';
import { Dashboard } from './views/Dashboard';
import { AssetManager } from './views/AssetManager';
import { AssetDetail } from './views/AssetDetail';
import { DefectTracker } from './views/DefectTracker';
import { DLPExpiration } from './views/DLPExpiration';
import { Reports } from './views/Reports';
import { Certifications } from './views/Certifications';
import { Login } from './views/Login';
import { AuditTrails } from './views/AuditTrails';

const MainLayout: React.FC = () => {
  const { currentView } = useTracker();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'assets':
        return <AssetManager />;
      case 'asset-details':
        return <AssetDetail />;
      case 'defects':
        return <DefectTracker />;
      case 'dlp':
        return <DLPExpiration />;
      case 'reports':
        return <Reports />;
      case 'certifications':
        return <Certifications />;
      case 'audit-trails':
        return <AuditTrails />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-darkbg text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans gradient-bg overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        
        {/* Render Active surveillance view */}
        <main className="flex-1 relative overflow-hidden bg-slate-50/50 dark:bg-slate-900/10">
          {renderView()}
        </main>
      </div>

      {/* Real-time Toasts notifications */}
      <ToastContainer />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useTracker();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <MainLayout />;
};

function App() {
  return (
    <TrackerProvider>
      <AppContent />
    </TrackerProvider>
  );
}

export default App;
