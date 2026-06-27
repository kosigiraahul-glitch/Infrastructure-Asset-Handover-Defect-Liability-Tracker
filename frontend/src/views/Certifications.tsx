import React, { useRef, useState, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import type { Asset } from '../context/TrackerContext';
import { 
  Award, 
  CheckCircle, 
  FileCheck, 
  Signature, 
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

export const Certifications: React.FC = () => {
  const { assets, defects, generateCertificate, currentUser, addNotification, projects } = useTracker();

  // Selected Asset
  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  
  // Simulation overrides
  const [isDLPSimulated, setIsDLPSimulated] = useState<boolean>(true);

  // Workflow states stored locally/persisted in memory per asset
  // In a real app these are DB flags. We simulate them with localStorage keys prefixed by asset ID.
  const [isQCVerified, setIsQCVerified] = useState<boolean>(false);
  const [isPMAudited, setIsPMAudited] = useState<boolean>(false);
  const [generatedCertificateAsset, setGeneratedCertificateAsset] = useState<Asset | null>(null);

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const activeAsset = assets.find(a => a.id === selectedAssetId);
  const certifiedProject = generatedCertificateAsset 
    ? projects.find(p => p.name === generatedCertificateAsset.projectName)
    : null;

  // Sync workflow states when active asset changes
  useEffect(() => {
    if (selectedAssetId) {
      const qcSaved = localStorage.getItem(`avinash_qc_${selectedAssetId}`) === 'true';
      const pmSaved = localStorage.getItem(`avinash_pm_${selectedAssetId}`) === 'true';
      setIsQCVerified(qcSaved);
      setIsPMAudited(pmSaved);
      setHasSignature(false);
    } else {
      setIsQCVerified(false);
      setIsPMAudited(false);
      setHasSignature(false);
    }
  }, [selectedAssetId]);

  // Check compliance conditions
  const getComplianceStatus = (asset: Asset) => {
    const assetDefs = defects.filter(d => d.assetId === asset.id);
    const openDefs = assetDefs.filter(d => ['Open', 'Assigned', 'In Progress', 'Rectified'].includes(d.status));
    
    const defectsOk = openDefs.length === 0;
    const dlpOk = asset.progress >= 100 || isDLPSimulated;

    return {
      defectsOk,
      dlpOk,
      openCount: openDefs.length,
      qcOk: defectsOk && dlpOk && isQCVerified,
      allOk: defectsOk && dlpOk && isQCVerified && isPMAudited
    };
  };

  // Canvas drawing handlers
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#3f5d8e'; // brand-600
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [selectedAssetId, generatedCertificateAsset, isQCVerified, isPMAudited, currentUser]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  // Stepper representation of current workflow state
  const getWorkflowSteps = (asset?: Asset) => {
    if (!asset) return [];
    
    const assetDefs = defects.filter(d => d.assetId === asset.id);
    const hasDefects = assetDefs.length > 0;
    
    const openDefs = assetDefs.filter(d => d.status === 'Open');
    const assignedDefs = assetDefs.filter(d => d.status === 'Assigned');
    const inProgressDefs = assetDefs.filter(d => d.status === 'In Progress');
    const rectifiedDefs = assetDefs.filter(d => d.status === 'Rectified');
    
    const isAssetHandedOver = asset.status === 'Handed Over';
    
    // Determine active stage
    let activeStepIdx = 2; // Start at Site Engineer Registers Completed Asset (since selected asset is registered)
    
    if (isAssetHandedOver) {
      activeStepIdx = 8; // Project Closed
    } else if (isPMAudited) {
      activeStepIdx = 7; // Admin Approves Final Handover
    } else if (isQCVerified) {
      activeStepIdx = 6; // Project Manager Reviews
    } else if (rectifiedDefs.length > 0) {
      activeStepIdx = 5; // Site Engineer Verifies Work
    } else if (inProgressDefs.length > 0) {
      activeStepIdx = 4; // Contractor Fixes Issues
    } else if (assignedDefs.length > 0) {
      activeStepIdx = 3; // Site Engineer Assigns Defects to Contractor
    } else if (openDefs.length > 0 || hasDefects) {
      activeStepIdx = 2; // Site Engineer Creates Punch List Defects
    } else {
      // Default: if no defects exist, they must be created or we are at site engineer QC verification
      const compliance = getComplianceStatus(asset);
      if (compliance.defectsOk) {
        activeStepIdx = 5; // Site Engineer Verifies Work (QC Verification pad)
      } else {
        activeStepIdx = 2; // Site Engineer Creates Punch List Defects
      }
    }

    return [
      { id: 'admin-setup', name: 'Project Admin: Creates Users & Projects', done: true, current: false },
      { id: 'eng-register', name: 'Site Engineer: Registers Completed Asset', done: true, current: false },
      { id: 'eng-create-defects', name: 'Site Engineer: Creates Punch List Defects', done: activeStepIdx > 2, current: activeStepIdx === 2 },
      { id: 'eng-assign-defects', name: 'Site Engineer: Assigns Defects to Contractor', done: activeStepIdx > 3, current: activeStepIdx === 3 },
      { id: 'contractor-fix', name: 'Contractor: Fixes Issues', done: activeStepIdx > 4, current: activeStepIdx === 4 },
      { id: 'eng-verify-defect', name: 'Site Engineer: Verifies Work', done: activeStepIdx > 5 || isQCVerified, current: activeStepIdx === 5 && !isQCVerified },
      { id: 'pm-review', name: 'Project Manager: Reviews', done: activeStepIdx > 6 || isPMAudited, current: activeStepIdx === 6 && !isPMAudited },
      { id: 'admin-approve', name: 'Admin: Approves Final Handover', done: isAssetHandedOver, current: activeStepIdx === 7 },
      { id: 'project-closed', name: 'Project Closed', done: isAssetHandedOver, current: activeStepIdx === 8 }
    ];
  };

  const handleEngineerVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset || !hasSignature) return;

    localStorage.setItem(`avinash_qc_${activeAsset.id}`, 'true');
    setIsQCVerified(true);
    setHasSignature(false);
    clearCanvas();

    // Trigger local browser alert or notification
    confetti({ particleCount: 50, spread: 40 });
  };

  const handlePMVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset || !hasSignature) return;

    localStorage.setItem(`avinash_pm_${activeAsset.id}`, 'true');
    setIsPMAudited(true);
    setHasSignature(false);
    clearCanvas();

    confetti({ particleCount: 60, spread: 50 });
  };

  const handleGenerateCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsset || !hasSignature) return;

    const compliance = getComplianceStatus(activeAsset);
    if (!compliance.allOk) return;

    // Trigger state context handover mutation
    generateCertificate(activeAsset.id);

    // Save certified asset state to render certificate view
    setGeneratedCertificateAsset(activeAsset);

    // Confetti celebration!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleAdminBypass = () => {
    if (!activeAsset) return;
    localStorage.setItem(`avinash_qc_${activeAsset.id}`, 'true');
    localStorage.setItem(`avinash_pm_${activeAsset.id}`, 'true');
    setIsQCVerified(true);
    setIsPMAudited(true);
    addNotification({
      title: 'Admin Override Applied',
      message: `QC check and PM Audit auto-approved for ${activeAsset.name} by Admin.`,
      type: 'success'
    });
  };

  return (
    <div className="p-8 space-y-8 overflow-y-auto max-h-[calc(100vh-5rem)]">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
          Handover Certifications
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Role-based project workflow sign-offs & approvals
        </p>
      </div>

      <AnimatePresence mode="wait">
        {!generatedCertificateAsset ? (
          // ==========================================
          // WORKFLOW STATIONS & FORMS
          // ==========================================
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Asset selector */}
            <div className="p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm space-y-4">
              <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Select Surveillance Asset</label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                className="w-full p-3 border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 rounded-xl focus:border-brand-500 focus:outline-none dark:text-white text-xs font-semibold"
              >
                <option value="">-- Select Asset --</option>
                {assets.map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.contractor}) - Status: {a.status}</option>
                ))}
              </select>
            </div>

            {activeAsset && (
              <>
                {/* Workflow Stepper Dashboard */}
                <div className="p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm overflow-hidden">
                  <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Project Workflow Stepper</span>
                  
                  <div className="overflow-x-auto flex space-x-6 pb-2 min-w-full">
                    {getWorkflowSteps(activeAsset).map((step, idx) => (
                      <React.Fragment key={step.id}>
                        {idx > 0 && (
                          <div className="h-[2px] bg-slate-100 dark:bg-slate-800 min-w-[30px] self-center shrink-0">
                            <div className={`h-full ${getWorkflowSteps(activeAsset)[idx - 1].done ? 'bg-brand-500' : 'bg-slate-200'}`} style={{ width: '100%' }} />
                          </div>
                        )}

                        <div className="flex items-center space-x-2.5 shrink-0 py-1">
                          <div className={`h-6 w-6 rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0 transition-colors ${
                            step.done 
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow shadow-emerald-500/25'
                              : step.current 
                              ? 'border-brand-500 text-brand-650 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20 animate-pulse font-extrabold shadow shadow-brand-500/20'
                              : 'border-slate-200 dark:border-slate-800 text-slate-400 bg-slate-50/50'
                          }`}>
                            {step.done ? '✓' : idx + 1}
                          </div>
                          <div className="text-left">
                            <p className={`text-[10px] font-bold tracking-tight max-w-[125px] leading-tight ${step.current ? 'text-brand-600 dark:text-brand-400 font-extrabold' : step.done ? 'text-slate-700 dark:text-slate-200 font-bold' : 'text-slate-400 font-medium'}`}>
                              {step.name}
                            </p>
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Role-Based Forms Rendering */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Checklist & Status */}
                  <div className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm space-y-6">
                    <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider flex items-center">
                      <FileCheck size={18} className="mr-2 text-brand-600" />
                      <span>QC Checklist & Verifications</span>
                    </h3>

                    <div className="space-y-3.5 text-xs font-semibold">
                      {/* Check 1: Open Defects */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="flex items-center space-x-2.5">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                            getComplianceStatus(activeAsset).defectsOk ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}>
                            {getComplianceStatus(activeAsset).defectsOk ? '✓' : '!'}
                          </div>
                          <span className="text-slate-700 dark:text-slate-350">Zero open defects in Punch List</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${
                          getComplianceStatus(activeAsset).defectsOk ? 'text-emerald-500' : 'text-rose-500'
                        }`}>
                          {getComplianceStatus(activeAsset).defectsOk ? 'Compliant' : `${getComplianceStatus(activeAsset).openCount} Open Defects`}
                        </span>
                      </div>

                      {/* Check 2: DLP Complete */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="flex items-center space-x-2.5">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                            getComplianceStatus(activeAsset).dlpOk ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}>
                            {getComplianceStatus(activeAsset).dlpOk ? '✓' : '!'}
                          </div>
                          <span className="text-slate-700 dark:text-slate-350">Defect Liability Period (DLP) Completed</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <label className="flex items-center space-x-1.5 text-[10px] text-slate-400 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={isDLPSimulated}
                              onChange={(e) => setIsDLPSimulated(e.target.checked)}
                              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500" 
                            />
                            <span>Simulate Completion</span>
                          </label>
                          <span className={`text-[10px] font-black uppercase ${
                            getComplianceStatus(activeAsset).dlpOk ? 'text-emerald-500' : 'text-amber-500'
                          }`}>
                            {getComplianceStatus(activeAsset).dlpOk ? 'Completed' : 'Active'}
                          </span>
                        </div>
                      </div>

                      {/* Check 3: Site Engineer Signoff */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="flex items-center space-x-2.5">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                            isQCVerified ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}>
                            {isQCVerified ? '✓' : '?'}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300">Site Engineer QC Check Verified</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${
                          isQCVerified ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {isQCVerified ? 'Verified' : 'Pending'}
                        </span>
                      </div>

                      {/* Check 4: PM Quality Audit */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/10">
                        <div className="flex items-center space-x-2.5">
                          <div className={`h-5 w-5 rounded-full flex items-center justify-center text-white text-[10px] ${
                            isPMAudited ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}>
                            {isPMAudited ? '✓' : '?'}
                          </div>
                          <span className="text-slate-700 dark:text-slate-300">Project Manager Quality Audit Approved</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase ${
                          isPMAudited ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {isPMAudited ? 'Audited' : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Signature block / Action Block depending on role */}
                    {/* ROLE 1: SITE ENGINEER FORM */}
                    {currentUser.role === 'Engineer' && (
                      <div className="pt-6 border-t border-slate-150 dark:border-slate-850 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-205 dark:border-slate-800 space-y-2">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">QC SURVEILLANCE SIGN-OFF (Site Engineer)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                            As Site Engineer, verify that all punch list defects are closed. Draw your signature below to approve the QC checklist.
                          </p>
                        </div>

                        {!isQCVerified ? (
                          <form onSubmit={handleEngineerVerify} className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-450 uppercase tracking-widest flex items-center">
                                <Signature size={12} className="mr-1 text-brand-500" />
                                QC Engineer Signature Pad
                              </span>
                              {hasSignature && (
                                <button type="button" onClick={clearCanvas} className="text-rose-500 hover:underline">Clear</button>
                              )}
                            </div>
                            <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 rounded-xl overflow-hidden">
                              <canvas
                                ref={canvasRef}
                                width={480}
                                height={120}
                                className="w-full h-[120px] cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={!getComplianceStatus(activeAsset).defectsOk || !getComplianceStatus(activeAsset).dlpOk || !hasSignature}
                              className={`w-full py-2.5 text-xs font-bold rounded-xl transition ${
                                getComplianceStatus(activeAsset).defectsOk && getComplianceStatus(activeAsset).dlpOk && hasSignature
                                  ? 'bg-brand-600 hover:bg-brand-500 text-white shadow'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              Sign & Verify QC Checkpoints
                            </button>
                          </form>
                        ) : (
                          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold text-center">
                            ✓ Site Engineer QC verification sign-off is completed. Pending PM quality audit review.
                          </div>
                        )}
                      </div>
                    )}

                    {/* ROLE 2: PROJECT MANAGER FORM */}
                    {currentUser.role === 'Project Manager' && (
                      <div className="pt-6 border-t border-slate-150 dark:border-slate-850 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-205 dark:border-slate-800 space-y-2">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide font-sans">QUALITY AUDIT SIGN-OFF (Project Manager)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                            As Project Manager, approve the Quality Audit once Site Engineer QC checks are complete. Draw signature to verify.
                          </p>
                        </div>

                        {!isQCVerified ? (
                          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 font-bold text-center">
                            ⚠ QC check not verified yet. Site Engineer must sign off QC verifications before PM Quality Audit.
                          </div>
                        ) : !isPMAudited ? (
                          <form onSubmit={handlePMVerify} className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-450 uppercase tracking-widest flex items-center">
                                <Signature size={12} className="mr-1 text-indigo-500" />
                                PM Audit Signature Pad
                              </span>
                              {hasSignature && (
                                <button type="button" onClick={clearCanvas} className="text-rose-500 hover:underline">Clear</button>
                              )}
                            </div>
                            <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 rounded-xl overflow-hidden">
                              <canvas
                                ref={canvasRef}
                                width={480}
                                height={120}
                                className="w-full h-[120px] cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={!hasSignature}
                              className={`w-full py-2.5 text-xs font-bold rounded-xl transition ${
                                hasSignature ? 'bg-indigo-650 hover:bg-indigo-500 text-white shadow' : 'bg-slate-100 text-slate-400 cursor-not-allowed border'
                              }`}
                            >
                              Sign & Approve PM Quality Audit
                            </button>
                          </form>
                        ) : (
                          <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-500 font-bold text-center">
                            ✓ PM Quality Audit approved. Pending Admin handover certification signature.
                          </div>
                        )}
                      </div>
                    )}

                    {/* ROLE 3: PROJECT ADMIN FORM */}
                    {currentUser.role === 'Admin' && (
                      <div className="pt-6 border-t border-slate-150 dark:border-slate-850 space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-205 dark:border-slate-800 space-y-2">
                          <h4 className="font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wide">FINAL HANDOVER CERTIFICATION (Project Admin)</h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                            As Project Admin, sign off on the handover certificate once the QC and PM checkpoints are verified. This closes the project.
                          </p>
                        </div>

                        {!isQCVerified || !isPMAudited ? (
                          <div className="p-5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-500 font-bold text-center space-y-3.5">
                            <p className="text-xs">⚠ Workflow block: Both QC Check and PM Audit must be approved before generating Handover Certificate.</p>
                            <div className="h-[1px] bg-rose-500/15 w-24 mx-auto" />
                            <p className="text-[10px] text-slate-400 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">To test the natural pipeline, click on the top-right user menu &quot;System Admin ADMIN&quot; to switch roles to Vikram Rao (Site Engineer) or Amit Sharma (Project Manager) and sign off each stage. Alternatively, use the admin shortcut below:</p>
                            <button
                              type="button"
                              onClick={handleAdminBypass}
                              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-[11px] font-extrabold rounded-xl shadow-md transition-all duration-200"
                            >
                              ⚡ Admin Override: Bypass & Auto-Approve Checkpoints
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={handleGenerateCertificate} className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold">
                              <span className="text-slate-450 uppercase tracking-widest flex items-center">
                                <Signature size={12} className="mr-1 text-indigo-500" />
                                QA/QC Admin Handover Signature Pad
                              </span>
                              {hasSignature && (
                                <button type="button" onClick={clearCanvas} className="text-rose-500 hover:underline">Clear</button>
                              )}
                            </div>
                            <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 rounded-xl overflow-hidden">
                              <canvas
                                ref={canvasRef}
                                width={480}
                                height={120}
                                className="w-full h-[120px] cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                              />
                            </div>
                            <button
                              type="submit"
                              disabled={!hasSignature}
                              className={`w-full py-3 text-xs font-bold rounded-xl transition duration-300 ${
                                hasSignature 
                                  ? 'bg-gradient-to-r from-brand-600 to-indigo-650 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg' 
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border'
                              }`}
                            >
                              Sign & Approve Final Handover (Close Project)
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* ROLE 4: CONTRACTOR MESSAGE */}
                    {currentUser.role === 'Contractor' && (
                      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/30 text-slate-450 font-bold text-center text-xs">
                        🔒 Contractor mode. Handover Certificates must be inspected by Site Engineers, audited by Project Managers, and approved by the Project Administrator.
                      </div>
                    )}
                  </div>

                  {/* Right Column: Workflow Overview */}
                  <div className="lg:col-span-1 p-6 rounded-xl bg-slate-50 dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="p-3 bg-brand-500/10 text-brand-650 dark:text-brand-400 rounded-xl inline-block">
                        <Award size={24} />
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-850 dark:text-slate-200 uppercase tracking-wider">Project Handover Pipeline</h3>
                      
                      <div className="space-y-3.5 text-xs font-semibold text-slate-500">
                        {/* Pipeline visual nodes */}
                        {getWorkflowSteps(activeAsset).map((step, idx) => {
                          const Icon = step.done ? CheckCircle : step.current ? Signature : Award;
                          return (
                            <div key={step.id} className="flex items-start space-x-2.5">
                              <span className={`mt-0.5 shrink-0 ${
                                step.done ? 'text-emerald-500' : step.current ? 'text-brand-500 animate-pulse' : 'text-slate-400'
                              }`}>
                                <Icon size={14} />
                              </span>
                              <span className={`${
                                step.done 
                                  ? 'text-slate-755 dark:text-slate-300 line-through decoration-slate-400/40' 
                                  : step.current 
                                  ? 'text-brand-650 dark:text-brand-400 font-extrabold' 
                                  : 'text-slate-400'
                              }`}>
                                {idx + 1}. {step.name.split(':')[1] || step.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {activeAsset.status === 'Handed Over' && (
                      <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 text-emerald-500 rounded-xl flex items-center space-x-2.5">
                        <CheckCircle size={16} className="shrink-0" />
                        <span className="text-[11px] font-bold">Handover Certified. Project Closed.</span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        ) : (
          // ==========================================
          // CERTIFICATE VIEW
          // ==========================================
          <motion.div
            key="certificate"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-6 print-container"
          >
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white dark:bg-darkbg-card p-4 rounded-xl border border-slate-200 dark:border-darkbg-border shadow-sm shrink-0 no-print">
              <button
                onClick={() => setGeneratedCertificateAsset(null)}
                className="px-4 py-2 border border-slate-205 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-350 text-xs font-bold rounded-xl transition"
              >
                Back to certifications
              </button>

              <button
                onClick={handlePrintCertificate}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center space-x-1.5"
              >
                <Printer size={14} />
                <span>Print Certificate (PDF)</span>
              </button>
            </div>

            {/* Certificate Template */}
            <div 
              id="handover-certificate" 
              className="mx-auto max-w-3xl p-12 bg-white dark:bg-slate-900 border-8 border-brand-900/10 shadow-2xl relative overflow-hidden flex flex-col justify-between aspect-[1/1.4] select-text font-sans-elegant"
            >
              <div className="absolute inset-4 border-2 border-brand-900/20 pointer-events-none" />

              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] dark:opacity-[0.01] pointer-events-none">
                <Award size={400} />
              </div>

              {/* Logo */}
              <div className="text-center space-y-3 relative z-10">
                <div className="mx-auto bg-brand-500/10 dark:bg-brand-500/5 text-brand-700 dark:text-brand-400 p-3 rounded-full w-fit">
                  <Award size={36} />
                </div>
                <div>
                  <h1 className="text-xs font-black tracking-[0.25em] text-slate-655 dark:text-slate-300 uppercase">
                    AVINASH KANAPARTHI INFRA PRIVATE LIMITED
                  </h1>
                  <p className="text-[8px] text-slate-400 dark:text-slate-500 font-bold tracking-[0.2em] uppercase mt-1">
                    REGISTERED OFFICE: HYDERABAD, INDIA • CIN: U45200TG2015PTC099123
                  </p>
                </div>
                <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-brand-600 to-transparent mx-auto mt-2" />
              </div>

              {/* Title */}
              <div className="text-center space-y-3 my-4 relative z-10">
                <h2 className="text-2xl font-black text-brand-900 dark:text-brand-400 tracking-wide uppercase font-serif-elegant">
                  CERTIFICATE OF FINAL HANDOVER
                </h2>
                <p className="text-[13px] text-slate-600 dark:text-slate-350 italic max-w-lg mx-auto leading-relaxed font-serif-elegant font-medium">
                  This document serves as formal confirmation of the successful completion of the Defect Liability Period (DLP) surveillance cycle and final handover release.
                </p>
              </div>

              {/* Details table */}
              <div className="p-6 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-4 text-xs font-semibold text-slate-700 dark:text-slate-300 relative z-10">
                <div className="grid grid-cols-2 gap-x-8 gap-y-3.5">
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">ASSET NAME</span>
                    <span className="text-slate-900 dark:text-white text-[13px] font-bold uppercase">{generatedCertificateAsset.name}</span>
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">PROJECT SPECIFICATION</span>
                    <span className="text-slate-900 dark:text-white text-[13px] font-bold uppercase">{generatedCertificateAsset.projectName}</span>
                  </div>

                  <div className="space-y-0.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">CLIENT ENTITY</span>
                    <span className="text-slate-800 dark:text-slate-200 text-xs font-bold">{certifiedProject?.client || 'Avinash IT Developers'}</span>
                  </div>
                  <div className="space-y-0.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">CONTRACTOR VENDOR</span>
                    <span className="text-slate-800 dark:text-slate-200 text-xs font-bold">{generatedCertificateAsset.contractor}</span>
                  </div>

                  <div className="space-y-0.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">LOCATION REGISTRY</span>
                    <span className="text-slate-800 dark:text-slate-200 text-xs font-bold">{generatedCertificateAsset.location}</span>
                  </div>
                  <div className="space-y-0.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">ASSET VALUE / BUDGET</span>
                    <span className="text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                      ₹{generatedCertificateAsset.budget.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="space-y-0.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">DLP SURVEILLANCE COMPLETED</span>
                    <span className="text-slate-800 dark:text-slate-250 text-[11px]">
                      {new Date(generatedCertificateAsset.dlpStartDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})} to {new Date(generatedCertificateAsset.dlpEndDate).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}
                    </span>
                  </div>
                  <div className="space-y-0.5 pt-2.5 border-t border-slate-200/50 dark:border-slate-800/50">
                    <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">QUALITY COMPLIANCE RATING</span>
                    <span className="text-brand-700 dark:text-brand-400 text-xs font-bold">
                      {generatedCertificateAsset.healthScore}% Quality Index (0 Defects)
                    </span>
                  </div>
                </div>
              </div>

              {/* QC declaration */}
              <p className="text-[10px] text-slate-500 dark:text-slate-400 text-center max-w-lg mx-auto leading-relaxed my-3 relative z-10 font-medium font-serif-elegant">
                It is hereby certified that the asset specified above has undergone comprehensive Quality Control assessments and is free from any outstanding defect liabilities. The asset is officially approved for final project closure and handed over to the client.
              </p>

              {/* Signatures Row */}
              <div className="grid grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800 relative z-10">
                <div className="text-center space-y-1.5">
                  <div className="h-10 flex flex-col items-center justify-center">
                    <span className="font-serif-elegant italic text-sm text-indigo-700 dark:text-indigo-400 font-semibold">
                      Vikram Rao / Amit Sharma
                    </span>
                    <span className="text-[7px] text-slate-400 block -mt-0.5">VERIFIED VIA SECURITY TOKEN</span>
                  </div>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-32 mx-auto" />
                  <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">QC ENGINEER & PM AUDITED</span>
                </div>

                <div className="text-center space-y-1.5">
                  <div className="h-10 flex items-center justify-center">
                    <img 
                      src={canvasRef.current ? canvasRef.current.toDataURL() : ''} 
                      alt="Handover Signature" 
                      className="max-h-8 object-contain dark:invert"
                    />
                  </div>
                  <div className="h-[1px] bg-slate-200 dark:bg-slate-800 w-32 mx-auto" />
                  <span className="text-[8px] text-slate-400 dark:text-slate-550 uppercase tracking-widest block font-bold">AVINASH QA/QC ADMIN APPROVED</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
