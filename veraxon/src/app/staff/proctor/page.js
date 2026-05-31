'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, 
  ShieldAlert, 
  Video, 
  AlertTriangle, 
  Activity, 
  Users,
  Search,
  CameraOff
} from 'lucide-react';

export default function LiveProctoringDashboard() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [activeCandidates, setActiveCandidates] = useState([]);
  const [infractions, setInfractions] = useState([]);
  const [selectedInfraction, setSelectedInfraction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Protect route
  useEffect(() => {
    if (!authLoading && (!user || (userData?.role !== 'staff' && userData?.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, userData, authLoading, router]);

  // Real-time Listeners
  useEffect(() => {
    if (!user) return;

    // 1. Listen for Active Submissions (In-Progress)
    const qSub = query(collection(db, 'submissions'), where("status", "==", "in-progress"));
    const unsubSub = onSnapshot(qSub, (snapshot) => {
      const candidates = [];
      snapshot.forEach(doc => candidates.push({ id: doc.id, ...doc.data() }));
      setActiveCandidates(candidates);
    });

    // 2. Listen for Infractions / Violations
    const qInf = query(collection(db, 'infractions'), orderBy("timestamp", "desc"));
    const unsubInf = onSnapshot(qInf, (snapshot) => {
      const logs = [];
      snapshot.forEach(doc => logs.push({ id: doc.id, ...doc.data() }));
      setInfractions(logs);
    });

    return () => {
      unsubSub();
      unsubInf();
    };
  }, [user]);

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center animate-pulse text-white/20 uppercase tracking-[0.4em]">Initializing Surveillance Protocol...</div>;

  const filteredCandidates = activeCandidates.filter(c => c.userName?.toLowerCase().includes(searchQuery.toLowerCase()));
  const breachCount = infractions.filter(i => i.severity === 'breach').length;

  return (
    <div className="min-h-screen bg-black flex font-inter text-white">
      <div className="ambient-matrix-bg opacity-30" />
      <Sidebar role={userData?.role} />

      <main className="flex-1 ml-64 p-8 flex flex-col h-screen overflow-hidden">
         {/* Top HUD */}
         <header className="flex items-center justify-between shrink-0 mb-8 z-10 border-b border-white/5 pb-6">
            <div>
               <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-4">
                 <Eye className="w-8 h-8 text-[#0052cc]" /> Live Surveillance Grid
               </h1>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">Active Monitor Configuration</p>
            </div>
            
            <div className="flex gap-4">
               <div className="glass-card px-8 py-3 rounded-xl border border-white/5 flex items-center gap-4">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Active Nodes</h4>
                    <p className="text-lg font-black text-white leading-none mt-1">{activeCandidates.length}</p>
                 </div>
               </div>
               <div className="glass-card px-8 py-3 rounded-xl border border-white/5 border-b-[3px] border-b-red-500 flex items-center gap-4">
                 <ShieldAlert className="w-6 h-6 text-red-500" />
                 <div>
                    <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">Total Breaches</h4>
                    <p className="text-lg font-black text-red-500 leading-none mt-1">{breachCount}</p>
                 </div>
               </div>
            </div>
         </header>

         <div className="flex-1 grid grid-cols-3 gap-8 min-h-0 z-10">
            {/* Main Camera Grid */}
            <div className="col-span-2 flex flex-col min-h-0 bg-black/40 rounded-2xl border border-white/5">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-[#0052cc] flex items-center gap-2">
                     <Users className="w-4 h-4" /> Connected Vectors
                   </h3>
                   <div className="relative w-64">
                      <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input 
                        type="text" 
                        placeholder="Search Candidate..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="jira-input !bg-white/[0.02] !py-2 !pl-8 !text-[10px]"
                      />
                   </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-250px)]">
                  {filteredCandidates.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                       <CameraOff className="w-12 h-12 text-white/20 mb-4" />
                       <span className="text-xs uppercase tracking-widest font-black text-white/40">No active streams</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4">
                       {filteredCandidates.map(candidate => {
                         const candidateInfractions = infractions.filter(i => i.studentId === candidate.userId);
                         const isBreached = candidateInfractions.some(i => i.severity === 'breach');
                         
                         return (
                           <div key={candidate.id} className={`glass-card rounded-xl overflow-hidden border ${isBreached ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)]' : 'border-white/5'} flex flex-col`}>
                              <div className="aspect-video bg-black/80 flex items-center justify-center relative">
                                 {/* Simulating live feed box since actual WEBRTC requires massive backend setup */}
                                 <Video className="w-8 h-8 text-white/10" />
                                 <div className="absolute top-2 left-2 flex items-center gap-2 bg-black/60 px-2 py-1 rounded backdrop-blur border border-white/10">
                                   <div className={`w-1.5 h-1.5 rounded-full ${isBreached ? 'bg-red-500' : 'bg-emerald-500'} animate-pulse`} />
                                   <span className="text-[8px] font-black uppercase tracking-widest text-white/60">LIVE</span>
                                 </div>
                              </div>
                              <div className="p-4 bg-[#0a0a0a]">
                                <h4 className="text-[11px] font-black uppercase truncate text-white/90">{candidate.userName}</h4>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mt-1">ID: {candidate.userId.substring(0,6)}</p>
                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-[#0052cc]">{candidateInfractions.length} Flags</span>
                                  {isBreached && <span className="text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">Terminated</span>}
                                </div>
                              </div>
                           </div>
                         );
                       })}
                    </div>
                  )}
                </div>
            </div>

            {/* Live Violation Feed */}
            <div className="glass-card flex flex-col min-h-0 border-white/5 rounded-2xl overflow-hidden shadow-2xl">
               <div className="p-4 border-b border-white/5 bg-gradient-to-r from-red-500/5 to-transparent">
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-red-400 flex items-center gap-2">
                    <Activity className="w-4 h-4" /> Global Infractions List
                  </h3>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[calc(100vh-250px)]">
                  {infractions.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                       <span className="text-[10px] uppercase font-black tracking-widest text-white/20">Telemetry Clean (0 events)</span>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {infractions.map(log => (
                        <motion.div 
                           key={log.id}
                           initial={{ opacity: 0, x: 20 }}
                           animate={{ opacity: 1, x: 0 }}
                           className={`p-3 rounded-lg border cursor-pointer hover:-translate-y-0.5 transition-transform ${
                             log.severity === 'breach' 
                               ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                               : 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10'
                           }`}
                           onClick={() => setSelectedInfraction(log)}
                        >
                           <div className="flex items-center gap-3">
                              {log.severity === 'breach' ? (
                                <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                 <p className="text-[10px] font-black text-white/80 uppercase truncate">{log.studentName}</p>
                                 <p className={`text-[9px] font-black tracking-widest uppercase mt-1 truncate ${
                                   log.severity === 'breach' ? 'text-red-400' : 'text-amber-500/70'
                                 }`}>{log.type}</p>
                              </div>
                              <span className="text-[8px] font-black text-white/30 uppercase shrink-0">
                                {log.timestamp?.toDate ? new Intl.DateTimeFormat('en-US', {hour:'2-digit', minute:'2-digit', second:'2-digit'}).format(log.timestamp.toDate()) : 'Now'}
                              </span>
                           </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  )}
               </div>
            </div>
         </div>
      </main>

      {/* Infraction Evidence Viewer */}
      <AnimatePresence>
         {selectedInfraction && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="glass-card max-w-2xl w-full p-8 border-white/10 rounded-2xl relative overflow-hidden"
               >
                  <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                     <div>
                        <h2 className="text-xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
                          <Eye className="w-5 h-5 text-[#0052cc]" /> Evidence Viewer
                        </h2>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Incident ID: {selectedInfraction.id}</p>
                     </div>
                     <span className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border ${
                       selectedInfraction.severity === 'breach' 
                        ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                     }`}>
                       {selectedInfraction.severity}
                     </span>
                  </div>

                  <div className="space-y-6">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                           <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Subject Vector</p>
                           <p className="text-sm font-bold text-white uppercase">{selectedInfraction.studentName}</p>
                        </div>
                        <div className="p-4 bg-black/40 rounded-xl border border-white/5">
                           <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">Flagged Activity</p>
                           <p className={`text-sm font-bold uppercase ${selectedInfraction.severity === 'breach' ? 'text-red-400' : 'text-amber-500'}`}>{selectedInfraction.type}</p>
                        </div>
                     </div>

                     <div className="aspect-video w-full rounded-xl bg-black border border-white/10 overflow-hidden relative">
                        {/* Render base64 image if it was passed via camera AI, else fallback */}
                        {selectedInfraction.evidence && selectedInfraction.evidence.startsWith('data:image') ? (
                          <img src={selectedInfraction.evidence} alt="Evidence" className="w-full h-full object-cover" />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <ShieldAlert className="w-12 h-12 text-white/10 mb-2" />
                            <p className="text-[10px] tracking-widest uppercase font-black text-white/30">System Log Only - No Snapshot Associated</p>
                          </div>
                        )}
                     </div>

                     <div className="flex items-center gap-4 pt-4">
                        <button 
                          onClick={() => setSelectedInfraction(null)} 
                          className="flex-1 jira-btn-secondary !py-4 uppercase tracking-[0.2em] text-[10px]"
                        >
                          Close Viewer
                        </button>
                        <button className="flex-1 jira-btn-danger !py-4 uppercase tracking-[0.2em] text-[10px]">
                          Verify & Terminate Session
                        </button>
                     </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
