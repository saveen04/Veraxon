'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ShieldCheck, 
  Users, 
  ClipboardList, 
  Activity, 
  History, 
  LogOut, 
  Settings,
  BrainCircuit,
  LayoutDashboard
} from 'lucide-react';

export default function StudentDashboard() {
  const { user, userData, loading: authLoading, logOut } = useAuth();
  const router = useRouter();
  const [exams, setExams] = useState([]);
  const [stats, setStats] = useState({ attempts: 0, integrity: 98, tier: 'Lvl 1', rank: 'Top 5%' });
  const [loading, setLoading] = useState(true);
  const [showSessionsSheet, setShowSessionsSheet] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    
    const fetchDashboardData = async () => {
      if (!user || !userData) return;
      try {
        setLoading(true);
        
        // Fetch exams filtered by college and department (Institutional Partitioning)
        const examsQuery = query(
          collection(db, 'tests'),
          where('active', '==', true),
          where('collegeName', '==', userData.collegeName),
          where('department', '==', userData.department)
        );
        const examsSnap = await getDocs(examsQuery);
        setExams(examsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch student's own attempts for stats
        const submissionsQuery = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid),
          orderBy('completedAt', 'desc'),
          limit(10)
        );
        const submissionsSnap = await getDocs(submissionsQuery);
        const submissions = submissionsSnap.docs.map(doc => doc.data());
        
        if (submissions.length > 0) {
          const avgIntegrity = submissions.reduce((acc, s) => acc + (s.integrityScore || 0), 0) / submissions.length;
          setStats(prev => ({
            ...prev,
            attempts: submissions.length,
            integrity: Math.round(avgIntegrity)
          }));
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user && userData) fetchDashboardData();
  }, [user, userData, authLoading, router]);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-blue-600 animate-pulse font-black tracking-widest uppercase font-sans text-xs">Initializing Terminal Sync...</div>
    </div>
  );

  return (
    <div className="relative min-h-screen bg-[#0b0e14] text-[#c9d1d9] flex font-sans selection:bg-[#0052cc] selection:text-white">

      {/* 1. JIRA-Inspired Left Sidebar */}
      <aside className="w-64 border-r border-[#22272e] bg-[#161a22] flex flex-col justify-between p-5 shrink-0 relative z-20">
        <div className="space-y-6">

          {/* Brand Logo Header */}
          <Link href="/" className="flex items-center gap-3 group px-2 py-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052cc] to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-[#0052cc]/20">
              V
            </div>
            <span className="text-sm font-black tracking-tighter text-white uppercase italic">
              Veraxon Portal
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <NavItem icon={<LayoutDashboard className="w-4 h-4 text-[#0052cc]" />} label="Overview" active />
            <NavItem icon={<ClipboardList className="w-4 h-4" />} label="Assessments" onClick={() => setShowSessionsSheet(true)} />
            <NavItem icon={<Activity className="w-4 h-4" />} label="Analytics" />
            <NavItem icon={<History className="w-4 h-4" />} label="My History" onClick={() => router.push('/results')} />
            <NavItem icon={<Settings className="w-4 h-4" />} label="Settings" />
          </nav>
        </div>

        {/* Sidebar Profile & Sign Out Footer */}
        <div className="space-y-4 pt-4 border-t border-[#22272e]">
          <div className="flex items-center gap-3 px-1">
            <div className="w-8 h-8 rounded bg-[#0052cc] text-white flex items-center justify-center font-black text-xs select-none">
              {userData?.name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate text-white uppercase tracking-tight">{userData?.name || 'Anonymous Node'}</p>
              <p className="text-[8px] text-white/40 tracking-[0.2em] uppercase font-black mt-0.5">{userData?.department || 'Guest Access'}</p>
            </div>
          </div>

          <button
            onClick={logOut}
            className="w-full flex items-center gap-2 text-[9px] font-black text-white/40 hover:text-red-500 transition-colors uppercase pt-1 tracking-widest"
          >
            <LogOut className="w-3.5 h-3.5" />
            Purge Session
          </button>
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto relative bg-[#0b0e14]">

        {/* Glow Influences */}
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#0052cc]/5 rounded-full blur-[100px] pointer-events-none z-0" />

        {/* Sub-Header Toolbar */}
        <header className="px-8 py-4 border-b border-[#22272e] bg-[#161a22]/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Institutional Node / Student Dashboard</span>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-md">
            <span className="text-[8px] font-black text-emerald-500 tracking-widest uppercase">Neural Link Sync: Active</span>
          </div>
        </header>

        {/* Main Workspace */}
        <main className="flex-grow p-10 space-y-10 z-10">

          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">
                Candidate Terminal
              </h1>
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-2">
                Scanning Assessment Vectors for {userData?.collegeName || 'Institutional Core'}
              </p>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Attempts" value={stats.attempts} sub="History Log" icon={<ClipboardList className="text-[#0052cc]" />} />
            <StatCard label="Integrity Guard" value={`${stats.integrity}%`} sub="Neural Baseline" icon={<ShieldCheck className="text-emerald-500" />} />
            <StatCard label="Institutional Rank" value={stats.rank} sub="Peer percentile" icon={<Activity className="text-purple-500" />} />
            <StatCard label="System Level" value={stats.tier} sub="Verified Badge" icon={<Users className="text-amber-500" />} />
          </div>

          {/* Active Assessments Feature */}
          <div className="p-10 rounded-2xl border border-white/5 bg-[#161a22] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
               <BrainCircuit className="w-32 h-32 text-[#0052cc]" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2 italic">Neural Enclourse Deployment</h3>
              <p className="text-xs text-white/40 max-w-sm mb-8 leading-relaxed font-medium">Verify your surveillance environment and initiate active assessment protocols.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {exams.length > 0 ? exams.map((exam) => (
                  <div key={exam.id} className="p-6 rounded-xl bg-black border border-white/5 flex items-center justify-between hover:border-[#0052cc]/40 transition-all">
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">{exam.title}</h4>
                      <div className="flex gap-4 mt-1.5 opacity-40">
                         <span className="text-[9px] font-black uppercase tracking-widest">{exam.duration} MIN</span>
                         <span className="text-[9px] font-black uppercase tracking-widest">{exam.questions?.length || 0} VECTORS</span>
                      </div>
                    </div>
                    <Link href={`/exam/${exam.id}`} className="px-4 py-2 rounded-lg bg-[#0052cc] hover:bg-[#0052cc]/80 text-white text-[9px] font-black uppercase tracking-[0.2em] transition-all">
                      Initiate
                    </Link>
                  </div>
                )) : (
                  <div className="col-span-2 py-10 text-center border border-white/5 border-dashed rounded-xl">
                    <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] italic">No active assessment vectors detected across institutional link.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}

function StatCard({ label, value, sub, icon }) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-[#161a22] flex flex-col justify-between h-40 group hover:border-white/10 transition-all">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-black border border-white/10 flex items-center justify-center group-hover:border-[#0052cc]/30 transition-all">
          {icon}
        </div>
        <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div>
        <div className="text-3xl font-black text-white mb-1 tracking-tighter italic">{value}</div>
        <div className="text-[9px] font-bold text-white/10 uppercase tracking-widest">{sub}</div>
      </div>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl transition-all duration-300 font-black text-[10px] uppercase tracking-[0.2em] ${active ? "bg-[#0052cc] text-white shadow-lg shadow-[#0052cc]/20" : "text-white/30 hover:text-white hover:bg-white/5"}`}
    >
      {icon}
      {label}
    </button>
  );
}
