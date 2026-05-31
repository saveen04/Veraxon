'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationDropdown from '@/components/NotificationDropdown';
import { 
  Search, 
  Play, 
  ShieldCheck, 
  History, 
  Zap, 
  Trophy,
  Activity
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter">
      <div className="ambient-matrix-bg" />
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex font-inter">
      <div className="ambient-matrix-bg" />
      
      {/* Premium Jira Sidebar */}
      <Sidebar role="student" />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex-1 max-w-xl">
             {/* Dynamic Overview Title */}
             <h2 className="text-[10px] font-black uppercase text-white/40 tracking-[0.4em]">Overview</h2>
          </div>

          <div className="flex items-center gap-6">
            <button className="jira-btn-primary !py-2.5 !px-6 flex items-center gap-2 text-[10px] hover:shadow-[0_0_20px_rgba(0,82,204,0.4)]">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Join Session</span>
            </button>
             <div className="flex items-center gap-4 text-white/30">
               <button className="p-2 hover:text-white transition-colors">
                  <Activity className="w-5 h-5" />
               </button>
               <NotificationDropdown />
            </div>
          </div>
        </header>

        {/* Page Title & Breadcrumb */}
        <div className="mb-12">
           <div className="flex items-center gap-2 mb-3">
              <Activity className="w-3 h-3 text-[#0052cc]" />
              <span className="text-[8px] font-black text-[#0052cc] uppercase tracking-[0.3em]">Terminal Online</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
             Overview
           </h1>
           <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] mt-2">Institutional Assessment & Integrity Terminal</p>
        </div>

        {/* Dashboard Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <StudentStatCard label="Total Attempts" value="0" icon={<History className="text-[#0052cc]" />} />
           <StudentStatCard label="Integrity" value="98%" icon={<ShieldCheck className="text-emerald-500" />} />
           <StudentStatCard label="Tier" value="Lvl 1" icon={<Zap className="text-purple-500" />} />
           <StudentStatCard label="Rank" value="Top 5%" icon={<Trophy className="text-amber-500" />} />
        </div>

        {/* Large Central Action Card */}
        <section className="mt-12">
           <div className="jira-card !p-20 flex flex-col items-center justify-center text-center relative overflow-hidden group">
              {/* Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#0052cc]/10 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
              
              <Zap className="w-16 h-16 text-amber-500 mb-8 animate-pulse" />
              
              <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4">Integrity Guard Active</h3>
              <p className="text-sm text-white/40 font-bold max-w-lg leading-relaxed mb-12 uppercase tracking-widest">
                Your neural integrity is being tracked across all assessment sessions. A consistent high score builds your professional reputation.
              </p>
              
              <button className="jira-btn-primary !py-5 !px-12 text-[11px] hover:scale-105">
                Join New Session
              </button>
           </div>
        </section>

        {/* Footer Branding */}
        <footer className="mt-auto py-16 flex flex-col items-center gap-5 relative z-10">
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-4" />
          <img 
            src="/logov-removebg-preview.png" 
            alt="Veraxon Registry" 
            className="h-10 opacity-20 hover:opacity-100 transition-opacity duration-700 cursor-default grayscale"
          />
          <p className="text-[8px] font-black text-white/5 uppercase tracking-[0.6em] mt-2">Verified Candidate Terminal</p>
        </footer>
      </main>
    </div>
  );
}

function StudentStatCard({ label, value, icon }) {
  return (
    <div className="jira-card !p-8 flex items-center gap-8 group">
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 transition-transform group-hover:scale-110">
        {React.cloneElement(icon, { className: 'w-6 h-6' })}
      </div>
      <div>
        <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">{label}</div>
        <div className="text-2xl font-black text-white italic">{value}</div>
      </div>
    </div>
  );
}
