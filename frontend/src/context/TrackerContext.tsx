import React, { createContext, useContext, useState, useEffect } from 'react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export type ViewType = 'dashboard' | 'assets' | 'asset-details' | 'defects' | 'dlp' | 'reports' | 'certifications' | 'audit-trails';

export interface Project {
  id: string;
  name: string;
  client: string;
  location: string;
}

export interface Comment {
  id: string;
  user: string;
  role: string;
  text: string;
  timestamp: string;
}

export interface DefectActivity {
  id: string;
  text: string;
  user: string;
  timestamp: string;
}

export interface Defect {
  id: string;
  assetId: string;
  assetName: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  assignedContractor: string;
  dueDate: string;
  status: 'Open' | 'Assigned' | 'In Progress' | 'Rectified' | 'Verified' | 'Closed';
  attachments: string[];
  comments: Comment[];
  activity: DefectActivity[];
}

export interface Asset {
  id: string;
  name: string;
  projectName: string;
  location: string;
  contractor: string;
  dlpStartDate: string; // ISO
  dlpEndDate: string; // ISO
  budget: number;
  status: 'DLP Active' | 'DLP Completed' | 'Handed Over';
  progress: number; // DLP time elapsed %
  healthScore: number; // calculated 0-100
  images: string[];
  imageUrl?: string;
  image_url?: string;
}

export interface AuditLog {
  id: string;
  assetId?: string;
  assetName?: string;
  defectId?: string;
  user: string;
  role: string;
  action: string;
  prevValue?: string;
  newValue?: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  timestamp: string;
  read: boolean;
}

export interface UserSession {
  name: string;
  role: 'Engineer' | 'Project Manager' | 'Contractor' | 'Admin';
  contractorCompany?: string;
}

export interface RegisteredUser {
  name: string;
  role: 'Engineer' | 'Project Manager' | 'Contractor' | 'Admin';
  username: string;
  password?: string;
  contractorCompany?: string;
}

interface TrackerContextProps {
  // Navigation & User Session
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  selectedAssetId: string | null;
  setSelectedAssetId: (id: string | null) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: UserSession;
  setCurrentUser: (user: UserSession) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (val: boolean) => void;

  // Data State
  assets: Asset[];
  defects: Defect[];
  auditLogs: AuditLog[];
  notifications: Notification[];

