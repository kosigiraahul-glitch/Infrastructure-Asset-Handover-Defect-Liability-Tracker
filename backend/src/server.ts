import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper to save base64 image if present
async function saveBase64Image(base64Str: string, assetId: string): Promise<string> {
  const matches = base64Str.match(/^data:image\/([a-zA-Z0-9\+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return base64Str;
  }
  
  const ext = matches[1].toLowerCase();
  const data = matches[2];
  
  // Format check
  const allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Only JPG, JPEG, PNG, and WEBP images are allowed.');
  }

  // Size check
  const buffer = Buffer.from(data, 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Image file size must be less than 5 MB.');
  }

  const uploadDir = path.join(__dirname, '../../frontend/public/uploads');
  await fs.mkdir(uploadDir, { recursive: true });
  
  const fileName = `asset-${assetId}.${ext}`;
  const filePath = path.join(uploadDir, fileName);
  await fs.writeFile(filePath, buffer);
  
  return `/uploads/${fileName}`;
}

// ==========================================
// TYPES & INTERFACES
// ==========================================

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
  dlpStartDate: string;
  dlpEndDate: string;
  budget: number;
  status: 'DLP Active' | 'DLP Completed' | 'Handed Over';
  progress: number;
  healthScore: number;
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

export interface RegisteredUser {
  name: string;
  role: 'Engineer' | 'Project Manager' | 'Contractor' | 'Admin';
  username: string;
  password?: string;
  contractorCompany?: string;
}

// ==========================================
// SUPABASE DATABASE CLIENT & HELPERS
// ==========================================

const SUPABASE_URL = 'https://ogqdsndvigkgjkyienis.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ncWRzbmR2aWdrZ2preWllbmlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjM1NzYwOSwiZXhwIjoyMDk3OTMzNjA5fQ.Jgy4BkPDTKcBq_hHpZuhN5qU7pNAPQtf8Yz84pqPXCA';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function dbToUser(u: any): RegisteredUser {
  return {
    username: u.username,
    password: u.password,
    name: u.name,
    role: u.role,
    contractorCompany: u.contractor_company || undefined
  };
}

function dbToAsset(a: any): Asset {
  return {
    id: a.id,
    name: a.name,
    projectName: a.project_name,
    location: a.location,
    contractor: a.contractor,
    dlpStartDate: a.dlp_start_date,
    dlpEndDate: a.dlp_end_date,
    budget: Number(a.budget),
    status: a.status,
    progress: Number(a.progress),
    healthScore: Number(a.health_score),
    images: a.images || [],
    imageUrl: a.image_url || undefined,
    image_url: a.image_url || undefined
  };
}

function dbToDefect(d: any): Defect {
  return {
    id: d.id,
    assetId: d.asset_id,
    assetName: d.asset_name,
    description: d.description,
    severity: d.severity,
    assignedContractor: d.assigned_contractor,
    dueDate: d.due_date,
    status: d.status,
    attachments: d.attachments || [],
    comments: d.comments || [],
    activity: d.activity || []
  };
}

function dbToNotif(n: any): Notification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    timestamp: n.timestamp,
    read: n.read
  };
}

function dbToAudit(l: any): AuditLog {
  return {
    id: l.id,
    assetId: l.asset_id || undefined,
    assetName: l.asset_name || undefined,
    defectId: l.defect_id || undefined,
    user: l.user,
    role: l.role,
    action: l.action,
    prevValue: l.prev_value || undefined,
    newValue: l.new_value || undefined,
    timestamp: l.timestamp
  };
}

// --- PROJECTS ---
async function getProjects(): Promise<Project[]> {
  const { data, error } = await supabase.from('projects').select('*').order('id', { ascending: true });
  if (error) throw error;
  return data as Project[];
}

async function insertProject(p: Project): Promise<void> {
  const { error } = await supabase.from('projects').insert(p);
  if (error) throw error;
}

// --- USERS ---
async function getUsers(): Promise<RegisteredUser[]> {
  const { data, error } = await supabase.from('users').select('*').order('username', { ascending: true });
  if (error) throw error;
  return (data || []).map(dbToUser);
}

async function insertUser(u: RegisteredUser): Promise<void> {
  const { error } = await supabase.from('users').insert({
    username: u.username,
    password: u.password,
    name: u.name,
    role: u.role,
    contractor_company: u.contractorCompany || null
  });
  if (error) throw error;
}

