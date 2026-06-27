import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { AuditLog, RegisteredUser } from '../context/TrackerContext';
import { 
  Search, 
  Clock, 
  ShieldCheck, 
  UserCheck, 
  AlertTriangle,
  ArrowRight,
  Filter,
  UserPlus,
  PlusCircle,
  Building,
  MapPin,
  KeyRound,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AuditTrails: React.FC = () => {
  const { auditLogs, currentUser, registeredUsers, registerUser, projects, addProject } = useTracker();
  
  const [activeTab, setActiveTab] = useState<'logs' | 'logins' | 'creation'>('logs');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'defects' | 'assets'>('all');

  // Creation form states
  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userRole, setUserRole] = useState<'Engineer' | 'Project Manager' | 'Contractor' | 'Admin'>('Engineer');
  const [userCompany, setUserCompany] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [userSuccess, setUserSuccess] = useState('');

  const [projectName, setProjectName] = useState('');
  const [projectClient, setProjectClient] = useState('');
  const [projectLocation, setProjectLocation] = useState('');
  const [projectSuccess, setProjectSuccess] = useState('');

  // Strict Admin Authorization check
  if (currentUser.role !== 'Admin') {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 text-center max-w-md space-y-3">
          <AlertTriangle className="mx-auto text-rose-500" size={32} />
          <h3 className="text-sm font-extrabold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Access Restricted</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold leading-relaxed">
            SURVEILLANCE ERROR: Only authenticated system administrators are authorized to access central log records.
          </p>
        </div>
      </div>
    );
  }

  // Filter logs for Tab 1 (Audit Logs)
  const filteredLogs = auditLogs.filter(log => {
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
                        log.action.toLowerCase().includes(search.toLowerCase()) ||
                        log.id.toLowerCase().includes(search.toLowerCase());

    const isSessionEvent = log.action.toLowerCase().includes('session');
    const isDefectEvent = log.defectId || log.action.toLowerCase().includes('defect') || log.action.toLowerCase().includes('comment');
    const isAssetEvent = !isSessionEvent && !isDefectEvent;

    // Filter out session events from general audit logs for clarity
    if (isSessionEvent) return false;

    if (categoryFilter === 'defects') return matchSearch && isDefectEvent;
    if (categoryFilter === 'assets') return matchSearch && isAssetEvent;

    return matchSearch;
  });

  // Filter logs for Tab 2 (Login History)
  const loginLogs = auditLogs.filter(log => {
    const isSessionEvent = log.action.toLowerCase().includes('session');
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
                        log.action.toLowerCase().includes(search.toLowerCase());
    return isSessionEvent && matchSearch;
  });

  // Handlers for Admin creations
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userUsername || !userPassword) return;

    const exists = registeredUsers.some(u => u.username.toLowerCase() === userUsername.toLowerCase());
    if (exists) {
      setUserSuccess('ERROR: Username already taken.');
      return;
    }

    const newUser: RegisteredUser = {
      name: userName,
      username: userUsername,
      role: userRole,
      password: userPassword,
      contractorCompany: userRole === 'Contractor' ? userCompany || 'General Vendor' : undefined
    };

    registerUser(newUser);
    setUserSuccess(`SUCCESS: Registered User ${userName} (${userRole})`);

    // Reset Form
    setUserName('');
    setUserUsername('');
    setUserPassword('');
    setUserCompany('');
    setTimeout(() => setUserSuccess(''), 4000);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName || !projectClient || !projectLocation) return;

    addProject({
      name: projectName,
      client: projectClient,
      location: projectLocation
    });

    setProjectSuccess(`SUCCESS: Project "${projectName}" registered!`);

    // Reset Form
    setProjectName('');
    setProjectClient('');
    setProjectLocation('');
    setTimeout(() => setProjectSuccess(''), 4000);
  };

  const getLogBadge = (log: AuditLog) => {
    const actionLower = log.action.toLowerCase();
    
    if (actionLower.includes('login')) {
      return {
        text: 'Session Login',
        style: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
        icon: <UserCheck size={12} />
      };
    }
    if (actionLower.includes('logout')) {
      return {
        text: 'Session Logout',
        style: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
        icon: <Clock size={12} />
      };
    }
    if (actionLower.includes('defect') || actionLower.includes('comment')) {
      return {
        text: 'Defect Audit',
        style: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        icon: <AlertTriangle size={12} />
      };
    }
    return {
      text: 'Surveillance Audit',
      style: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
      icon: <ShieldCheck size={12} />
    };
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            QC System Audit Trails
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Central surveillance log records (Access level: System Administrator)
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-darkbg-border text-xs font-bold mt-4 sm:mt-0">
          <button
            onClick={() => { setActiveTab('logs'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'logs' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Transaction Logs
          </button>
          <button
            onClick={() => { setActiveTab('logins'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'logins' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            User Login History
          </button>
          <button
            onClick={() => { setActiveTab('creation'); setSearch(''); }}
            className={`px-3 py-1.5 rounded-lg transition ${
              activeTab === 'creation' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Users & Projects
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'logs' && (
          // ==========================================
          // VIEW TAB 1: TRANSACTION AUDIT LOGS
          // ==========================================
          <motion.div
            key="logs-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Filter Search */}
            <div className="p-4 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border flex flex-col md:flex-row gap-4 items-center">
              <div className="relative w-full md:flex-1">
                <Search className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Search audit transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-slate-50/50 dark:bg-slate-900/50 focus:border-brand-500 focus:outline-none dark:text-white"
                />
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 text-xs font-semibold">
                <Filter size={14} className="text-slate-400" />
                <span className="text-slate-400 uppercase tracking-wider">Type:</span>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                  {(['all', 'defects', 'assets'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase transition-all duration-200 ${
                        categoryFilter === cat 
                          ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-450 border-b border-slate-200 dark:border-darkbg-border">
                    <tr>
                      <th className="p-4 font-bold uppercase tracking-wider w-24">LOG ID</th>
                      <th className="p-4 font-bold uppercase tracking-wider w-40">USER / ROLE</th>
                      <th className="p-4 font-bold uppercase tracking-wider w-44">AUDIT EVENT</th>
                      <th className="p-4 font-bold uppercase tracking-wider">ACTION SUMMARY</th>
                      <th className="p-4 font-bold uppercase tracking-wider w-36 text-right">DATE & TIME</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          No audit transaction logs found.
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map((log) => {
                        const badge = getLogBadge(log);
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="p-4 font-bold text-slate-400">{log.id}</td>
                            <td className="p-4">
                              <p className="font-extrabold text-slate-850 dark:text-slate-100">{log.user}</p>
                              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{log.role}</p>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center space-x-1 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${badge.style}`}>
                                {badge.icon}
                                <span>{badge.text}</span>
                              </span>
                            </td>
                            <td className="p-4 leading-relaxed font-semibold">
                              {log.action}
                              {log.prevValue && log.newValue && (
                                <div className="mt-1.5 text-[10px] font-bold bg-slate-50 dark:bg-slate-900/40 p-1.5 rounded-lg inline-flex items-center space-x-1.5 border border-slate-150 dark:border-slate-800/30">
                                  <span className="text-rose-500 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.5 rounded border border-rose-500/5">{log.prevValue}</span>
                                  <ArrowRight size={10} className="text-slate-400" />
                                  <span className="text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.5 rounded border border-emerald-500/5">{log.newValue}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right font-medium text-slate-500 dark:text-slate-400">
                              <span className="block">{new Date(log.timestamp).toLocaleDateString()}</span>
                              <span className="block text-[10px] mt-0.5">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'logins' && (
          // ==========================================
          // VIEW TAB 2: USER LOGIN HISTORY
          // ==========================================
          <motion.div
            key="logins-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Search */}
            <div className="p-4 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border">
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search login events by user, role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-slate-50/50 dark:bg-slate-900/50 focus:border-brand-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            {/* Login history logs table */}
            <div className="bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-semibold">
                  <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-450 border-b border-slate-200 dark:border-darkbg-border">
                    <tr>
                      <th className="p-4 font-bold uppercase tracking-wider w-24">LOG ID</th>
                      <th className="p-4 font-bold uppercase tracking-wider">USER NAME</th>
                      <th className="p-4 font-bold uppercase tracking-wider w-40">WORKSPACE ROLE</th>
                      <th className="p-4 font-bold uppercase tracking-wider w-48">CONNECTION STATUS</th>
                      <th className="p-4 font-bold uppercase tracking-wider w-44 text-right">DATE & TIMESTAMP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-350">
                    {loginLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-400">
                          No login session histories recorded yet.
                        </td>
                      </tr>
                    ) : (
                      loginLogs.map((log) => {
                        const isLogin = log.action.toLowerCase().includes('login');
                        return (
                          <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                            <td className="p-4 font-bold text-slate-400">{log.id}</td>
                            <td className="p-4 font-bold text-slate-850 dark:text-slate-100">{log.user}</td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-655 dark:text-slate-300 font-bold uppercase tracking-wide text-[9px]">
                                {log.role}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center space-x-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                isLogin 
                                  ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              }`}>
                                <Clock size={10} className="mr-1" />
                                <span>{isLogin ? 'Authenticated Login' : 'Session Disconnected'}</span>
                              </span>
                            </td>
                            <td className="p-4 text-right font-medium text-slate-500 dark:text-slate-400">
                              <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                              <span className="ml-2">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'creation' && (
          // ==========================================
          // VIEW TAB 3: USER & PROJECT CREATION
          // ==========================================
          <motion.div
            key="creation-tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
          >
            {/* User creation card */}
            <div className="p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wide flex items-center">
                  <UserPlus size={18} className="mr-2 text-brand-600" />
                  <span>Register Custom User Session</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add new engineer, manager, or contractor credentials</p>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-semibold">
                {userSuccess && (
                  <div className={`p-3 rounded-xl border font-bold text-[11px] ${
                    userSuccess.startsWith('ERROR') 
                      ? 'border-red-500/20 bg-red-500/10 text-red-400' 
                      : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-450'
                  }`}>
                    {userSuccess}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Patel"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. rahul.qc"
                      value={userUsername}
                      onChange={(e) => setUserUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Surveillance Role</label>
                    <select
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value as any)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    >
                      <option value="Engineer">QA/QC Engineer</option>
                      <option value="Project Manager">Project Manager</option>
                      <option value="Contractor">Contractor Partner</option>
                      <option value="Admin">System Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Password</label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3.5 text-slate-400" size={14} />
                      <input
                        type={showUserPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUserPassword(!showUserPassword)}
                        className="absolute right-3.5 top-3.5 z-10 cursor-pointer text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition"
                      >
                        {showUserPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {userRole === 'Contractor' && (
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Contractor Company Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Afcons Infrastructure"
                      value={userCompany}
                      onChange={(e) => setUserCompany(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold transition flex items-center justify-center space-x-1 shadow-md"
                >
                  <PlusCircle size={14} />
                  <span>Register User Account</span>
                </button>
              </form>
            </div>

            {/* Project creation card */}
            <div className="p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm space-y-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-100 uppercase tracking-wide flex items-center">
                  <Building size={18} className="mr-2 text-indigo-500" />
                  <span>Register Project Registry</span>
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Add a new high-level infrastructure project</p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-4 text-xs font-semibold">
                {projectSuccess && (
                  <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold text-[11px]">
                    {projectSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 uppercase tracking-wider mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Outer Ring Road Phase 3"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Client Authority</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. HMDA"
                      value={projectClient}
                      onChange={(e) => setProjectClient(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Location City</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 text-slate-400" size={14} />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Hyderabad"
                        value={projectLocation}
                        onChange={(e) => setProjectLocation(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition flex items-center justify-center space-x-1 shadow-md"
                >
                  <PlusCircle size={14} />
                  <span>Register Project</span>
                </button>
              </form>

              {/* List of current projects */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest">Active Project Registry ({projects.length})</span>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-semibold text-slate-500 max-h-32 overflow-y-auto pr-1">
                  {projects.map((p: any) => (
                    <div key={p.id} className="p-2 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl flex items-center justify-between">
                      <span className="font-extrabold text-slate-700 dark:text-slate-350 truncate max-w-[120px]">{p.name}</span>
                      <span className="text-slate-400 font-bold shrink-0">{p.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
