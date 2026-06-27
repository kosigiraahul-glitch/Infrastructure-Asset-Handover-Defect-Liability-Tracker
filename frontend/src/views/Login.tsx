import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { UserSession, RegisteredUser } from '../context/TrackerContext';
import { 
  HardHat, 
  Lock, 
  User, 
  ChevronRight, 
  Eye, 
  EyeOff, 
  UserPlus, 
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const { setIsAuthenticated, setCurrentUser, registeredUsers, registerUser, logSessionEvent } = useTracker();
  
  // Login form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Register screen toggle
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Register form states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regRole, setRegRole] = useState<UserSession['role']>('Engineer');
  const [regCompany, setRegCompany] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState('');



  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }

    // Lookup user in registeredUsers
    const userMatch = registeredUsers.find(
      u => u.username.toLowerCase() === username.toLowerCase()
    );

    if (!userMatch) {
      setError('Username not registered. Please sign up below or verify your credentials.');
      return;
    }

    // Validate password (simple check)
    if (userMatch.password && userMatch.password !== password) {
      setError('Invalid password. Please try again.');
      return;
    }

    const session = {
      name: userMatch.name,
      role: userMatch.role,
      contractorCompany: userMatch.contractorCompany
    };
    setCurrentUser(session);
    logSessionEvent(session, 'Login');
    setIsAuthenticated(true);
  };



  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regUsername || !regPassword) {
      setRegError('Please fill in all required fields.');
      return;
    }

    // Check username duplicates
    const exists = registeredUsers.some(u => u.username.toLowerCase() === regUsername.toLowerCase());
    if (exists) {
      setRegError('Username already taken.');
      return;
    }

    // Register user in global context
    const newUser: RegisteredUser = {
      name: regName,
      username: regUsername,
      role: regRole,
      password: regPassword,
      contractorCompany: regRole === 'Contractor' ? regCompany || 'General Vendor' : undefined
    };

    registerUser(newUser);

    // Swap back to login and populate username
    setUsername(regUsername);
    setPassword(regPassword);
    setIsRegisterMode(false);
    setError('');

    // Clear register fields
    setRegName('');
    setRegUsername('');
    setRegPassword('');
    setRegCompany('');
    setRegError('');
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center p-6 bg-slate-900 text-white relative overflow-hidden select-none">
      {/* Decorative gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!isRegisterMode ? (
          // ==========================================
          // LOGIN PORTAL VIEW
          // ==========================================
          <motion.div 
            key="login-view"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            className="w-full max-w-lg bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-7 relative"
          >
            {/* Header info */}
            <div className="text-center space-y-3">
              <div className="mx-auto bg-gradient-to-tr from-brand-600 to-indigo-650 p-4 rounded-2xl text-white shadow-xl shadow-brand-500/15 w-fit">
                <HardHat size={30} className="animate-float" />
              </div>
              <div>
                <h1 className="text-md font-black tracking-widest uppercase">AVINASH KANAPARTHI</h1>
                <p className="text-[10px] font-bold tracking-widest text-brand-400 uppercase mt-0.5">INFRASTRUCTURE PRIVATE LIMITED</p>
              </div>
              <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-brand-600 to-transparent mx-auto" />
            </div>

            <form onSubmit={handleLogin} className="space-y-4 text-xs font-semibold">
              {error && (
                <div className="p-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-[11px] font-bold">
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-slate-400 uppercase tracking-wider">Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-700/60 bg-slate-900/40 rounded-xl focus:border-brand-500 focus:outline-none text-white text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-400 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 text-slate-500" size={14} />
                  
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="e.g. adminpassword"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-slate-700/60 bg-slate-900/40 rounded-xl focus:border-brand-500 focus:outline-none text-white text-xs font-medium"
                  />

                  {/* Show / Hide Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 z-10 cursor-pointer text-slate-455 hover:text-slate-200 transition"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 transition duration-300 flex items-center justify-center space-x-1.5"
              >
                <span>Log In to central registry</span>
                <ChevronRight size={14} />
              </button>
            </form>



            {/* Register redirection */}
            <div className="text-center pt-2">
              <button 
                onClick={() => setIsRegisterMode(true)}
                className="text-[10px] text-brand-400 hover:text-brand-300 hover:underline font-bold uppercase tracking-wider flex items-center justify-center mx-auto space-x-1"
              >
                <UserPlus size={12} />
                <span>Create custom node credentials</span>
              </button>
            </div>
          </motion.div>
        ) : (
          // ==========================================
          // REGISTRATION PORTAL VIEW
          // ==========================================
          <motion.div 
            key="register-view"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="w-full max-w-lg bg-slate-800/40 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6"
          >
            {/* Header info */}
            <div className="flex items-center space-x-3 border-b border-slate-700/50 pb-4 shrink-0">
              <button
                onClick={() => setIsRegisterMode(false)}
                className="p-2 border border-slate-700 bg-slate-900/50 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <ArrowLeft size={14} />
              </button>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">CREDENTIAL GENERATION</span>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 flex items-center">
                  <UserPlus size={16} className="mr-1.5 text-brand-400" />
                  <span>Register Node Account</span>
                </h3>
              </div>
            </div>

            <form onSubmit={handleRegister} className="space-y-4 text-xs font-semibold">
              {regError && (
                <div className="p-3 rounded-xl border border-red-500/25 bg-red-500/10 text-red-400 text-[11px] font-bold">
                  {regError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-450 uppercase tracking-wider mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full p-2.5 border border-slate-700/60 bg-slate-900/40 rounded-xl focus:border-brand-500 focus:outline-none text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-450 uppercase tracking-wider mb-1">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. john.doe"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value.replace(/\s+/g, '').toLowerCase())}
                    className="w-full p-2.5 border border-slate-700/60 bg-slate-900/40 rounded-xl focus:border-brand-500 focus:outline-none text-white text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-450 uppercase tracking-wider mb-1">Surveillance Role</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-700/60 bg-slate-900/45 rounded-xl focus:border-brand-500 focus:outline-none text-white text-xs font-semibold"
                  >
                    <option value="Engineer">QA/QC Engineer</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Contractor">Contractor Partner</option>
                    <option value="Admin">System Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-455 uppercase tracking-wider mb-1">Password</label>
                  <div className="relative">
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      placeholder="e.g. password123"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-3 pr-10 py-2.5 border border-slate-700/60 bg-slate-900/40 rounded-xl focus:border-brand-500 focus:outline-none text-white text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 top-3 z-10 cursor-pointer text-slate-455 hover:text-slate-200 transition"
                    >
                      {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {regRole === 'Contractor' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1"
                >
                  <label className="block text-slate-450 uppercase tracking-wider mb-1">Contractor Vendor Company</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 text-slate-500" size={14} />
                    <input
                      type="text"
                      placeholder="e.g. L&T Construction"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-slate-700/60 bg-slate-900/40 rounded-xl focus:border-brand-500 focus:outline-none text-white text-xs"
                    />
                  </div>
                </motion.div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-brand-500/10 transition duration-300 flex items-center justify-center space-x-1"
              >
                <span>Generate Credentials</span>
                <ChevronRight size={14} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
