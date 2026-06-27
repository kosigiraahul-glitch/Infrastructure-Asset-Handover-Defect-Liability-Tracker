import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { Defect } from '../context/TrackerContext';
import { 
  Search, 
  Plus, 
  Paperclip, 
  Calendar, 
  User, 
  X, 
  Send, 
  PlusCircle, 
  LayoutGrid,
  List,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const DefectTracker: React.FC = () => {
  const { 
    defects, 
    assets, 
    addDefect, 
    updateDefectStatus, 
    addComment, 
    addAttachment,
    deleteAttachment,
    currentUser
  } = useTracker();

  const isTransitionAllowed = (from: Defect['status'], to: Defect['status']): boolean => {
    if (currentUser.role === 'Admin') return true;
    
    if (currentUser.role === 'Engineer') {
      // Site Engineer: Open -> Assigned, Rectified -> Verified
      if (from === 'Open' && to === 'Assigned') return true;
      if (from === 'Assigned' && to === 'Open') return true;
      if (from === 'Rectified' && to === 'Verified') return true;
      if (from === 'Verified' && to === 'Rectified') return true;
    }
    
    if (currentUser.role === 'Contractor') {
      // Contractor: Assigned -> In Progress -> Rectified
      if (from === 'Assigned' && to === 'In Progress') return true;
      if (from === 'In Progress' && to === 'Assigned') return true;
      if (from === 'In Progress' && to === 'Rectified') return true;
      if (from === 'Rectified' && to === 'In Progress') return true;
    }
    
    if (currentUser.role === 'Project Manager') {
      // PM: Verified -> Closed
      if (from === 'Verified' && to === 'Closed') return true;
      if (from === 'Closed' && to === 'Verified') return true;
    }
    
    return false;
  };

  // View settings
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('All');
  
  // Selected defect for detail drawer
  const [selectedDefectId, setSelectedDefectId] = useState<string | null>(null);
  
  // Add Defect modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssetId, setNewAssetId] = useState(assets[0]?.id || '');
  const [newDesc, setNewDesc] = useState('');
  const [newSeverity, setNewSeverity] = useState<Defect['severity']>('Medium');
  const [newDueDate, setNewDueDate] = useState('2026-06-25');

  // Input comment state
  const [commentText, setCommentText] = useState('');

  // Lightbox preview state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Attachment image comments state
  const [imageComments, setImageComments] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('mock_image_comments');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleImageCommentChange = (imageName: string, text: string) => {
    setImageComments(prev => {
      const updated = { ...prev, [imageName]: text };
      localStorage.setItem('mock_image_comments', JSON.stringify(updated));
      return updated;
    });
  };

  // Attachment upload state

  // Data helpers
  const columns: Defect['status'][] = ['Open', 'Assigned', 'In Progress', 'Rectified', 'Verified', 'Closed'];

  const getSeverityColor = (sev: Defect['severity']) => {
    switch (sev) {
      case 'Critical': return 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-500/10';
      case 'High': return 'text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-500/10';
      case 'Medium': return 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-500/10';
      default: return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-500/10';
    }
  };

  const getStatusColor = (status: Defect['status']) => {
    switch (status) {
      case 'Open': return 'border-rose-300 dark:border-rose-900 bg-rose-500';
      case 'Assigned': return 'border-amber-300 dark:border-amber-900 bg-amber-500';
      case 'In Progress': return 'border-blue-300 dark:border-blue-900 bg-blue-500';
      case 'Rectified': return 'border-cyan-300 dark:border-cyan-900 bg-cyan-500';
      case 'Verified': return 'border-emerald-305 dark:border-emerald-900 bg-emerald-500';
      default: return 'border-slate-300 dark:border-slate-800 bg-slate-500';
    }
  };

  const filteredDefects = defects.filter(d => {
    const matchSearch = d.description.toLowerCase().includes(search.toLowerCase()) || 
                        d.assetName.toLowerCase().includes(search.toLowerCase()) ||
                        d.id.toLowerCase().includes(search.toLowerCase());
    
    const matchSeverity = severityFilter === 'All' || d.severity === severityFilter;

    return matchSearch && matchSeverity;
  });

  const activeDefect = defects.find(d => d.id === selectedDefectId);

  // Form submits
  const handleRaiseDefect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc || !newAssetId) return;

    const selectedAsset = assets.find(a => a.id === newAssetId);
    if (!selectedAsset) return;

    addDefect({
      assetId: newAssetId,
      assetName: selectedAsset.name,
      description: newDesc,
      severity: newSeverity,
      assignedContractor: selectedAsset.contractor,
      dueDate: new Date(newDueDate).toISOString()
    });

    setNewDesc('');
    setShowAddModal(false);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText || !selectedDefectId) return;
    addComment(selectedDefectId, commentText);
    setCommentText('');
  };

  // Handler for files is now inline on upload

  // Move defect stage forward
  const getNextStatus = (curr: Defect['status']): Defect['status'] | null => {
    const idx = columns.indexOf(curr);
    if (idx >= 0 && idx < columns.length - 1) {
      return columns[idx + 1];
    }
    return null;
  };

  const getPrevStatus = (curr: Defect['status']): Defect['status'] | null => {
    const idx = columns.indexOf(curr);
    if (idx > 0) {
      return columns[idx - 1];
    }
    return null;
  };

  return (
    <div className="p-8 space-y-6 overflow-hidden h-[calc(100vh-5rem)] flex flex-col">
      {/* Title & Toolbar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Punch List Surrounds
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Track and rectify construction defect records
          </p>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* View toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-darkbg-border">
            <button
              onClick={() => setViewMode('board')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                viewMode === 'board' 
                  ? 'bg-white dark:bg-slate-700 text-brand-650 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <LayoutGrid size={13} />
              <span className="hidden sm:inline">Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                viewMode === 'list' 
                  ? 'bg-white dark:bg-slate-700 text-brand-650 dark:text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <List size={13} />
              <span className="hidden sm:inline">List Tracker</span>
            </button>
          </div>

          {(currentUser.role === 'Engineer' || currentUser.role === 'Admin') ? (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-brand-500/15 flex items-center space-x-1.5 transition-all duration-200 ml-auto md:ml-0"
            >
              <Plus size={14} />
              <span>Raise Defect</span>
            </button>
          ) : (
            <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3.5 py-2 rounded-xl border border-slate-205 dark:border-slate-800 shadow-sm ml-auto md:ml-0">
              🔒 Raising Restricted to Site Engineers
            </div>
          )}
        </div>
      </div>

      {/* Toolbar filter */}
      <div className="p-4 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border flex flex-col md:flex-row gap-4 items-center shrink-0">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search defects by ID, description, asset..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-slate-50/50 dark:bg-slate-900/50 focus:border-brand-500 focus:outline-none dark:text-white"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">Severity:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900 focus:border-brand-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Dynamic Content Container */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {viewMode === 'board' ? (
          // ==========================================
          // KANBAN WORKFLOW BOARD
          // ==========================================
          <div className="h-full overflow-x-auto flex space-x-4 pb-4 select-none pr-4">
            {columns.map((col) => {
              const colDefects = filteredDefects.filter(d => d.status === col);
              return (
                <div 
                  key={col} 
                  className="w-80 shrink-0 bg-slate-50/70 dark:bg-slate-900/35 border border-slate-200 dark:border-darkbg-border rounded-xl flex flex-col h-full overflow-hidden"
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b border-slate-200 dark:border-darkbg-border flex justify-between items-center bg-white dark:bg-darkbg-card">
                    <div className="flex items-center space-x-2">
                      <span className={`h-2.5 w-2.5 rounded-full border ${getStatusColor(col)}`} />
                      <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                        {col}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full">
                      {colDefects.length}
                    </span>
                  </div>

                  {/* Card Container */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {colDefects.map((defect) => (
                      <motion.div
                        layoutId={`defect-card-${defect.id}`}
                        key={defect.id}
                        onClick={() => setSelectedDefectId(defect.id)}
                        whileHover={{ scale: 1.015, y: -2 }}
                        className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 shadow-sm hover:shadow transition-all duration-200 cursor-pointer space-y-3"
                      >
                        {/* Tags */}
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">{defect.id}</span>
                          <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getSeverityColor(defect.severity)}`}>
                            {defect.severity}
                          </span>
                        </div>

                        {/* Title/Description */}
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-normal line-clamp-2">
                          {defect.description}
                        </p>

                        <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/50 text-[10px] text-slate-400 dark:text-slate-500 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-brand-600 dark:text-brand-400 truncate max-w-[130px]">
                              {defect.assetName}
                            </span>
                            <span className="font-bold flex items-center">
                              <Calendar size={10} className="mr-1" />
                              {new Date(defect.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          <div className="flex items-center text-slate-550 dark:text-slate-400">
                            <User size={10} className="mr-1 shrink-0" />
                            <span className="truncate">{defect.assignedContractor}</span>
                          </div>
                        </div>

                        {/* Action buttons inside card */}
                        <div className="pt-1.5 flex justify-end space-x-1.5">
                          {getPrevStatus(defect.status) && isTransitionAllowed(defect.status, getPrevStatus(defect.status)!) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const prev = getPrevStatus(defect.status);
                                if (prev) updateDefectStatus(defect.id, prev);
                              }}
                              className="px-2 py-1 text-[9px] font-extrabold rounded bg-slate-100 dark:bg-slate-700 text-slate-655 dark:text-slate-300 hover:bg-slate-200"
                            >
                              ← Back
                            </button>
                          )}
                          {getNextStatus(defect.status) && isTransitionAllowed(defect.status, getNextStatus(defect.status)!) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const next = getNextStatus(defect.status);
                                if (next) updateDefectStatus(defect.id, next);
                              }}
                              className="px-2 py-1 text-[9px] font-extrabold rounded bg-brand-50/80 dark:bg-brand-950/40 text-brand-655 dark:text-brand-400 border border-brand-200 dark:border-brand-900/30 hover:bg-brand-100"
                            >
                              Next →
                            </button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // ==========================================
          // LIST EXPLAINED LAYOUT
          // ==========================================
          <div className="h-full overflow-y-auto bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border rounded-xl">
            <table className="w-full text-left text-xs font-semibold">
              <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-450 border-b border-slate-200 dark:border-darkbg-border">
                <tr>
                  <th className="p-4 font-bold uppercase tracking-wider w-24">DEFECT ID</th>
                  <th className="p-4 font-bold uppercase tracking-wider">ASSET LOGGED</th>
                  <th className="p-4 font-bold uppercase tracking-wider">DESCRIPTION</th>
                  <th className="p-4 font-bold uppercase tracking-wider w-28">SEVERITY</th>
                  <th className="p-4 font-bold uppercase tracking-wider w-36">CONTRACTOR</th>
                  <th className="p-4 font-bold uppercase tracking-wider w-28">DUE DATE</th>
                  <th className="p-4 font-bold uppercase tracking-wider w-28">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredDefects.map((defect) => (
                  <tr 
                    key={defect.id} 
                    onClick={() => setSelectedDefectId(defect.id)}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition cursor-pointer"
                  >
                    <td className="p-4 font-bold text-slate-500">{defect.id}</td>
                    <td className="p-4 font-extrabold text-brand-600 dark:text-brand-400">{defect.assetName}</td>
                    <td className="p-4 truncate max-w-[200px]">{defect.description}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${getSeverityColor(defect.severity)}`}>
                        {defect.severity}
                      </span>
                    </td>
                    <td className="p-4 text-xs font-medium">{defect.assignedContractor}</td>
                    <td className="p-4 font-bold">{new Date(defect.dueDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                        defect.status === 'Closed' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700' :
                        defect.status === 'Verified' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-500 border-emerald-200 dark:border-emerald-900' :
                        defect.status === 'Rectified' ? 'bg-cyan-50 dark:bg-cyan-950 text-cyan-500 border-cyan-200 dark:border-cyan-900' :
                        'bg-rose-50 dark:bg-rose-950 text-rose-500 border-rose-200 dark:border-rose-900'
                      }`}>
                        {defect.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Slide-out Surveillance Detail Drawer */}
      <AnimatePresence>
        {selectedDefectId && activeDefect && (
          <>
            {/* Overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDefectId(null)}
              className="fixed inset-0 bg-slate-900 z-40"
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-850 shadow-2xl z-50 flex flex-col h-full glass-panel"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Surveillance Drawer • {activeDefect.id}</span>
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getSeverityColor(activeDefect.severity)}`}>
                      {activeDefect.severity}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-850 dark:text-white uppercase tracking-wider">{activeDefect.assetName}</h3>
                </div>
                <button 
                  onClick={() => setSelectedDefectId(null)}
                  className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Defect Description</h4>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border border-slate-150 dark:border-slate-800">
                    {activeDefect.description}
                  </p>
                </div>

                {/* Status Progress Stepper */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Surveillance Stage Progress</h4>
                  
                  <div className="grid grid-cols-6 gap-1 text-[9px] text-center font-bold">
                    {columns.map((col, idx) => {
                      const isActive = activeDefect.status === col;
                      const isPast = columns.indexOf(activeDefect.status) >= idx;
                      return (
                        <div key={col} className="space-y-1">
                          <div className={`h-1.5 rounded-full transition-all duration-300 ${
                            isActive ? 'bg-brand-500 shadow shadow-brand-500/30' : isPast ? 'bg-brand-400' : 'bg-slate-100 dark:bg-slate-800'
                          }`} />
                          <span className={`${isActive ? 'text-brand-600 dark:text-brand-400 font-extrabold' : 'text-slate-400 font-medium'}`}>
                            {col}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Move options button */}
                  <div className="pt-2 flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      {getPrevStatus(activeDefect.status) && isTransitionAllowed(activeDefect.status, getPrevStatus(activeDefect.status)!) && (
                        <button
                          onClick={() => updateDefectStatus(activeDefect.id, getPrevStatus(activeDefect.status)!)}
                          className="flex-1 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-655 dark:text-slate-300 text-xs font-bold rounded-xl transition"
                        >
                          ← Move to {getPrevStatus(activeDefect.status)}
                        </button>
                      )}
                      {getNextStatus(activeDefect.status) && isTransitionAllowed(activeDefect.status, getNextStatus(activeDefect.status)!) && (
                        <button
                          onClick={() => updateDefectStatus(activeDefect.id, getNextStatus(activeDefect.status)!)}
                          className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow transition"
                        >
                          Advance to {getNextStatus(activeDefect.status)} →
                        </button>
                      )}
                    </div>

                    {!isTransitionAllowed(activeDefect.status, getNextStatus(activeDefect.status) || 'Closed') && 
                     !isTransitionAllowed(activeDefect.status, getPrevStatus(activeDefect.status) || 'Open') && (
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-150 dark:border-slate-800 text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider text-center">
                        🔒 Only {
                          activeDefect.status === 'Open' || activeDefect.status === 'Rectified' ? 'Site Engineers' :
                          activeDefect.status === 'Assigned' || activeDefect.status === 'In Progress' ? 'Contractors' :
                          activeDefect.status === 'Verified' ? 'Project Managers' :
                          'System Administrators'
                        } can transition this defect from "{activeDefect.status}" status.
                      </div>
                    )}
                  </div>
                        {/* Attachments Section */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Surveillance Media Attachments ({activeDefect.attachments.length})</h4>
                  
                  {activeDefect.attachments.length > 0 && (
                    <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-900/20">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-slate-150 dark:border-slate-800 text-[9px] uppercase tracking-wider text-slate-400 font-extrabold bg-slate-100/50 dark:bg-slate-900/50">
                            <th className="p-2.5">File / Image</th>
                            <th className="p-2.5">Actions</th>
                            <th className="p-2.5">Image Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-800 text-[11px]">
                          {activeDefect.attachments.map((fileStr, idx) => {
                            const parts = fileStr.split('|');
                            const name = parts[0];
                            const url = parts[1] || `https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=600&auto=format&fit=crop&q=60`;
                            
                            return (
                              <tr key={idx} className="hover:bg-slate-100/10 dark:hover:bg-slate-950/10">
                                <td className="p-2.5 font-semibold text-slate-700 dark:text-slate-350 max-w-[120px] truncate">
                                  <div className="flex items-center space-x-2">
                                    <img src={url} alt={name} className="w-8 h-8 object-cover rounded-lg border border-slate-100 dark:border-slate-800 shrink-0" />
                                    <span className="truncate">{name}</span>
                                  </div>
                                </td>
                                <td className="p-2.5">
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => window.open(url, '_blank')}
                                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[9px] font-extrabold transition cursor-pointer"
                                    >
                                      Access
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setLightboxUrl(url)}
                                      className="px-2 py-1 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 rounded-lg text-[9px] font-extrabold transition cursor-pointer"
                                    >
                                      Open
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => deleteAttachment(activeDefect.id, fileStr)}
                                      className="p-1 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </td>
                                <td className="p-2.5">
                                  <input
                                    type="text"
                                    placeholder="Write remark on image..."
                                    value={imageComments[name] || ""}
                                    onChange={(e) => handleImageCommentChange(name, e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:border-brand-500 rounded-lg px-2 py-1 text-[10px] dark:text-white"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Real File Upload Input Button */}
                  <div className="flex flex-col space-y-2">
                    <label className="flex items-center justify-center space-x-2 px-4 py-3 border border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-400 rounded-xl cursor-pointer bg-slate-50/50 dark:bg-slate-900/30 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                      <Paperclip size={14} className="text-slate-400" />
                      <span className="text-[11px] font-extrabold text-slate-650 dark:text-slate-300">Upload Image / File</span>
                      <input 
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            Array.from(e.target.files).forEach(file => {
                              const fileUrl = URL.createObjectURL(file);
                              addAttachment(activeDefect.id, `${file.name}|${fileUrl}`);
                            });
                          }
                          e.target.value = '';
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>          </div>

                {/* Comments Thread */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Surveillance Comments & Audit Logs</h4>
                  
                  <div className="space-y-4 max-h-56 overflow-y-auto pr-1">
                    {activeDefect.comments.length === 0 ? (
                      <p className="text-[11px] text-slate-400 dark:text-slate-550 italic text-center py-4">No comments registered yet. Add notes below.</p>
                    ) : (
                      activeDefect.comments.map((comment) => (
                        <div key={comment.id} className="p-3.5 bg-slate-50 dark:bg-slate-900/35 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-slate-850 dark:text-slate-200">{comment.user} ({comment.role})</span>
                            <span className="text-slate-400 dark:text-slate-500">
                              {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-655 dark:text-slate-350 leading-relaxed">
                            {comment.text}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Comment Input */}
                  <form onSubmit={handlePostComment} className="flex space-x-2 pt-2">
                    <input
                      type="text"
                      placeholder="Write surveillance updates/notes..."
                      required
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 pl-3 pr-2 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-slate-50 dark:bg-slate-950 focus:outline-none dark:text-white"
                    />
                    <button
                      type="submit"
                      className="p-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl transition flex items-center justify-center shadow"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Defect Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 glass-panel"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <h3 className="text-md font-extrabold text-slate-850 dark:text-white uppercase tracking-wider flex items-center">
                  <PlusCircle size={18} className="mr-2 text-rose-500" />
                  <span>Log Defect Punch List</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-650"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleRaiseDefect} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">SELECT INFRASTRUCTURE ASSET</label>
                  <select
                    value={newAssetId}
                    onChange={(e) => setNewAssetId(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name} ({a.contractor})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">DEFECT / DEFICIENCY DESCRIPTION</label>
                  <textarea
                    required
                    rows={3}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide specific details of the defect, cracked coordinates, operational malfunction..."
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">DEFECT SEVERITY LEVEL</label>
                    <select
                      value={newSeverity}
                      onChange={(e) => setNewSeverity(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    >
                      <option value="Critical">Critical</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">RECTIFICATION DUE DATE</label>
                    <input
                      type="date"
                      required
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-650 dark:text-slate-350 font-bold transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold shadow-lg shadow-rose-500/10 transition text-xs"
                  >
                    Log Defect
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Lightbox full-size Image Preview Modal */}
      <AnimatePresence>
        {lightboxUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-5 right-5 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="absolute inset-0 -z-10" onClick={() => setLightboxUrl(null)} />
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="max-w-full max-h-full flex items-center justify-center"
            >
              <img
                src={lightboxUrl}
                alt="Preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg border border-slate-800 shadow-2xl"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