// --- ASSETS ---
async function getAssets(): Promise<Asset[]> {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) throw error;
  return (data || []).map(dbToAsset);
}

async function insertAsset(a: Asset): Promise<void> {
  const { error } = await supabase.from('assets').insert({
    id: a.id,
    name: a.name,
    project_name: a.projectName,
    location: a.location,
    contractor: a.contractor,
    dlp_start_date: a.dlpStartDate,
    dlp_end_date: a.dlpEndDate,
    budget: a.budget,
    status: a.status,
    progress: a.progress,
    health_score: a.healthScore,
    images: a.images,
    image_url: a.imageUrl || a.image_url || null
  });
  if (error) throw error;
}

async function updateAsset(id: string, updated: Partial<Asset>): Promise<Asset> {
  const dbFields: any = {};
  if (updated.name !== undefined) dbFields.name = updated.name;
  if (updated.projectName !== undefined) dbFields.project_name = updated.projectName;
  if (updated.location !== undefined) dbFields.location = updated.location;
  if (updated.contractor !== undefined) dbFields.contractor = updated.contractor;
  if (updated.dlpStartDate !== undefined) dbFields.dlp_start_date = updated.dlpStartDate;
  if (updated.dlpEndDate !== undefined) dbFields.dlp_end_date = updated.dlpEndDate;
  if (updated.budget !== undefined) dbFields.budget = updated.budget;
  if (updated.status !== undefined) dbFields.status = updated.status;
  if (updated.progress !== undefined) dbFields.progress = updated.progress;
  if (updated.healthScore !== undefined) dbFields.health_score = updated.healthScore;
  if (updated.images !== undefined) dbFields.images = updated.images;
  if (updated.imageUrl !== undefined || updated.image_url !== undefined) {
    dbFields.image_url = updated.imageUrl || updated.image_url || null;
  }

  const { data, error } = await supabase
    .from('assets')
    .update(dbFields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dbToAsset(data);
}

// --- DEFECTS ---
async function getDefects(): Promise<Defect[]> {
  const { data, error } = await supabase.from('defects').select('*').order('id', { ascending: false });
  if (error) throw error;
  return (data || []).map(dbToDefect);
}

async function insertDefect(d: Defect): Promise<void> {
  const { error } = await supabase.from('defects').insert({
    id: d.id,
    asset_id: d.assetId,
    asset_name: d.assetName,
    description: d.description,
    severity: d.severity,
    assigned_contractor: d.assignedContractor,
    due_date: d.dueDate,
    status: d.status,
    attachments: d.attachments,
    comments: d.comments,
    activity: d.activity
  });
  if (error) throw error;
}

async function updateDefect(id: string, fields: Partial<Defect>): Promise<Defect> {
  const dbFields: any = {};
  if (fields.status !== undefined) dbFields.status = fields.status;
  if (fields.comments !== undefined) dbFields.comments = fields.comments;
  if (fields.activity !== undefined) dbFields.activity = fields.activity;
  if (fields.attachments !== undefined) dbFields.attachments = fields.attachments;

  const { data, error } = await supabase
    .from('defects')
    .update(dbFields)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return dbToDefect(data);
}

// --- NOTIFICATIONS ---
async function getNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase.from('notifications').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return (data || []).map(dbToNotif);
}

async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
  if (error) throw error;
}

async function markAllNotificationsRead(): Promise<void> {
  const { error } = await supabase.from('notifications').update({ read: true }).neq('id', 'dummy_id');
  if (error) throw error;
}

// Helper to calculate progress & health score dynamically
function getCalculatedAssets(assets: Asset[], defects: Defect[]): Asset[] {
  const now = new Date('2026-06-17T11:35:00.000Z').getTime(); // Freeze time matching frontend logic
  return assets.map(asset => {
    // DLP Progress
    const start = new Date(asset.dlpStartDate).getTime();
    const end = new Date(asset.dlpEndDate).getTime();
    const total = end - start;
    const elapsed = now - start;
    let progress = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
    
    // Status override based on progress
    let status = asset.status;
    if (progress >= 100 && asset.status === 'DLP Active') {
      status = 'DLP Completed';
    }

    // Health Score based on open defects and severity
    const assetDefs = defects.filter(d => d.assetId === asset.id);
    const openDefs = assetDefs.filter(d => d.status !== 'Closed' && d.status !== 'Verified');
    
    let penalty = 0;
    openDefs.forEach(d => {
      if (d.severity === 'Critical') penalty += 25;
      else if (d.severity === 'High') penalty += 15;
      else if (d.severity === 'Medium') penalty += 8;
      else if (d.severity === 'Low') penalty += 3;
    });
    const healthScore = Math.max(0, Math.min(100, 100 - penalty));

    return {
      ...asset,
      progress,
      healthScore,
      status
    };
  });
}

