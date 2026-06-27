import React, { useState } from 'react';
import { useTracker, getAssetImageByName } from '../context/TrackerContext';
import type { Defect } from '../context/TrackerContext';
import { 
  MapPin, 
  HardHat, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
  ChevronRight,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AssetDetail: React.FC = () => {
  const { 
    selectedAssetId, 
    setSelectedAssetId, 
    setCurrentView, 
    assets, 
    defects, 
    auditLogs,
    currentUser
  } = useTracker();

  const [activeTab, setActiveTab] = useState<'info' | 'defects' | 'audit'>('info');

  const asset = assets.find(a => a.id === selectedAssetId);
  const assetDefects = defects.filter(d => d.assetId === selectedAssetId);
  const assetAuditLogs = auditLogs.filter(log => log.assetId === selectedAssetId);

  if (!asset) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500">Asset not found or no asset selected.</p>
        <button 
          onClick={() => setCurrentView('assets')}
          className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg text-xs font-bold"
        >
          Back to Inventory
        </button>
      </div>
    );
  }

  // Calculate stats
  const openCount = assetDefects.filter(d => ['Open', 'Assigned', 'In Progress'].includes(d.status)).length;
  const verifiedCount = assetDefects.filter(d => d.status === 'Verified').length;
  const closedCount = assetDefects.filter(d => d.status === 'Closed').length;

  const handleBack = () => {
    setSelectedAssetId(null);
    setCurrentView('assets');
  };

  const getDlpStatusMessage = (daysLeft: number) => {
    if (daysLeft <= 0) return { text: 'DLP Completed', color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' };
    if (daysLeft <= 30) return { text: `Critically close to expiry: ${daysLeft} days remaining`, color: 'text-red-500 bg-red-50 dark:bg-red-950/20' };
    if (daysLeft <= 60) return { text: `DLP expires in ${daysLeft} days`, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' };
    return { text: `DLP Active: ${daysLeft} days remaining`, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' };
  };

  // Calculate days remaining
  const daysLeft = Math.max(0, Math.ceil((new Date(asset.dlpEndDate).getTime() - new Date('2026-06-17T11:35:00.000Z').getTime()) / (1000 * 60 * 60 * 24)));
  const dlpStatus = getDlpStatusMessage(daysLeft);

  const getSeverityBadge = (sev: Defect['severity']) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'High':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getStatusBadge = (stat: Defect['status']) => {
    switch (stat) {
      case 'Closed':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      case 'Verified':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Rectified':
        return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'Assigned':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    }
  };

  // Lifecycle steps representation
  const steps = [
    { label: 'Construction Completed', active: true, done: true },
    { label: 'Substantial Inspection', active: true, done: true },
    { label: 'DLP Surveillance', active: true, done: asset.status !== 'Handed Over' },
    { label: 'Final Handover Certified', active: asset.status === 'Handed Over', done: asset.status === 'Handed Over' }
  ];

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* Back navigation & Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleBack}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">ASSET WATCH CENTER</span>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide flex items-center">
              <span>{asset.name}</span>
            </h2>
          </div>
        </div>

        <div className="flex space-x-3">
          {(currentUser.role === 'Engineer' || currentUser.role === 'Admin') && (
            <button
              onClick={() => setCurrentView('defects')}
              className="px-4 py-2 border border-slate-200 dark:border-darkbg-border hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-bold rounded-xl transition flex items-center space-x-1.5"
            >
              <Plus size={14} className="text-brand-500" />
              <span>Raise Defect</span>
            </button>
          )}

          {asset.status !== 'Handed Over' && (
            <button
              onClick={() => setCurrentView('certifications')}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/10 transition flex items-center space-x-1.5"
            >
              <CheckCircle size={14} />
              <span>Verify & Handover</span>
            </button>
          )}
        </div>
      </div>

      {/* Asset Stepper Timeline */}
      <div className="p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm">
        <h3 className="text-xs font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-6">Asset Lifecycle Progress</h3>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              {/* Connector line */}
              {index > 0 && (
                <div className="hidden md:block flex-1 h-[2px] bg-slate-100 dark:bg-slate-800 mx-4">
                  <div className={`h-full ${steps[index - 1].done ? 'bg-brand-500' : 'bg-slate-150 dark:bg-slate-800'}`} style={{ width: '100%' }} />
                </div>
              )}
              
              <div className="flex items-center md:flex-col md:text-center space-x-4 md:space-x-0 space-y-0 md:space-y-2.5 my-2 md:my-0">
                <div className={`h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs shrink-0 transition-colors duration-300 ${
                  step.done 
                    ? 'bg-brand-500 border-brand-500 text-white shadow-md shadow-brand-500/20' 
                    : step.active 
                    ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20 animate-pulse' 
                    : 'border-slate-200 dark:border-darkbg-border text-slate-400 bg-slate-50 dark:bg-slate-900/50'
                }`}>
                  {step.done ? <CheckCircle size={14} /> : index + 1}
                </div>
                <div>
                  <p className={`text-xs font-bold ${step.active ? 'text-slate-800 dark:text-slate-200' : 'text-slate-455 dark:text-slate-500'}`}>
                    {step.label}
                  </p>
                  {index === 2 && asset.status === 'DLP Active' && (
                    <span className="text-[10px] text-amber-500 font-semibold">{daysLeft} days to expiry</span>
                  )}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Container: Detail Sidebar & Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card overflow-hidden shadow-sm">
            <div className="h-40 relative bg-slate-150 dark:bg-slate-800">
              <img 
                src={
                  asset.imageUrl || asset.image_url || (
                    asset.images && asset.images[0] && 
                    !asset.images[0].includes('photo-1541888946425-d81bb19240f5') && 
                    !asset.images[0].includes('photo-1513828742140-ccaa34f3bfc1')
                      ? asset.images[0]
                      : getAssetImageByName(asset.name)
                  )
                } 
                alt={asset.name} 
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.currentTarget.src = getAssetImageByName(asset.name);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
              <span className="absolute bottom-4 left-4 text-xs font-bold text-white uppercase bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-md">
                Health Score: {asset.healthScore}%
              </span>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">CONTRACTOR PROFILE</span>
                <p className="text-sm font-extrabold text-slate-850 dark:text-slate-200 flex items-center mt-1">
                  <HardHat className="text-brand-500 mr-2" size={16} />
                  <span>{asset.contractor}</span>
                </p>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <div className="py-2.5 flex justify-between">
                  <span>Project Location</span>
                  <span className="text-slate-800 dark:text-slate-200 flex items-center">
                    <MapPin size={13} className="mr-1 text-slate-400" />
                    {asset.location.split(',')[0]}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>Contract Value</span>
                  <span className="text-slate-800 dark:text-slate-200">₹{(asset.budget / 10000000).toFixed(2)} Cr</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>DLP Duration</span>
                  <span className="text-slate-850 dark:text-slate-200">1 Year (365 days)</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>Start Date</span>
                  <span className="text-slate-800 dark:text-slate-250">{new Date(asset.dlpStartDate).toLocaleDateString()}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span>Expiry Date</span>
                  <span className="text-slate-800 dark:text-slate-250">{new Date(asset.dlpEndDate).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Expiry Alarm Banner */}
              <div className={`p-3.5 rounded-xl border flex items-start space-x-2.5 ${dlpStatus.color} border-current/10`}>
                <Clock size={16} className="mt-0.5 shrink-0" />
                <p className="text-[11px] font-bold leading-relaxed">{dlpStatus.text}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats Widget */}
          <div className="p-5 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border grid grid-cols-2 gap-4 shadow-sm">
            <div className="text-center p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
              <span className="block text-2xl font-black text-rose-500">{openCount}</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 block">Active defects</span>
            </div>
            <div className="text-center p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl">
              <span className="block text-2xl font-black text-emerald-500">{closedCount + verifiedCount}</span>
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1 block">Rectified logs</span>
            </div>
          </div>
        </div>

        {/* Dynamic Detail Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border-b border-slate-200 dark:border-darkbg-border flex space-x-6 text-xs font-extrabold uppercase tracking-wider">
            {(['info', 'defects', 'audit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 relative transition-colors ${
                  activeTab === tab ? 'text-brand-650 dark:text-brand-400' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                <span>{tab === 'info' ? 'Inspection Records' : tab === 'defects' ? 'Punch List Items' : 'Audit Trail logs'}</span>
                {activeTab === tab && (
                  <motion.div layoutId="tab-underline" className="absolute bottom-0 inset-x-0 h-0.5 bg-brand-600 dark:bg-brand-400" />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* INSPECTIONS TAB */}
              {activeTab === 'info' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-6"
                >
                  <div className="p-6 bg-white dark:bg-darkbg-card rounded-xl border border-slate-200 dark:border-darkbg-border space-y-4 shadow-sm">
                    <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide">Surveillance Quality Assessment</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                      Monthly surveillance audits verify structural integrity, mechanical operations, electrical compliance, and finish quality prior to DLP release.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs font-semibold">
                      <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Structural Integrity</span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 dark:text-slate-300">Crack Survey</span>
                          <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-500/10">Passed</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 dark:text-slate-300">Concrete Core test</span>
                          <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-500/10">Passed</span>
                        </div>
                      </div>

                      <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest block">Operational Audits</span>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 dark:text-slate-300">System Pressures</span>
                          <span className="text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-500/10">Passed</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-700 dark:text-slate-300">Water Seepage</span>
                          <span className="text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-500/10">Monitoring</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Asset checklist summary */}
                  <div className="p-6 bg-slate-50 dark:bg-slate-900/35 rounded-xl border border-slate-200 dark:border-darkbg-border space-y-4">
                    <h4 className="text-xs font-bold text-slate-450 uppercase tracking-widest">Handover Compliance Checklist</h4>
                    <div className="space-y-3 text-xs font-semibold text-slate-655 dark:text-slate-400">
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                        <span>All construction drawings as-built documentation uploaded</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                        <span>Vendor warranties and operation manuals registered</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          openCount === 0 ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {openCount === 0 && <CheckCircle size={10} />}
                        </div>
                        <span>Zero open critical/high defects in punch list (Current open: {openCount})</span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          asset.status === 'DLP Completed' || asset.status === 'Handed Over' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700'
                        }`}>
                          {(asset.status === 'DLP Completed' || asset.status === 'Handed Over') && <CheckCircle size={10} />}
                        </div>
                        <span>Defect Liability Period (DLP) successfully completed</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PUNCH LIST DEFECTS TAB */}
              {activeTab === 'defects' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="space-y-4"
                >
                  {assetDefects.length === 0 ? (
                    <div className="p-16 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-darkbg-card">
                      <AlertTriangle className="mx-auto text-slate-400 mb-2" size={32} />
                      <p className="text-xs font-bold text-slate-750 dark:text-slate-300">Clean Punch List</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-0.5">This asset currently has no defects registered. Excellent structural state.</p>
                    </div>
                  ) : (
                    assetDefects.map((defect) => (
                      <div 
                        key={defect.id}
                        className="p-5 bg-white dark:bg-darkbg-card rounded-xl border border-slate-200 dark:border-darkbg-border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition"
                      >
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">ID: {defect.id}</span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getSeverityBadge(defect.severity)}`}>
                              {defect.severity}
                            </span>
                            <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getStatusBadge(defect.status)}`}>
                              {defect.status}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white leading-relaxed">{defect.description}</p>
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center space-x-3 pt-1">
                            <span>Assignee: <strong className="text-slate-600 dark:text-slate-400">{defect.assignedContractor}</strong></span>
                            <span>•</span>
                            <span>Due: <strong className="text-slate-600 dark:text-slate-400">{new Date(defect.dueDate).toLocaleDateString()}</strong></span>
                          </div>
                        </div>

                        {/* Fast actions depending on role & status */}
                        <div className="shrink-0 flex items-center space-x-2">
                          <button
                            onClick={() => setCurrentView('defects')}
                            className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-semibold flex items-center space-x-1"
                          >
                            <span>Inspect</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </motion.div>
              )}

              {/* AUDIT LOGS TAB */}
              {activeTab === 'audit' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-6 bg-white dark:bg-darkbg-card rounded-xl border border-slate-200 dark:border-darkbg-border shadow-sm space-y-6"
                >
                  <h3 className="text-xs font-bold text-slate-450 dark:text-slate-550 uppercase tracking-widest">Asset Lifecycle Changes Log</h3>

                  <div className="space-y-6">
                    {assetAuditLogs.length === 0 ? (
                      <div className="text-center text-xs text-slate-400 py-8">No specific audit logs generated for this asset yet.</div>
                    ) : (
                      assetAuditLogs.map((log, index) => (
                        <div key={log.id} className="relative flex space-x-4 items-start">
                          {index !== assetAuditLogs.length - 1 && (
                            <span className="absolute top-5 left-2.5 -ml-[1px] h-full w-[1.5px] bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
                          )}
                          <div className="relative flex-shrink-0 mt-1">
                            <span className="h-5 w-5 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-bold">
                              {log.id.split('-')[1]}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                                <strong className="text-slate-850 dark:text-slate-100">{log.user}</strong> ({log.role})
                              </p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-550">
                                {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                              {log.action}
                            </p>
                            {log.prevValue && log.newValue && (
                              <div className="mt-2 text-[10px] font-semibold bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg inline-flex items-center space-x-2 border border-slate-150 dark:border-slate-800/40">
                                <span className="text-slate-450 uppercase">Change:</span>
                                <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1.5 py-0.5 rounded border border-rose-500/10">{log.prevValue}</span>
                                <ChevronRight size={10} className="text-slate-400" />
                                <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded border border-emerald-500/10">{log.newValue}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