  // Mutators
  addAsset: (asset: Omit<Asset, 'id' | 'progress' | 'healthScore' | 'status'>) => void;
  editAsset: (id: string, updated: Partial<Asset>) => void;
  addDefect: (defect: Omit<Defect, 'id' | 'status' | 'comments' | 'activity' | 'attachments'> & { attachments?: string[] }) => void;
  updateDefectStatus: (id: string, status: Defect['status']) => void;
  addComment: (defectId: string, text: string) => void;
  addAttachment: (defectId: string, fileName: string) => void;
  deleteAttachment: (defectId: string, fileName: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  generateCertificate: (assetId: string) => void;

  registeredUsers: RegisteredUser[];
  registerUser: (user: RegisteredUser) => void;
  logSessionEvent: (user: UserSession, event: 'Login' | 'Logout') => void;
  projects: Project[];
  addProject: (prj: Omit<Project, 'id'>) => void;

  // Helper selectors
  getAssetDefects: (assetId: string) => Defect[];
  getAssetAuditLogs: (assetId: string) => AuditLog[];
}

const TrackerContext = createContext<TrackerContextProps | undefined>(undefined);

// Keep image helper in the frontend for mapping asset names to standard visual defaults
export const getAssetImageByName = (name: string): string => {
  const n = name.toLowerCase();
  
  if (n.includes('highrise') || n.includes('building') || n.includes('admin') || n.includes('block') || n.includes('office') || n.includes('tower')) {
    return '/uploads/default-highrise.jpg';
  }
  if (n.includes('bridge') || n.includes('river') || n.includes('flyover') || n.includes('overpass') || n.includes('viaduct') || n.includes('span')) {
    return '/uploads/default-bridge.jpg';
  }
  if (n.includes('piping') || n.includes('cooling') || n.includes('pipe') || n.includes('utility') || n.includes('pipeline') || n.includes('hvac')) {
    return '/uploads/default-piping.jpg';
  }
  if (n.includes('water') || n.includes('treatment') || n.includes('filtration') || n.includes('mld') || n.includes('sewage') || n.includes('pump') || n.includes('sewer')) {
    return '/uploads/default-water.jpg';
  }
  if (n.includes('highway') || n.includes('road') || n.includes('stretch') || n.includes('carriageway') || n.includes('asphalt') || n.includes('expressway') || n.includes('km')) {
    return '/uploads/default-highway.jpg';
  }
  if (n.includes('runway') || n.includes('airport') || n.includes('taxiway') || n.includes('terminal')) {
    return '/uploads/default-runway.jpg';
  }
  if (n.includes('metro') || n.includes('rail') || n.includes('transit') || n.includes('tunnel')) {
    return '/uploads/default-metro.jpg';
  }
  
  return '/uploads/default-fallback.jpg';
};

// ==========================================
// PROVIDER IMPLEMENTATION
// ==========================================

export const TrackerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & User Session
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('avinash_dark_mode');
    return saved ? JSON.parse(saved) : true;
  });

  const [currentUser, setCurrentUser] = useState<UserSession>(() => {
    const saved = localStorage.getItem('avinash_current_user');
    return saved ? JSON.parse(saved) : { name: 'Vikram Rao', role: 'Engineer' };
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('avinash_authenticated') === 'true';
  });

  // Backend Synchronized States
  const [assets, setAssets] = useState<Asset[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  // Function to pull latest state from database
  const refreshData = async () => {
    try {
      const [assetsRes, defectsRes, auditLogsRes, notificationsRes, projectsRes, usersRes] = await Promise.all([
        fetch('/api/assets').then(r => r.json()),
        fetch('/api/defects').then(r => r.json()),
        fetch('/api/audit-logs').then(r => r.json()),
        fetch('/api/notifications').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);
      setAssets(assetsRes);
      setDefects(defectsRes);
      setAuditLogs(auditLogsRes);
      setNotifications(notificationsRes);
      setProjects(projectsRes);
      setRegisteredUsers(usersRes);
    } catch (error) {
      console.error('Error fetching data from Express API:', error);
    }
  };

  // On mount, load data
  useEffect(() => {
    refreshData();
  }, []);

  // Sync session authentication to localStorage
  useEffect(() => {
    localStorage.setItem('avinash_authenticated', String(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('avinash_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('avinash_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // ==========================================
  // API MUTATORS
  // ==========================================

  const addProject = async (newPrj: Omit<Project, 'id'>) => {
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newPrj, user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to add project', e);
    }
  };

  const registerUser = async (newUser: RegisteredUser) => {
    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to register user', e);
    }
  };

  const logSessionEvent = async (user: UserSession, event: 'Login' | 'Logout') => {
    try {
      const res = await fetch('/api/users/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, event })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to record session event', e);
    }
  };

  const addAsset = async (newAsset: Omit<Asset, 'id' | 'progress' | 'healthScore' | 'status'>) => {
    try {
      const res = await fetch('/api/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newAsset, user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to add asset', e);
    }
  };

  const editAsset = async (id: string, updated: Partial<Asset>) => {
    try {
      const res = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updated, user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to edit asset', e);
    }
  };

  const addDefect = async (newDefect: Omit<Defect, 'id' | 'status' | 'comments' | 'activity' | 'attachments'> & { attachments?: string[] }) => {
    try {
      const res = await fetch('/api/defects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newDefect, user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to log defect', e);
    }
  };

  const updateDefectStatus = async (id: string, status: Defect['status']) => {
    try {
      const res = await fetch(`/api/defects/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to update defect status', e);
    }
  };

  const addComment = async (defectId: string, text: string) => {
    try {
      const res = await fetch(`/api/defects/${defectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to add comment', e);
    }
  };

  const addAttachment = async (defectId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/defects/${defectId}/attachments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName, user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to add attachment', e);
    }
  };

  const deleteAttachment = async (defectId: string, fileName: string) => {
    try {
      const res = await fetch(`/api/defects/${defectId}/attachments/${fileName}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to delete attachment', e);
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    try {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification)
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to trigger manual notification', e);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT'
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to read notification', e);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'PUT'
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to read all notifications', e);
    }
  };

  const generateCertificate = async (assetId: string) => {
    try {
      const res = await fetch(`/api/assets/${assetId}/handover`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: currentUser })
      });
      if (res.ok) {
        await refreshData();
      }
    } catch (e) {
      console.error('Failed to approve handover certificate', e);
    }
  };

  // Helper selectors
  const getAssetDefects = (assetId: string) => defects.filter(d => d.assetId === assetId);
  const getAssetAuditLogs = (assetId: string) => auditLogs.filter(log => log.assetId === assetId);

  return (
    <TrackerContext.Provider value={{
      currentView,
      setCurrentView,
      selectedAssetId,
      setSelectedAssetId,
      darkMode,
      setDarkMode,
      currentUser,
      setCurrentUser,
      isAuthenticated,
      setIsAuthenticated,
      mobileSidebarOpen,
      setMobileSidebarOpen,
      assets,
      defects,
      auditLogs,
      notifications,
      addAsset,
      editAsset,
      addDefect,
      updateDefectStatus,
      addComment,
      addAttachment,
      deleteAttachment,
      addNotification,
      markNotificationRead,
      markAllNotificationsRead,
      generateCertificate,
      registeredUsers,
      registerUser,
      logSessionEvent,
      projects,
      addProject,
      getAssetDefects,
      getAssetAuditLogs
    }}>
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => {
  const context = useContext(TrackerContext);
  if (context === undefined) {
    throw new Error('useTracker must be used within a TrackerProvider');
  }
  return context;
};
