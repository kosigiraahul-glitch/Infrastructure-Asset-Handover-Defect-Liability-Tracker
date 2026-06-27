import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { 
  Building2, 
  AlertTriangle, 
  Clock, 
  Award,
  ChevronRight,
  TrendingUp,
  FileText,
  UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Legend 
} from 'recharts';
import { motion } from 'framer-motion';

export const Dashboard: React.FC = () => {
  const { assets, defects, auditLogs, setCurrentView } = useTracker();

  // 1. CALCULATE KPI STATS
  const totalAssets = assets.length;
  const assetsUnderDLP = assets.filter(a => a.status === 'DLP Active').length;
  
  const openDefects = defects.filter(d => ['Open', 'Assigned', 'In Progress'].includes(d.status)).length;
  const rectifiedDefects = defects.filter(d => d.status === 'Rectified').length;
  const verifiedDefects = defects.filter(d => d.status === 'Verified').length;
  const finalHandovers = assets.filter(a => a.status === 'Handed Over').length;

  const kpis = [
    {
      title: 'Total Assets',
      value: totalAssets,
      desc: 'Infrastructure items',
      icon: Building2,
      color: 'from-blue-500 to-indigo-500 shadow-blue-500/10',
      textColor: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      view: 'assets'
    },
    {
      title: 'Assets Under DLP',
      value: assetsUnderDLP,
      desc: 'Active liability monitoring',
      icon: Clock,
      color: 'from-amber-500 to-orange-500 shadow-amber-500/10',
      textColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      view: 'dlp'
    },
    {
      title: 'Open Defects',
      value: openDefects,
      desc: 'Awaiting completion',
      icon: AlertTriangle,
      color: 'from-rose-500 to-red-500 shadow-rose-500/10',
      textColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10',
      view: 'defects'
    },
    {
      title: 'Rectified / Verified',
      value: `${rectifiedDefects} / ${verifiedDefects}`,
      desc: 'Ready for final sign-off',
      icon: UserCheck,
      color: 'from-teal-500 to-emerald-500 shadow-teal-500/10',
      textColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      view: 'defects'
    },
    {
      title: 'Final Handovers',
      value: finalHandovers,
      desc: 'Fully certified assets',
      icon: Award,
      color: 'from-violet-500 to-purple-500 shadow-violet-500/10',
      textColor: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      view: 'certifications'
    }
  ];

  // 2. CHART 1: DEFECT STATUS DISTRIBUTION
  const statusData = [
    { name: 'Open', value: defects.filter(d => d.status === 'Open').length, color: '#f43f5e' },
    { name: 'Assigned', value: defects.filter(d => d.status === 'Assigned').length, color: '#f59e0b' },
    { name: 'In Progress', value: defects.filter(d => d.status === 'In Progress').length, color: '#3b82f6' },
    { name: 'Rectified', value: defects.filter(d => d.status === 'Rectified').length, color: '#06b6d4' },
    { name: 'Verified', value: defects.filter(d => d.status === 'Verified').length, color: '#10b981' },
    { name: 'Closed', value: defects.filter(d => d.status === 'Closed').length, color: '#64748b' }
  ].filter(d => d.value > 0);

  // 3. CHART 2: MONTHLY DEFECT CLOSURE TREND (Mocked with actual-aligned timestamps)
  const closureTrendData = [
    { month: 'Jan', raised: 4, closed: 3 },
    { month: 'Feb', raised: 6, closed: 5 },
    { month: 'Mar', raised: 8, closed: 6 },
    { month: 'Apr', raised: 5, closed: 7 },
    { month: 'May', raised: 9, closed: 8 },
    { month: 'Jun', raised: defects.length, closed: defects.filter(d => d.status === 'Closed' || d.status === 'Verified').length + 2 }
  ];

  // 4. CHART 3: CONTRACTOR PERFORMANCE SCORE
  // Calculate resolved defects vs total defects
  const contractors = Array.from(new Set(assets.map(a => a.contractor)));
  const contractorPerformanceData = contractors.map(contractor => {
    const contractorDefs = defects.filter(d => d.assignedContractor === contractor);
    const resolved = contractorDefs.filter(d => ['Rectified', 'Verified', 'Closed'].includes(d.status)).length;
    const total = contractorDefs.length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 100;
    
    return {
      name: contractor.split(' ')[0] || contractor, // short name e.g., "L&T"
      'Resolution Rate (%)': rate,
      'Total Defects': total,
    };
  });

  // 5. CHART 4: DLP EXPIRY WATCH TIMELINE (Omitted)

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, bounce: 0.15 } }
  };

  const handleKpiClick = (view: string) => {
    setCurrentView(view as any);
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-5rem)]"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-slate-900 via-brand-900 to-slate-900 p-8 rounded-2xl border border-slate-800 text-white relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-2">
          <span className="bg-brand-500/20 text-brand-300 border border-brand-500/30 text-[10px] uppercase font-bold tracking-widest px-3 py-1 rounded-full">
            DLP Lifecycle Hub
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-2">
            AVINASH KANAPARTHI INFRASTRUCTURE
          </h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-xl leading-relaxed">
            Real-time quality surveillance, punch list rectifications status, and asset handover certifications database.
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3 z-10 shrink-0">
          <button 
            onClick={() => setCurrentView('assets')}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-brand-500/20 transition flex items-center space-x-1.5"
          >
            <span>Register Asset</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.02 }}
              onClick={() => handleKpiClick(kpi.view)}
              className="p-5 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border flex flex-col justify-between shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-slate-500/5 to-transparent rounded-full pointer-events-none" />
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg ${kpi.bgColor} ${kpi.textColor} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon size={18} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
                  {kpi.value}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                  {kpi.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Charts & Feed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Defect Status Donut */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-1 p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border flex flex-col justify-between shadow-sm"
        >
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Defects by Status</span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Punch list status distribution</p>
          </div>

          <div className="h-64 my-4 flex items-center justify-center relative">
            {statusData.length === 0 ? (
              <div className="text-slate-400 dark:text-slate-500 text-xs">No defects logged yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      background: 'rgba(15, 23, 42, 0.9)', 
                      border: 'none', 
                      borderRadius: '8px', 
                      color: '#fff',
                      fontSize: '11px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
                {defects.length}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Total Logs
              </span>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-3 gap-2 text-center">
            {statusData.map((d, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[50px]">
                    {d.name}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Chart 2: Defect Closure Trend Area Chart */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <span>Monthly Defect Closure Trend</span>
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Raised vs. Rectified defects timeline</p>
            </div>
            <TrendingUp size={16} className="text-indigo-500 animate-pulse" />
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={closureTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRaised" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '11px' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', paddingTop: 10 }} />
                <Area type="monotone" dataKey="raised" name="Defects Raised" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorRaised)" />
                <Area type="monotone" dataKey="closed" name="Defects Closed" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorClosed)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 3: Contractor Performance Scores */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm flex flex-col justify-between"
        >
          <div>
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Contractor Defect Rectification Performance
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Defect resolution rate by key vendor partners</p>
          </div>

          <div className="h-64 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractorPerformanceData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: 'none', 
                    borderRadius: '8px', 
                    color: '#fff',
                    fontSize: '11px' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="Resolution Rate (%)" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {contractorPerformanceData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry['Resolution Rate (%)'] > 85 ? '#10b981' : entry['Resolution Rate (%)'] > 60 ? '#f59e0b' : '#f43f5e'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Audit / Live Activity Feed */}
        <motion.div 
          variants={itemVariants} 
          className="lg:col-span-1 p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm flex flex-col"
        >
          <div className="mb-4">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Asset Quality Activity Feed
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Real-time defect tracking audits</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[16.5rem] pr-2">
            {auditLogs.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">No audit logs available.</div>
            ) : (
              auditLogs.slice(0, 8).map((log, index) => (
                <div key={log.id} className="relative flex space-x-3 items-start group">
                  {index !== Math.min(7, auditLogs.length - 1) && (
                    <span className="absolute top-5 left-2.5 -ml-[1px] h-full w-[1.5px] bg-slate-200 dark:bg-slate-700/60" aria-hidden="true" />
                  )}
                  <div className="relative flex-shrink-0 mt-1">
                    <span className="h-5 w-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 text-[9px] font-extrabold">
                      {auditLogs.length - index}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 font-semibold leading-relaxed">
                      <span className="font-bold text-slate-800 dark:text-slate-100">{log.user}</span> ({log.role})
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-relaxed">
                      {log.action}
                      {log.assetName && (
                        <span className="block italic text-brand-600 dark:text-brand-400 mt-0.5 font-semibold">
                          Asset: {log.assetName}
                        </span>
                      )}
                    </p>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => setCurrentView('reports')}
            className="w-full mt-4 py-2 border border-slate-200 dark:border-darkbg-border hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-bold transition flex items-center justify-center space-x-1"
          >
            <FileText size={13} />
            <span>View All Audit Logs</span>
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};
