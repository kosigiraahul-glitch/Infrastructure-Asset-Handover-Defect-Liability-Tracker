import React from 'react';
import { useTracker } from '../context/TrackerContext';
import type { Asset } from '../context/TrackerContext';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Hourglass,
  Calendar,
  Building
} from 'lucide-react';
import { motion } from 'framer-motion';

export const DLPExpiration: React.FC = () => {
  const { assets } = useTracker();

  // Reference date: 2026-06-17T11:35:00.000Z
  const now = new Date('2026-06-17T11:35:00.000Z').getTime();

  const getDlpMetrics = (asset: Asset) => {
    const end = new Date(asset.dlpEndDate).getTime();
    const start = new Date(asset.dlpStartDate).getTime();
    
    const totalDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    const percentElapsed = Math.min(100, Math.round(((totalDays - daysRemaining) / totalDays) * 100));

    let statusGroup: 'green' | 'orange' | 'red' | 'completed' = 'green';
    if (asset.status === 'Handed Over' || asset.status === 'DLP Completed' || daysRemaining <= 0) {
      statusGroup = 'completed';
    } else if (daysRemaining < 30) {
      statusGroup = 'red';
    } else if (daysRemaining < 60) {
      statusGroup = 'orange';
    }

    return {
      daysRemaining,
      percentElapsed,
      statusGroup,
      totalDays
    };
  };

  const getUrgencyStyles = (group: 'green' | 'orange' | 'red' | 'completed') => {
    switch (group) {
      case 'completed':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-250 dark:border-emerald-900/40',
          text: 'text-emerald-800 dark:text-emerald-300',
          badge: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
          ring: 'stroke-emerald-500'
        };
      case 'red':
        return {
          bg: 'bg-red-50 dark:bg-red-950/20 border-red-250 dark:border-red-900/40',
          text: 'text-red-800 dark:text-red-300',
          badge: 'bg-red-500/20 text-red-500 border-red-500/30',
          ring: 'stroke-red-500'
        };
      case 'orange':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-900/40',
          text: 'text-amber-800 dark:text-amber-300',
          badge: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
          ring: 'stroke-amber-500'
        };
      default:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20 border-blue-250 dark:border-blue-900/40',
          text: 'text-blue-800 dark:text-blue-300',
          badge: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
          ring: 'stroke-blue-500'
        };
    }
  };

  const activeDlpAssets = assets.filter(a => a.status === 'DLP Active');
  
  const redAssets = activeDlpAssets.filter(a => getDlpMetrics(a).statusGroup === 'red');
  const orangeAssets = activeDlpAssets.filter(a => getDlpMetrics(a).statusGroup === 'orange');
  const greenAssets = activeDlpAssets.filter(a => getDlpMetrics(a).statusGroup === 'green');

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* View Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          DLP Surveillance Center
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Monitor remaining Defect Liability Period (DLP) for active structures
        </p>
      </div>

      {/* Expiry Alarm Alert Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Red Alarm */}
        <div className="p-5 rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10 flex items-start space-x-4">
          <div className="p-3.5 bg-red-500/20 text-red-500 rounded-xl shrink-0">
            <AlertTriangle className="animate-pulse" size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-red-800 dark:text-red-300 uppercase tracking-wider">Critical Expirations (&lt;30 days)</h4>
            <p className="text-[22px] font-black text-slate-800 dark:text-white mt-1.5">{redAssets.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Requires urgent punch list closure sign-off.</p>
          </div>
        </div>

        {/* Orange Alarm */}
        <div className="p-5 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/10 flex items-start space-x-4">
          <div className="p-3.5 bg-amber-500/20 text-amber-500 rounded-xl shrink-0">
            <Clock size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">Upcoming Expirations (&lt;60 days)</h4>
            <p className="text-[22px] font-black text-slate-800 dark:text-white mt-1.5">{orangeAssets.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Final inspections scheduling required.</p>
          </div>
        </div>

        {/* Green Normal */}
        <div className="p-5 rounded-xl border border-blue-200 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/10 flex items-start space-x-4">
          <div className="p-3.5 bg-blue-500/20 text-blue-500 rounded-xl shrink-0">
            <Hourglass size={20} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider">Stable Surveillance (&gt;90 days)</h4>
            <p className="text-[22px] font-black text-slate-800 dark:text-white mt-1.5">{greenAssets.length}</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">Routine surveillance in progress.</p>
          </div>
        </div>
      </div>

      {/* Detailed Expiration Grid */}
      <div className="space-y-6">
        <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-widest">Surveillance Countdown Monitors</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => {
            const metrics = getDlpMetrics(asset);
            const style = getUrgencyStyles(metrics.statusGroup);
            
            // Circumference of SVG circle: r=40 => 2*pi*r = ~251.2
            const strokeDashoffset = 251.2 - (251.2 * metrics.percentElapsed) / 100;

            return (
              <motion.div
                key={asset.id}
                whileHover={{ y: -4 }}
                className={`p-6 rounded-xl border bg-white dark:bg-darkbg-card shadow-sm hover:shadow-md transition flex flex-col justify-between space-y-6 relative overflow-hidden`}
              >
                {/* Visual indicator bar at the top */}
                <div className={`absolute top-0 inset-x-0 h-1 ${
                  metrics.statusGroup === 'completed' ? 'bg-emerald-500' :
                  metrics.statusGroup === 'red' ? 'bg-red-500' :
                  metrics.statusGroup === 'orange' ? 'bg-amber-500' :
                  'bg-blue-500'
                }`} />

                {/* Info and Progress Ring */}
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1 min-w-0 pr-4">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">ID: {asset.id}</span>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white truncate uppercase tracking-wide leading-tight">
                      {asset.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate flex items-center">
                      <Building size={12} className="mr-1" />
                      {asset.contractor}
                    </p>
                  </div>

                  {/* SVG circular progress ring */}
                  <div className="relative h-20 w-20 shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Background circle */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                        strokeWidth="5"
                      />
                      {/* Active progress */}
                      <circle
                        cx="40"
                        cy="40"
                        r="32"
                        className={`fill-none transition-all duration-500 ${style.ring}`}
                        strokeWidth="5"
                        strokeDasharray="251.2"
                        strokeDashoffset={strokeDashoffset}
                      />
                    </svg>
                    <div className="absolute text-center flex flex-col">
                      <span className="text-xs font-black text-slate-800 dark:text-white">{metrics.percentElapsed}%</span>
                      <span className="text-[7px] text-slate-400 dark:text-slate-500 font-bold uppercase">elapsed</span>
                    </div>
                  </div>
                </div>

                {/* Countdown widgets & timeline details */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-0.5">DLP TIME REMAINING</span>
                    {metrics.statusGroup === 'completed' ? (
                      <span className="text-emerald-500 font-extrabold flex items-center">
                        <CheckCircle2 size={13} className="mr-1" />
                        Completed
                      </span>
                    ) : (
                      <span className={`font-black flex items-center ${
                        metrics.statusGroup === 'red' ? 'text-red-500 animate-pulse' :
                        metrics.statusGroup === 'orange' ? 'text-amber-500' :
                        'text-blue-500'
                      }`}>
                        {metrics.daysRemaining} Days
                      </span>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="block text-[9px] text-slate-400 dark:text-slate-550 uppercase tracking-wider mb-0.5">EXPIRY DATE</span>
                    <span className="text-slate-700 dark:text-slate-350 flex items-center justify-end">
                      <Calendar size={12} className="mr-1 text-slate-400" />
                      {new Date(asset.dlpEndDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
