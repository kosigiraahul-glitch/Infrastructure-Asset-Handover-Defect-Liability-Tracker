import React, { useState, useEffect } from 'react';
import { useTracker, getAssetImageByName } from '../context/TrackerContext';
import type { Asset } from '../context/TrackerContext';
import { 
  Plus, 
  Search, 
  MapPin, 
  Building, 
  Calendar, 
  DollarSign, 
  SlidersHorizontal,
  ChevronRight,
  Edit2,
  X,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const AssetManager: React.FC = () => {
  const { assets, addAsset, editAsset, setCurrentView, setSelectedAssetId, currentUser } = useTracker();
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [contractorFilter, setContractorFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'budget' | 'progress'>('name');

  // Add Asset Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newProject, setNewProject] = useState('');
  const [newContractor, setNewContractor] = useState('L&T Construction');
  const [newLocation, setNewLocation] = useState('');
  const [newBudget, setNewBudget] = useState('');
  const [newStartDate, setNewStartDate] = useState('2026-06-01');
  const [newEndDate, setNewEndDate] = useState('2027-06-01');

  // Edit Asset Modal state
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  // Image Upload State
  const [newImageBase64, setNewImageBase64] = useState<string>('');
  const [newImagePreview, setNewImagePreview] = useState<string>('');
  const [newImageError, setNewImageError] = useState<string>('');

  const [editImageBase64, setEditImageBase64] = useState<string>('');
  const [editImagePreview, setEditImagePreview] = useState<string>('');
  const [editImageError, setEditImageError] = useState<string>('');

  useEffect(() => {
    if (editingAsset) {
      setEditImagePreview(editingAsset.imageUrl || editingAsset.image_url || '');
      setEditImageBase64('');
      setEditImageError('');
    } else {
      setEditImagePreview('');
      setEditImageBase64('');
      setEditImageError('');
    }
  }, [editingAsset]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setError = isEdit ? setEditImageError : setNewImageError;
    const setBase64 = isEdit ? setEditImageBase64 : setNewImageBase64;
    const setPreview = isEdit ? setEditImagePreview : setNewImagePreview;

    setError('');

    // Format verification
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPG, JPEG, PNG, and WEBP formats are allowed.');
      return;
    }

    // Size verification (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setBase64(reader.result);
        setPreview(reader.result);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  // Extract list of contractors and projects for filters
  const contractors = ['All', ...Array.from(new Set(assets.map(a => a.contractor)))];
  
  // Handlers
  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newProject || !newLocation || !newBudget || newImageError) return;

    addAsset({
      name: newName,
      projectName: newProject,
      location: newLocation,
      contractor: newContractor,
      dlpStartDate: new Date(newStartDate).toISOString(),
      dlpEndDate: new Date(newEndDate).toISOString(),
      budget: parseFloat(newBudget),
      images: [getAssetImageByName(newName)],
      imageUrl: newImageBase64 || undefined,
      image_url: newImageBase64 || undefined
    });

    // Reset Form
    setNewName('');
    setNewProject('');
    setNewLocation('');
    setNewBudget('');
    setNewContractor('L&T Construction');
    setNewImageBase64('');
    setNewImagePreview('');
    setNewImageError('');
    setShowAddModal(false);
  };

  const handleEditAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || editImageError) return;
    
    editAsset(editingAsset.id, {
      name: editingAsset.name,
      projectName: editingAsset.projectName,
      location: editingAsset.location,
      contractor: editingAsset.contractor,
      budget: editingAsset.budget,
      dlpStartDate: new Date(editingAsset.dlpStartDate).toISOString(),
      dlpEndDate: new Date(editingAsset.dlpEndDate).toISOString(),
      imageUrl: editImageBase64 || editingAsset.imageUrl || undefined,
      image_url: editImageBase64 || editingAsset.image_url || undefined
    });

    setEditingAsset(null);
  };

  const handleViewDetails = (id: string) => {
    setSelectedAssetId(id);
    setCurrentView('asset-details');
  };

  // Filtered Assets
  const filteredAssets = assets
    .filter(a => {
      const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || 
                          a.projectName.toLowerCase().includes(search.toLowerCase()) ||
                          a.contractor.toLowerCase().includes(search.toLowerCase());
      
      const matchContractor = contractorFilter === 'All' || a.contractor === contractorFilter;
      const matchStatus = statusFilter === 'All' || a.status === statusFilter;
      
      return matchSearch && matchContractor && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'budget') return b.budget - a.budget;
      if (sortBy === 'progress') return b.progress - a.progress;
      return 0;
    });

  const getStatusColor = (status: Asset['status']) => {
    switch (status) {
      case 'DLP Active':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'DLP Completed':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Handed Over':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="p-8 space-y-6 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
            Registered Assets
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Active Defect Liability and handover registries
          </p>
        </div>

        {(currentUser.role === 'Engineer' || currentUser.role === 'Admin') ? (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-brand-500/15 flex items-center space-x-1.5 transition-all duration-200"
          >
            <Plus size={14} />
            <span>Register New Asset</span>
          </button>
        ) : (
          <div className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-100 dark:bg-slate-800/60 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
            🔒 Register Restricted to Site Engineers
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border flex flex-col md:flex-row gap-4 items-center">
        {/* Search */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search assets, projects, or contractors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-slate-50/50 dark:bg-slate-900/50 focus:border-brand-500 focus:outline-none dark:text-white"
          />
        </div>

        {/* Filter Contractor */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider hidden lg:inline">Contractor:</span>
          <select
            value={contractorFilter}
            onChange={(e) => setContractorFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900 focus:border-brand-500 focus:outline-none dark:text-white"
          >
            {contractors.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider hidden lg:inline">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900 focus:border-brand-500 focus:outline-none dark:text-white"
          >
            <option value="All">All Statuses</option>
            <option value="DLP Active">DLP Active</option>
            <option value="DLP Completed">DLP Completed</option>
            <option value="Handed Over">Handed Over</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-xs text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider hidden lg:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="w-full md:w-auto px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-slate-900 focus:border-brand-500 focus:outline-none dark:text-white"
          >
            <option value="name">Name</option>
            <option value="budget">Value (Budget)</option>
            <option value="progress">DLP Elapsed</option>
          </select>
        </div>
      </div>

      {/* Grid of Asset Cards */}
      <AnimatePresence mode="popLayout">
        {filteredAssets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-darkbg-border bg-white/30 dark:bg-slate-900/10"
          >
            <Building className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={36} />
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Assets Found</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              We couldn't find any assets matching your filters. Try modifying your search query or registering a new asset.
            </p>
          </motion.div>
        ) : (
          <motion.div 
            layout 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredAssets.map((asset) => (
              <motion.div
                key={asset.id}
                layoutId={`asset-${asset.id}`}
                whileHover={{ y: -4 }}
                className="rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                {/* Visual Header Image / Mock */}
                <div className="h-44 overflow-hidden relative bg-slate-100 dark:bg-slate-800">
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
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.currentTarget.src = getAssetImageByName(asset.name);
                    }}
                  />
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border shadow-sm ${getStatusColor(asset.status)} backdrop-blur-md`}>
                      {asset.status}
                    </span>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-slate-900/60 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 text-white">
                    <span className="text-[10px] font-bold opacity-75 uppercase tracking-wider block">ID: {asset.id}</span>
                    <h3 className="text-sm font-extrabold tracking-tight truncate max-w-[220px]">{asset.name}</h3>
                  </div>
                </div>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <SlidersHorizontal size={13} className="mr-2 text-slate-400" />
                      <span className="truncate">Proj: <strong className="text-slate-700 dark:text-slate-300">{asset.projectName}</strong></span>
                    </div>

                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Building size={13} className="mr-2 text-slate-400" />
                      <span className="truncate">Contractor: <strong className="text-slate-700 dark:text-slate-300">{asset.contractor}</strong></span>
                    </div>

                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <MapPin size={13} className="mr-2 text-slate-400 shrink-0" />
                      <span className="truncate">{asset.location}</span>
                    </div>

                    <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <Calendar size={13} className="mr-2 text-slate-400 shrink-0" />
                      <span>DLP End: <strong className="text-slate-700 dark:text-slate-300">{new Date(asset.dlpEndDate).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  {/* DLP Progress Slider representation */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                      <span>DLP TIME ELAPSED</span>
                      <span className="text-slate-600 dark:text-slate-300">{asset.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          asset.status === 'Handed Over' 
                            ? 'bg-purple-500' 
                            : asset.progress >= 90 
                            ? 'bg-red-500' 
                            : asset.progress >= 60 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-500'
                        }`} 
                        style={{ width: `${asset.progress}%` }} 
                      />
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[11px] font-bold text-slate-500 flex items-center">
                      <DollarSign size={13} className="text-slate-400" />
                      <span>₹{(asset.budget / 10000000).toFixed(1)} Cr</span>
                    </div>

                    <div className="flex space-x-1.5">
                      {(currentUser.role === 'Engineer' || currentUser.role === 'Admin') && (
                        <button
                          onClick={() => setEditingAsset(asset)}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 transition"
                          title="Edit Asset Details"
                        >
                          <Edit2 size={13} />
                        </button>
                      )}

                      <button
                        onClick={() => handleViewDetails(asset.id)}
                        className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-brand-600 dark:hover:bg-brand-600 text-slate-700 dark:text-slate-300 hover:text-white dark:hover:text-white text-[11px] font-extrabold rounded-lg transition-all duration-200 flex items-center space-x-1"
                      >
                        <span>Surveillance</span>
                        <ChevronRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Asset Modal */}
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
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl z-10 glass-panel"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <h3 className="text-md font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center">
                  <PlusCircle size={18} className="mr-2 text-brand-600" />
                  <span>Register Infrastructure Asset</span>
                </h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAsset} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">ASSET NAME</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Sewage Pump Station B"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">PROJECT NAME</label>
                    <input
                      type="text"
                      required
                      value={newProject}
                      onChange={(e) => setNewProject(e.target.value)}
                      placeholder="e.g. Smart City Grid"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">CONTRACTOR</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. L&T Construction"
                      value={newContractor}
                      onChange={(e) => setNewContractor(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">LOCATION SPECIFICATIONS</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="e.g. Sector 5, Phase 1"
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">BUDGET VALUE (INR)</label>
                    <input
                      type="number"
                      required
                      value={newBudget}
                      onChange={(e) => setNewBudget(e.target.value)}
                      placeholder="e.g. 25000000"
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">DLP START DATE</label>
                    <input
                      type="date"
                      required
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">DLP END DATE</label>
                    <input
                      type="date"
                      required
                      value={newEndDate}
                      onChange={(e) => setNewEndDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">ASSET IMAGE (OPTIONAL)</label>
                  <div className="flex flex-col space-y-2.5">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileChange(e, false)}
                      className="w-full p-2 border border-dashed border-slate-350 dark:border-slate-850 rounded-xl cursor-pointer bg-slate-50/30 dark:bg-slate-950/30 text-xs dark:text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:opacity-90"
                    />
                    {newImageError && (
                      <p className="text-[10px] text-red-500 font-bold">{newImageError}</p>
                    )}
                    {newImagePreview && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img src={newImagePreview} alt="Upload Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setNewImageBase64('');
                            setNewImagePreview('');
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-650 dark:text-slate-300 font-bold transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/10 transition text-xs"
                  >
                    Register Asset
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Asset Modal */}
      <AnimatePresence>
        {editingAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingAsset(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl z-10 glass-panel"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                <h3 className="text-md font-extrabold text-slate-800 dark:text-white uppercase tracking-wider flex items-center">
                  <Edit2 size={16} className="mr-2 text-brand-650" />
                  <span>Edit Asset: {editingAsset.id}</span>
                </h3>
                <button 
                  onClick={() => setEditingAsset(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditAssetSubmit} className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">ASSET NAME</label>
                  <input
                    type="text"
                    required
                    value={editingAsset.name}
                    onChange={(e) => setEditingAsset({ ...editingAsset, name: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">PROJECT NAME</label>
                    <input
                      type="text"
                      required
                      value={editingAsset.projectName}
                      onChange={(e) => setEditingAsset({ ...editingAsset, projectName: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">CONTRACTOR</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. L&T Construction"
                      value={editingAsset.contractor}
                      onChange={(e) => setEditingAsset({ ...editingAsset, contractor: e.target.value })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">LOCATION SPECIFICATIONS</label>
                  <input
                    type="text"
                    required
                    value={editingAsset.location}
                    onChange={(e) => setEditingAsset({ ...editingAsset, location: e.target.value })}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">BUDGET VALUE (INR)</label>
                    <input
                      type="number"
                      required
                      value={editingAsset.budget}
                      onChange={(e) => setEditingAsset({ ...editingAsset, budget: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">DLP START DATE</label>
                    <input
                      type="date"
                      required
                      value={editingAsset.dlpStartDate.substring(0, 10)}
                      onChange={(e) => setEditingAsset({ ...editingAsset, dlpStartDate: new Date(e.target.value).toISOString() })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 dark:text-slate-500 mb-1">DLP END DATE</label>
                    <input
                      type="date"
                      required
                      value={editingAsset.dlpEndDate.substring(0, 10)}
                      onChange={(e) => setEditingAsset({ ...editingAsset, dlpEndDate: new Date(e.target.value).toISOString() })}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                  <label className="block text-slate-400 dark:text-slate-500 mb-1">ASSET IMAGE (OPTIONAL)</label>
                  <div className="flex flex-col space-y-2.5">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={(e) => handleFileChange(e, true)}
                      className="w-full p-2 border border-dashed border-slate-350 dark:border-slate-850 rounded-xl cursor-pointer bg-slate-50/30 dark:bg-slate-950/30 text-xs dark:text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-700 dark:file:text-slate-300 hover:file:opacity-90"
                    />
                    {editImageError && (
                      <p className="text-[10px] text-red-500 font-bold">{editImageError}</p>
                    )}
                    {editImagePreview && (
                      <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        <img src={editImagePreview} alt="Upload Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            setEditImageBase64('');
                            setEditImagePreview('');
                            setEditingAsset({ ...editingAsset, imageUrl: '', image_url: '' });
                          }}
                          className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingAsset(null)}
                    className="flex-1 py-2.5 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-650 dark:text-slate-300 font-bold transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-brand-500/10 transition text-xs"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
