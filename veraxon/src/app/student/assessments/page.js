'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationDropdown from '@/components/NotificationDropdown';
import { 
  Play, 
  Settings, 
  Search,
  ChevronRight,
  QrCode,
  Link as LinkIcon,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function StudentAssessmentsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState('');
  const [entryMode, setEntryMode] = useState('manual'); // 'qr' or 'manual'

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex font-inter text-white selection:bg-[#0052cc]">
      <Sidebar role="student" />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex-1">
             <h2 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Assessments</h2>
          </div>

          <div className="flex items-center gap-6">
            <button className="bg-[#0052cc] text-white px-6 py-2.5 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0042a3] transition-all shadow-[0_0_20px_rgba(0,82,204,0.3)]">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Join Session</span>
            </button>
            <div className="flex items-center gap-4 text-white/30">
               <button className="p-2 hover:text-white transition-colors">
                  <Activity className="w-5 h-5" />
               </button>
               <NotificationDropdown />
               <button className="p-2 hover:text-white transition-colors">
                  <Settings className="w-5 h-5" />
               </button>
            </div>
          </div>
        </header>

        {/* Page Title */}
        <div className="mb-16">
           <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3 h-3 text-[#0052cc]" />
              <span className="text-[8px] font-black text-[#0052cc] uppercase tracking-[0.3em]">Terminal Online</span>
           </div>
           <h1 className="text-7xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
             Assessments
           </h1>
           <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Institutional Assessment & Integrity Terminal</p>
        </div>

        {/* Central Card */}
        <div className="flex flex-col items-center justify-center py-10">
           <motion.div 
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-full max-w-2xl jira-card bg-[#0a0a0a] border border-white/5 !p-16 flex flex-col items-center text-center shadow-2xl"
           >
              <div className="w-20 h-20 rounded-3xl bg-[#0052cc]/10 flex items-center justify-center text-[#0052cc] mb-8">
                 <LinkIcon size={32} />
              </div>

              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">Assessment Entry</h3>
              <p className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em] mb-12">Scan code or enter the secure token below.</p>

              <div className="grid grid-cols-2 gap-4 w-full mb-8">
                 <button 
                  onClick={() => setEntryMode('qr')}
                  className={`flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border transition-all ${entryMode === 'qr' ? 'bg-white/5 border-[#0052cc] text-[#0052cc]' : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/10'}`}
                 >
                    <QrCode size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Scan QR</span>
                 </button>
                 <button 
                  onClick={() => setEntryMode('manual')}
                  className={`flex flex-col items-center justify-center gap-4 p-8 rounded-2xl border transition-all ${entryMode === 'manual' ? 'bg-white/5 border-[#0052cc] text-[#0052cc]' : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/10'}`}
                 >
                    <LinkIcon size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Manual</span>
                 </button>
              </div>

              <div className="w-full space-y-4">
                 <input 
                  type="text" 
                  placeholder="Enter Secure Token"
                  value={sessionToken}
                  onChange={(e) => setSessionToken(e.target.value.toUpperCase())}
                  className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-6 text-center text-xl font-black uppercase tracking-[0.5em] text-white placeholder:text-white/10 focus:border-[#0052cc]/40 outline-none transition-all"
                 />
                 <button className="w-full bg-[#0052cc] text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#0042a3] transition-all mt-4 border border-[#0052cc]/30 shadow-[0_0_30px_rgba(0,82,204,0.2)]">
                   Authorize Entry <ChevronRight size={18} />
                 </button>
              </div>
           </motion.div>
        </div>
      </main>
    </div>
  );
}