// Helper to push a new audit log
async function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const { data } = await supabase.from('audit_logs').select('id');
  const count = data ? data.length : 0;
  const nextId = `L-${String(count + 1).padStart(3, '0')}`;
  
  const newLog = {
    id: nextId,
    asset_id: log.assetId || null,
    asset_name: log.assetName || null,
    defect_id: log.defectId || null,
    user: log.user,
    role: log.role,
    action: log.action,
    prev_value: log.prevValue || null,
    new_value: log.newValue || null,
    timestamp: new Date().toISOString()
  };

  const { error } = await supabase.from('audit_logs').insert(newLog);
  if (error) throw error;
  return dbToAudit(newLog);
}

// Helper to push a notification
async function addNotification(notif: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const { data } = await supabase.from('notifications').select('id');
  const count = data ? data.length : 0;
  const nextId = `N-${String(count + 1).padStart(3, '0')}`;

  const newNotif = {
    id: nextId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    timestamp: new Date().toISOString(),
    read: false
  };

  const { error } = await supabase.from('notifications').insert(newNotif);
  if (error) throw error;
  return dbToNotif(newNotif);
}

async function getAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase.from('audit_logs').select('*').order('timestamp', { ascending: false });
  if (error) throw error;
  return (data || []).map(dbToAudit);
}

// ==========================================
// API ENDPOINTS
// ==========================================

