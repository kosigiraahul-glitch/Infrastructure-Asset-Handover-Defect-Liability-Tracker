import React from 'react';
import { useTracker } from '../context/TrackerContext';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { 
  FileSpreadsheet, 
  ShieldCheck, 
  FileDown
} from 'lucide-react';

export const Reports: React.FC = () => {
  const { assets, defects, auditLogs } = useTracker();

  // 1. CHART: DEFECTS BY SEVERITY
  const severityCount = {
    Low: defects.filter(d => d.severity === 'Low').length,
    Medium: defects.filter(d => d.severity === 'Medium').length,
    High: defects.filter(d => d.severity === 'High').length,
    Critical: defects.filter(d => d.severity === 'Critical').length,
  };

  const severityChartData = [
    { name: 'Low', count: severityCount.Low, color: '#3b82f6' },
    { name: 'Medium', count: severityCount.Medium, color: '#f59e0b' },
    { name: 'High', count: severityCount.High, color: '#f43f5e' },
    { name: 'Critical', count: severityCount.Critical, color: '#ef4444' }
  ];

  // 2. CONTRACTOR LEAGUE TABLE
  const contractorsList = Array.from(new Set(assets.map(a => a.contractor)));
  const contractorTable = contractorsList.map(contractor => {
    const contractorDefs = defects.filter(d => d.assignedContractor === contractor);
    const total = contractorDefs.length;
    const resolved = contractorDefs.filter(d => ['Rectified', 'Verified', 'Closed'].includes(d.status)).length;
    const pending = total - resolved;
    const critical = contractorDefs.filter(d => d.severity === 'Critical' && d.status !== 'Closed').length;
    
    // Average score
    const score = total > 0 ? Math.round((resolved / total) * 100) : 100;

    return {
      name: contractor,
      total,
      resolved,
      pending,
      critical,
      score
    };
  });

  // 3. EXPORT TO CSV SCRIPTS
  const exportAssetsToCSV = () => {
    const headers = ['Asset ID', 'Asset Name', 'Project', 'Location', 'Contractor', 'DLP Start', 'DLP End', 'Budget (INR)', 'Status', 'Health Score'];
    const rows = assets.map(a => [
      a.id,
      `"${a.name.replace(/"/g, '""')}"`,
      `"${a.projectName.replace(/"/g, '""')}"`,
      `"${a.location.replace(/"/g, '""')}"`,
      `"${a.contractor.replace(/"/g, '""')}"`,
      a.dlpStartDate.substring(0, 10),
      a.dlpEndDate.substring(0, 10),
      a.budget,
      a.status,
      a.healthScore
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Avinash_Assets_DLP_Report_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDefectsToCSV = () => {
    const headers = ['Defect ID', 'Asset ID', 'Asset Name', 'Description', 'Severity', 'Contractor', 'Due Date', 'Status', 'Comments Count'];
    const rows = defects.map(d => [
      d.id,
      d.assetId,
      `"${d.assetName.replace(/"/g, '""')}"`,
      `"${d.description.replace(/"/g, '""')}"`,
      d.severity,
      `"${d.assignedContractor.replace(/"/g, '""')}"`,
      d.dueDate.substring(0, 10),
      d.status,
      d.comments.length
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Avinash_Defects_PunchList_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportAuditLogsToCSV = () => {
    const headers = ['Log ID', 'Asset ID', 'Defect ID', 'User Name', 'Role', 'Action', 'Previous Value', 'New Value', 'Timestamp'];
    const rows = auditLogs.map(l => [
      l.id,
      l.assetId || 'N/A',
      l.defectId || 'N/A',
      `"${l.user.replace(/"/g, '""')}"`,
      l.role,
      `"${l.action.replace(/"/g, '""')}"`,
      l.prevValue || 'N/A',
      l.newValue || 'N/A',
      l.timestamp
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Avinash_Surveillance_Audits_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* Header and exports action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Analytical Reports
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Generate and export quality data statements
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={exportAssetsToCSV}
            className="px-4 py-2 border border-slate-200 dark:border-darkbg-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
          >
            <FileSpreadsheet size={14} className="text-emerald-500" />
            <span>Export Assets CSV</span>
          </button>

          <button
            onClick={exportDefectsToCSV}
            className="px-4 py-2 border border-slate-200 dark:border-darkbg-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
          >
            <FileSpreadsheet size={14} className="text-amber-500" />
            <span>Export Punch List CSV</span>
          </button>

          <button
            onClick={exportAuditLogsToCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow"
          >
            <FileDown size={14} />
            <span>Export Audits CSV</span>
          </button>
        </div>
      </div>

      {/* Main analytics grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity chart */}
        <div className="lg:col-span-1 p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">Defects by Severity</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Defect logs segmented by structural risk</p>
          </div>

          <div className="h-60 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
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
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={35}>
                  {severityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Contractor analytics */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">Contractor Performance Ratings</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Audit overview of active contractor groups</p>
            </div>
            <ShieldCheck size={16} className="text-emerald-500" />
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="text-slate-450 border-b border-slate-100 dark:border-slate-800 pb-2">
                <tr>
                  <th className="pb-3 font-bold uppercase">CONTRACTOR VENDOR</th>
                  <th className="pb-3 font-bold uppercase text-center">TOTAL DEFECTS</th>
                  <th className="pb-3 font-bold uppercase text-center">RESOLVED</th>
                  <th className="pb-3 font-bold uppercase text-center">PENDING</th>
                  <th className="pb-3 font-bold uppercase text-center">CRITICAL</th>
                  <th className="pb-3 font-bold uppercase text-right">RATING SCORE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-slate-700 dark:text-slate-350">
                {contractorTable.map((con, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="py-3 font-extrabold text-slate-850 dark:text-slate-200">{con.name}</td>
                    <td className="py-3 text-center">{con.total}</td>
                    <td className="py-3 text-center text-emerald-500">{con.resolved}</td>
                    <td className="py-3 text-center text-slate-500">{con.pending}</td>
                    <td className="py-3 text-center text-red-500">{con.critical}</td>
                    <td className="py-3 text-right">
                      <span className={`font-black text-xs ${
                        con.score > 85 ? 'text-emerald-500' :
                        con.score > 60 ? 'text-amber-500' :
                        'text-red-500'
                      }`}>
                        {con.score}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Asset Quality Index List */}
      <div className="p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wide">Infrastructure Quality Health Score</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Asset health index computed by active defect severity penalties</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
          {assets.map((asset) => (
            <div key={asset.id} className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800 dark:text-white uppercase truncate max-w-[170px]">{asset.name}</span>
                <span className={`text-xs font-black ${
                  asset.healthScore > 90 ? 'text-emerald-500' :
                  asset.healthScore > 75 ? 'text-amber-500' :
                  'text-red-500'
                }`}>
                  {asset.healthScore}%
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    asset.healthScore > 90 ? 'bg-emerald-500' :
                    asset.healthScore > 75 ? 'bg-amber-500' :
                    'bg-red-500'
                  }`} 
                  style={{ width: `${asset.healthScore}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">
                <span>Contractor: {asset.contractor.split(' ')[0]}</span>
                <span>Status: {asset.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
