import React from 'react';
import { useTracker } from '../context/TrackerContext';
import type { ViewType } from '../context/TrackerContext';
import { 
  LayoutDashboard, 
  Building2, 
  AlertTriangle, 
  Clock, 
  BarChart3, 
  Award,
  ChevronRight,
  HardHat,
  ShieldAlert
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Sidebar: React.FC = () => {
  const { currentView, setCurrentView, setSelectedAssetId, currentUser } = useTracker();

  const allMenuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets', name: 'Asset Inventory', icon: Building2 },
    { id: 'defects', name: 'Punch List & Kanban', icon: AlertTriangle },
    { id: 'dlp', name: 'DLP Monitoring', icon: Clock },
    { id: 'reports', name: 'Reports & Analytics', icon: BarChart3 },
    { id: 'certifications', name: 'Handover Certificates', icon: Award },
    { id: 'audit-trails', name: 'Audit Trails', icon: ShieldAlert },
  ] as const;

  const menuItems = allMenuItems.filter(item => {
    const role = currentUser.role;
    if (role === 'Admin') return true;
    if (role === 'Engineer') {
      return ['dashboard', 'assets', 'defects', 'dlp', 'certifications'].includes(item.id);
    }
    if (role === 'Project Manager') {
      return ['dashboard', 'assets', 'dlp', 'reports', 'certifications'].includes(item.id);
    }
    if (role === 'Contractor') {
      return ['dashboard', 'defects'].includes(item.id);
    }
    return false;
  });

  const handleNav = (viewId: ViewType) => {
    setSelectedAssetId(null);
    setCurrentView(viewId);
  };

  return (
    <aside className="w-72 bg-white dark:bg-darkbg-card border-r border-slate-200 dark:border-darkbg-border flex flex-col h-screen sticky top-0 z-30 shrink-0">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-slate-200 dark:border-darkbg-border flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-brand-600 to-indigo-600 p-2.5 rounded-xl text-white shadow-lg shadow-brand-500/20">
          <HardHat size={22} className="animate-float" />
        </div>
        <div>
          <h1 className="text-sm font-extrabold tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            AVINASH KANAPARTHI
          </h1>
          <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 tracking-widest uppercase">
            INFRA PVT. LTD.
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = currentView === item.id || (item.id === 'assets' && currentView === 'asset-details');
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive 
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50/80 dark:bg-brand-950/40 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center space-x-3.5 z-10">
                <Icon size={18} className={`transition-transform duration-300 group-hover:scale-110 ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
                }`} />
                <span>{item.name}</span>
              </div>

              {isActive ? (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-1 h-8 bg-brand-600 dark:bg-brand-400 rounded-r-md"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              ) : null}

              <ChevronRight size={14} className={`opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
              }`} />
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer info */}
      <div className="p-4 border-t border-slate-200 dark:border-darkbg-border bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center space-x-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            System Live: Central Node
          </span>
        </div>
      </div>
    </aside>
  );
};
