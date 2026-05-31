'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Users, 
  Search, 
  Mail,
  CheckCircle2,
  AlertCircle 
} from 'lucide-react';

export default function CandidatesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [candidates, setCandidates] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [nudgeStatus, setNudgeStatus] = useState({});

  useEffect(() => {
    async function fetchCandidates() {
      if (!userData) return;
      try {
        const usersRef = collection(db, 'users');
        const qStudents = query(
          usersRef, 
          where('role', '==', 'student'),
          where('collegeName', '==', userData.collegeName),
          where('department', '==', userData.department)
        );
        const querySnapshot = await getDocs(qStudents);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCandidates(fetched);
      } catch (err) {
        console.error('Error fetching institutional candidates:', err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchCandidates();
  }, [userData]);


  if (authLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter">
      <div className="ambient-matrix-bg" />
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    router.push('/login');
    return null;
  }

  const handleSendReminder = async (studentId, studentName) => {
    setNudgeStatus(prev => ({ ...prev, [studentId]: 'loading' }));
    try {
      await addDoc(collection(db, 'notifications'), {
        recipientId: studentId,
        senderId: user.uid,
        message: `Your presence is requested by ${userData.username} to complete your mandatory ${userData.department} assessments.`,
        type: 'reminder',
        read: false,
        timestamp: new Date().toISOString()
      });
      setNudgeStatus(prev => ({ ...prev, [studentId]: 'success' }));
      setTimeout(() => {
        setNudgeStatus(prev => ({ ...prev, [studentId]: 'idle' }));
      }, 3000);
    } catch (err) {
      console.error('Nudge failed:', err);
      setNudgeStatus(prev => ({ ...prev, [studentId]: 'error' }));
    }
  };

  const filteredCandidates = candidates.filter(c => 
    c.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.registerNumber && c.registerNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black flex font-inter">
      <div className="ambient-matrix-bg" />
      <Sidebar role="staff" />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#0052cc] transition-colors" />
            <input 
              type="text" 
              placeholder={`Search Candidates...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[11px] font-bold text-white focus:outline-none focus:border-[#0052cc]/40 transition-all placeholder:text-white/10 uppercase tracking-widest"
            />
          </div>
        </header>

        {/* Portal Title */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
           <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
             Enrolled Network
             <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
           </h1>
           <p className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.4em] mt-2">
             {userData.collegeName} • {userData.department}
           </p>
        </motion.div>

        {/* Grid Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
           <div className="jira-card">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 rounded-lg bg-[#0052cc]/10 text-[#0052cc]">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Total Enrolled</span>
              </div>
              <div className="text-3xl font-black text-white">{dataLoading ? '...' : candidates.length}</div>
           </div>
        </div>

        {/* Candidate List Matrix */}
        <div className="glass-card rounded-[32px] border border-white/5 overflow-hidden bg-black/40 shadow-2xl backdrop-blur-xl">
           <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
             <div>
               <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 mb-1">Identity Matrix</h3>
               <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest">Active Verification Directory • {userData.department}</p>
             </div>
             <div className="flex items-center gap-3">
               <span className="px-4 py-1.5 rounded-full bg-[#0052cc]/10 border border-[#0052cc]/20 text-[9px] font-black text-[#0052cc] uppercase">1,248 Verified Units</span>
             </div>
           </div>
           
           <div className="w-full overflow-x-auto">
             {dataLoading ? (
               <div className="p-32 text-center text-white/30 text-[11px] uppercase tracking-[0.6em] font-black flex flex-col items-center gap-6 italic">
                 <div className="w-10 h-10 border-4 border-[#0052cc]/10 border-t-[#0052cc] rounded-full animate-spin" />
                 Decrypting Registry...
               </div>
             ) : filteredCandidates.length === 0 ? (
               <div className="p-32 text-center text-white/10 text-[11px] uppercase tracking-[0.5em] font-black italic">
                 No Institutional Matches Found.
               </div>
             ) : (
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-white/5 bg-black/60">
                     <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] pl-10">Verification Avatar</th>
                     <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Credentials</th>
                     <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Register Node</th>
                     <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Status</th>
                     <th className="p-6 text-[10px] font-black text-white/20 uppercase tracking-[0.3em] text-right pr-10">Protocol Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-white/[0.02]">
                   {filteredCandidates.map((candidate) => (
                     <tr key={candidate.id} className="hover:bg-white/[0.01] transition-all duration-500 group">
                       <td className="p-6 pl-10">
                         <div className="relative inline-block">
                           {candidate.photoURL ? (
                             <img 
                              src={candidate.photoURL} 
                              alt={candidate.username} 
                              className="w-12 h-12 rounded-2xl border border-white/10 object-cover shadow-2xl transition-all group-hover:scale-110 group-hover:border-[#0052cc]/40"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${candidate.username}&background=0052cc&color=fff&bold=true`;
                              }}
                             />
                           ) : (
                             <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0052cc]/20 to-black border border-white/10 flex items-center justify-center text-[14px] uppercase font-black text-[#0052cc] italic group-hover:border-[#0052cc]/40">
                               {candidate.username.charAt(0)}
                             </div>
                           )}
                           <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
                         </div>
                       </td>
                       <td className="p-6">
                         <div className="text-[14px] font-black text-white italic tracking-tighter uppercase">{candidate.username}</div>
                         <div className="text-[10px] font-bold text-white/20 tracking-wider mt-1">{candidate.email}</div>
                       </td>
                       <td className="p-6">
                         <span className="text-[11px] font-mono font-black text-white/40 tracking-[0.2em]">{candidate.registerNumber || 'UNASSIGNED'}</span>
                       </td>
                       <td className="p-6">
                          <div className="flex items-center gap-2">
                             <div className={`w-1.5 h-1.5 rounded-full ${candidate.completedCount > 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                             <span className={`text-[9px] font-black uppercase tracking-widest ${candidate.completedCount > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                               {candidate.completedCount > 0 ? 'SYNCHRONIZED' : 'PENDING_TASKS'}
                             </span>
                          </div>
                       </td>
                       <td className="p-6 pr-10 text-right">
                         <div className="flex items-center justify-end gap-3opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleSendReminder(candidate.id, candidate.username)}
                             disabled={nudgeStatus[candidate.id] === 'loading' || nudgeStatus[candidate.id] === 'success'}
                             className={`jira-btn-primary !py-2 !px-5 text-[9px] min-w-[120px] transition-all ${
                               nudgeStatus[candidate.id] === 'success' ? '!bg-emerald-500/20 !text-emerald-500 !border-emerald-500/40' : ''
                             }`}
                           >
                             {nudgeStatus[candidate.id] === 'loading' ? 'SENDING...' : nudgeStatus[candidate.id] === 'success' ? 'TRANSMITTED' : 'REMIND STUDENT'}
                           </button>
                           <button className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all">
                             <Mail size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             )}
           </div>
        </div>
      </main>
    </div>
  );
}
