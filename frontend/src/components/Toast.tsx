import React, { useEffect, useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { Notification } from '../context/TrackerContext';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { notifications } = useTracker();
  const [activeToasts, setActiveToasts] = useState<Notification[]>([]);

  // Watch notifications and display newly added ones
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0]; // notifications are ordered newest-first in context
      const timeDiff = Date.now() - new Date(latest.timestamp).getTime();
      
      // If it was created within the last 4 seconds, show a toast
      if (timeDiff < 4000) {
        // Avoid duplicates
        setActiveToasts(prev => {
          if (prev.some(t => t.id === latest.id)) return prev;
          return [latest, ...prev].slice(0, 3); // show at most 3 at a time
        });

        // Auto remove after 4.5 seconds
        const timer = setTimeout(() => {
          setActiveToasts(prev => prev.filter(t => t.id !== latest.id));
        }, 4500);

        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  const removeToast = (id: string) => {
    setActiveToasts(prev => prev.filter(t => t.id !== id));
  };

  const getToastStyle = (type: string) => {
    switch (type) {
      case 'success':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/40',
          text: 'text-emerald-800 dark:text-emerald-300',
          icon: <CheckCircle className="text-emerald-500 shrink-0" size={18} />
        };
      case 'warning':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/40',
          text: 'text-amber-800 dark:text-amber-300',
          icon: <AlertTriangle className="text-amber-500 shrink-0" size={18} />
        };
      case 'danger':
        return {
          bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/40',
          text: 'text-rose-800 dark:text-rose-300',
          icon: <AlertCircle className="text-rose-500 shrink-0" size={18} />
        };
      default:
        return {
          bg: 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700',
          text: 'text-slate-800 dark:text-slate-300',
          icon: <Info className="text-brand-500 shrink-0" size={18} />
        };
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full">
      <AnimatePresence>
        {activeToasts.map((toast) => {
          const style = getToastStyle(toast.type);
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              layout
              className={`p-4 rounded-xl border flex items-start space-x-3 shadow-lg backdrop-blur-md ${style.bg} ${style.text}`}
            >
              {style.icon}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold leading-tight">{toast.title}</p>
                <p className="text-[11px] opacity-90 mt-1 leading-relaxed">{toast.message}</p>
              </div>
              <button 
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 shrink-0"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
