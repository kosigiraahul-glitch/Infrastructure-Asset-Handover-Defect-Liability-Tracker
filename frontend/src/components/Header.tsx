import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import { 
  Bell, 
  Sun, 
  Moon, 
  User, 
  Check, 
  AlertCircle, 
  Info,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Header: React.FC = () => {
  const { 
    currentView, 
    assets,
    selectedAssetId,
    darkMode, 
    setDarkMode, 
    currentUser, 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead,
    setIsAuthenticated,
    logSessionEvent
  } = useTracker();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getBreadcrumb = () => {
    switch (currentView) {
      case 'dashboard':
        return 'Executive Dashboard';
      case 'assets':
        return 'Asset Management Inventory';
      case 'asset-details':
        const asset = assets.find(a => a.id === selectedAssetId);
        return `Asset Inventory / ${asset?.name || 'Asset Details'}`;
      case 'defects':
        return 'Punch List Defect Tracker';
      case 'dlp':
        return 'Defect Liability Period (DLP) Watch';
      case 'reports':
        return 'Analytical Reports & Auditing';
      case 'certifications':
        return 'Handover Certificates Center';
      case 'audit-trails':
        return 'QC Node System Audit Trails';
      default:
        return 'Tracker';
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 p-1 rounded-md" size={24} />;
      case 'warning':
        return <AlertCircle className="text-amber-500 bg-amber-50 dark:bg-amber-950/30 p-1 rounded-md" size={24} />;
      case 'danger':
        return <AlertCircle className="text-rose-500 bg-rose-50 dark:bg-rose-950/30 p-1 rounded-md" size={24} />;
      default:
        return <Info className="text-blue-500 bg-blue-50 dark:bg-blue-950/30 p-1 rounded-md" size={24} />;
    }
  };

  return (
    <header className="h-20 bg-white/70 dark:bg-darkbg-card/70 backdrop-blur-md border-b border-slate-200 dark:border-darkbg-border flex items-center justify-between px-8 sticky top-0 z-20">
      {/* Breadcrumbs */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-2">
          <span>{getBreadcrumb()}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Avinash Kanaparthi Infra Private Limited • Core Node
        </p>
      </div>

      {/* Control Actions */}
      <div className="flex items-center space-x-4">
        {/* User Role Switcher Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-slate-700 dark:text-slate-200 text-xs font-semibold"
          >
            <div className="h-5 w-5 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-md flex items-center justify-center">
              <User size={13} />
            </div>
            <div className="text-left hidden sm:block">
              <span className="block font-bold">{currentUser.name}</span>
              <span className="block text-[9px] text-slate-400 font-medium uppercase tracking-wider">{currentUser.role}</span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>

          <AnimatePresence>
            {showUserDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowUserDropdown(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-800 shadow-xl py-2 z-20 glass-panel"
                >
                  <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-750/50">
                    <p className="text-xs font-extrabold text-slate-800 dark:text-white">{currentUser.name}</p>
                    <p className="text-[9px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mt-0.5">{currentUser.role} {currentUser.contractorCompany ? `(${currentUser.contractorCompany})` : ''}</p>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        logSessionEvent(currentUser, 'Logout');
                        setIsAuthenticated(false);
                        setShowUserDropdown(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-left text-xs text-rose-500 hover:bg-rose-55/10 hover:text-rose-600 dark:hover:bg-rose-950/25 transition font-extrabold rounded-lg"
                    >
                      <span>Disconnect Session</span>
                      <LogOut size={13} className="text-rose-500" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Center */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2.5 rounded-lg border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotifDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotifDropdown(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-800 shadow-xl z-20 overflow-hidden glass-panel"
                >
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">System Notifications</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-brand-600 dark:text-brand-400 font-bold hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                        No notifications at this time.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-4 flex items-start space-x-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition cursor-pointer ${
                            !n.read ? 'bg-slate-50/50 dark:bg-slate-700/10' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {getNotifIcon(n.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-xs truncate ${!n.read ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}`}>
                                {n.title}
                              </p>
                              {!n.read && <span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" />}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1.5">
                              {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2.5 rounded-lg border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          aria-label="Toggle Theme"
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>


    </header>
  );
};