// --- PROJECTS ---
app.get('/api/projects', async (req, res) => {
  try {
    const data = await getProjects();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, client, location, user } = req.body;
    const projects = await getProjects();
    const id = `PRJ-${String(projects.length + 1).padStart(3, '0')}`;
    
    const newProject: Project = { id, name, client, location };
    await insertProject(newProject);

    // Side-effects
    await addAuditLog({
      user: user.name,
      role: user.role,
      action: `Created new project registry: ${name} (Client: ${client})`
    });

    await addNotification({
      title: 'Project Registered',
      message: `Project ${name} created successfully.`,
      type: 'success'
    });

    res.status(201).json(newProject);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- USERS ---
app.get('/api/users', async (req, res) => {
  try {
    const data = await getUsers();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/register', async (req, res) => {
  try {
    const newUser: RegisteredUser = req.body;
    await insertUser(newUser);

    // Side-effects
    await addAuditLog({
      user: newUser.name,
      role: newUser.role,
      action: `User registered account under node: ${newUser.username}`
    });

    await addNotification({
      title: 'New User Registered',
      message: `${newUser.name} registered as ${newUser.role}.`,
      type: 'info'
    });

    res.status(201).json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/session', async (req, res) => {
  try {
    const { user, event } = req.body; // event: 'Login' | 'Logout'
    
    await addAuditLog({
      user: user.name,
      role: user.role,
      action: `User session ${event.toLowerCase()} recorded`
    });

    await addNotification({
      title: `User ${event}`,
      message: `${user.name} (${user.role}) has ${event.toLowerCase()}ed.`,
      type: event === 'Login' ? 'success' : 'info'
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- ASSETS ---
app.get('/api/assets', async (req, res) => {
  try {
    const assets = await getAssets();
    const defects = await getDefects();
    const calculated = getCalculatedAssets(assets, defects);
    res.json(calculated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assets = await getAssets();
    const defects = await getDefects();
    const calculated = getCalculatedAssets(assets, defects);
    const asset = calculated.find(a => a.id === id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assets', async (req, res) => {
  try {
    const { name, projectName, location, contractor, dlpStartDate, dlpEndDate, budget, images, user, imageUrl, image_url } = req.body;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Asset Name is required' });
    }
    if (!contractor || contractor.trim() === '') {
      return res.status(400).json({ message: 'Contractor is required' });
    }

    const assets = await getAssets();
    const id = `AST-${String(assets.length + 1).padStart(3, '0')}`;

    // Handle image upload if present
    let savedImagePath = '';
    const incomingImg = imageUrl || image_url;
    if (incomingImg && incomingImg.startsWith('data:image/')) {
      try {
        savedImagePath = await saveBase64Image(incomingImg, id);
      } catch (err: any) {
        return res.status(400).json({ message: err.message });
      }
    }

    const newAsset: Asset = {
      id,
      name,
      projectName,
      location,
      contractor,
      dlpStartDate,
      dlpEndDate,
      budget: Number(budget),
      status: 'DLP Active',
      progress: 0,
      healthScore: 100,
      images: images || [],
      imageUrl: savedImagePath || undefined,
      image_url: savedImagePath || undefined
    };

    await insertAsset(newAsset);

    // Side-effects
    await addAuditLog({
      assetId: id,
      assetName: name,
      user: user.name,
      role: user.role,
      action: 'Asset Registered under DLP tracker'
    });

    await addNotification({
      title: 'New Asset Handover Registered',
      message: `Asset ${name} registered under DLP assigned to ${contractor}.`,
      type: 'success'
    });

    res.status(201).json(newAsset);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedFields: Partial<Asset> = { ...req.body.updated };
    const { user } = req.body;
    
    // Handle updated image upload if present
    const incomingImg = updatedFields.imageUrl || updatedFields.image_url;
    if (incomingImg && incomingImg.startsWith('data:image/')) {
      try {
        const savedImagePath = await saveBase64Image(incomingImg, id);
        updatedFields.imageUrl = savedImagePath;
        updatedFields.image_url = savedImagePath;
      } catch (err: any) {
        return res.status(400).json({ message: err.message });
      }
    }

    const result = await updateAsset(id, updatedFields);

    // Side-effects
    await addAuditLog({
      assetId: id,
      assetName: result.name,
      user: user.name,
      role: user.role,
      action: `Edited asset details: ${Object.keys(updatedFields).join(', ')}`
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assets/:id/handover', async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req.body;

    const assets = await getAssets();
    const asset = assets.find(a => a.id === id);

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    const prevStatus = asset.status;
    const result = await updateAsset(id, { status: 'Handed Over' });

    // Side-effects
    await addAuditLog({
      assetId: id,
      assetName: result.name,
      user: user.name,
      role: user.role,
      action: 'Handover Certificate Generated & Approved',
      prevValue: prevStatus,
      newValue: 'Handed Over'
    });

    await addNotification({
      title: 'Final Handover Certified',
      message: `Asset ${result.name} has been certified and handed over successfully.`,
      type: 'success'
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- DEFECTS ---
app.get('/api/defects', async (req, res) => {
  try {
    const defects = await getDefects();
    res.json(defects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/defects', async (req, res) => {
  try {
    const { assetId, assetName, description, severity, assignedContractor, dueDate, attachments, user } = req.body;
    const defects = await getDefects();
    const id = `DEF-${String(defects.length + 1).padStart(3, '0')}`;

    const newDefect: Defect = {
      id,
      assetId,
      assetName,
      description,
      severity,
      assignedContractor,
      dueDate,
      status: 'Open',
      attachments: attachments || [],
      comments: [],
      activity: [
        {
          id: `act-${Date.now()}-1`,
          text: `Defect logged by ${user.name}`,
          user: user.name,
          timestamp: new Date().toISOString()
        }
      ]
    };

    await insertDefect(newDefect);

    // Side-effects
    await addAuditLog({
      assetId,
      assetName,
      defectId: id,
      user: user.name,
      role: user.role,
      action: `Logged Defect ${id} (${severity} Severity)`
    });

    await addNotification({
      title: 'New Defect Raised',
      message: `Defect ${id} raised for ${assetName} - Severity: ${severity}.`,
      type: 'warning'
    });

    res.status(201).json(newDefect);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/defects/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus, user } = req.body;

    const defects = await getDefects();
    const idx = defects.findIndex(d => d.id === id);

    if (idx === -1) {
      return res.status(404).json({ message: 'Defect not found' });
    }

    const oldStatus = defects[idx].status;
    const activity = [...defects[idx].activity];
    const actText = `Status changed from ${oldStatus} to ${newStatus} by ${user.name}`;
    activity.push({
      id: `act-${Date.now()}`,
      text: actText,
      user: user.name,
      timestamp: new Date().toISOString()
    });

    const result = await updateDefect(id, { status: newStatus, activity });

    // Side-effects
    await addAuditLog({
      assetId: result.assetId,
      assetName: result.assetName,
      defectId: id,
      user: user.name,
      role: user.role,
      action: `Updated defect status`,
      prevValue: oldStatus,
      newValue: newStatus
    });

    let notifType: 'info' | 'warning' | 'success' | 'danger' = 'info';
    if (newStatus === 'Closed' || newStatus === 'Verified') notifType = 'success';
    else if (newStatus === 'Rectified') notifType = 'info';

    await addNotification({
      title: `Defect Status Updated`,
      message: `Defect ${id} is now ${newStatus}.`,
      type: notifType
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/defects/:id/comments', async (req, res) => {
  try {
    const { id } = req.params;
    const { text, user } = req.body;

    const defects = await getDefects();
    const idx = defects.findIndex(d => d.id === id);

    if (idx === -1) {
      return res.status(404).json({ message: 'Defect not found' });
    }

    const comment: Comment = {
      id: `c-${Date.now()}`,
      user: user.name,
      role: user.role,
      text,
      timestamp: new Date().toISOString()
    };

    const comments = [...defects[idx].comments, comment];
    const activity = [...defects[idx].activity];
    activity.push({
      id: `act-${Date.now()}`,
      text: `Comment added by ${user.name}`,
      user: user.name,
      timestamp: new Date().toISOString()
    });

    const result = await updateDefect(id, { comments, activity });

    // Side-effects
    await addAuditLog({
      assetId: result.assetId,
      assetName: result.assetName,
      defectId: id,
      user: user.name,
      role: user.role,
      action: `Added comment to defect: "${text.substring(0, 30)}${text.length > 30 ? '...' : ''}"`
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/defects/:id/attachments', async (req, res) => {
  try {
    const { id } = req.params;
    const { fileName, user } = req.body;

    const defects = await getDefects();
    const idx = defects.findIndex(d => d.id === id);

    if (idx === -1) {
      return res.status(404).json({ message: 'Defect not found' });
    }

    const attachments = [...defects[idx].attachments, fileName];
    const activity = [...defects[idx].activity];
    activity.push({
      id: `act-${Date.now()}`,
      text: `File attachment "${fileName}" added by ${user.name}`,
      user: user.name,
      timestamp: new Date().toISOString()
    });

    const result = await updateDefect(id, { attachments, activity });

    // Side-effects
    await addAuditLog({
      assetId: result.assetId,
      assetName: result.assetName,
      defectId: id,
      user: user.name,
      role: user.role,
      action: `Uploaded attachment: ${fileName}`
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/defects/:id/attachments/:fileName', async (req, res) => {
  try {
    const { id, fileName } = req.params;
    const { user } = req.body;

    const defects = await getDefects();
    const idx = defects.findIndex(d => d.id === id);

    if (idx === -1) {
      return res.status(404).json({ message: 'Defect not found' });
    }

    const attachments = defects[idx].attachments.filter(file => file !== fileName);
    
    const userName = user?.name || 'Authorized User';
    const userRole = user?.role || 'User';

    const activity = [...defects[idx].activity];
    activity.push({
      id: `act-${Date.now()}`,
      text: `File attachment "${fileName}" removed by ${userName}`,
      user: userName,
      timestamp: new Date().toISOString()
    });

    const result = await updateDefect(id, { attachments, activity });

    // Side-effects
    await addAuditLog({
      assetId: result.assetId,
      assetName: result.assetName,
      defectId: id,
      user: userName,
      role: userRole,
      action: `Removed attachment: ${fileName}`
    });

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- AUDIT LOGS ---
app.get('/api/audit-logs', async (req, res) => {
  try {
    const data = await getAuditLogs();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- NOTIFICATIONS ---
app.get('/api/notifications', async (req, res) => {
  try {
    const data = await getNotifications();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    await markNotificationRead(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read-all', async (req, res) => {
  try {
    await markAllNotificationsRead();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app;
