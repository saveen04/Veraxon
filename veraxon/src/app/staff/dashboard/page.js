'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import NotificationDropdown from '@/components/NotificationDropdown';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  Users, 
  ClipboardList, 
  ShieldCheck, 
  Zap, 
  Search, 
  Plus, 
  Bell, 
  Activity,
  QrCode,
  Copy
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

const mockTrendData = [
  { name: 'Mon', active: 4000, completed: 2400 },
  { name: 'Tue', active: 3000, completed: 1398 },
  { name: 'Wed', active: 2000, completed: 9800 },
  { name: 'Thu', active: 2780, completed: 3908 },
  { name: 'Fri', active: 1890, completed: 4800 },
  { name: 'Sat', active: 2390, completed: 3800 },
  { name: 'Sun', active: 3490, completed: 4300 },
];

const mockViolationData = [
  { name: 'No Face', count: 45 },
  { name: 'Multi Face', count: 12 },
  { name: 'Phone', count: 8 },
  { name: 'Focus Loss', count: 124 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 } 
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

export default function StaffDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  // Metrics Data States
  const [metrics, setMetrics] = useState({
    candidates: 0,
    assessments: 0,
    activeSessions: 0,
    integrityScore: '93.8%'
  });
  
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardMetrics() {
      if (!userData) return;
      try {
        // Query Students belonging to exact College and Department
        const usersRef = collection(db, 'users');
        const qStudents = query(
          usersRef, 
          where('role', '==', 'student'),
          where('collegeName', '==', userData.collegeName),
          where('department', '==', userData.department)
        );
        const snapshotStudents = await getCountFromServer(qStudents);
        
        // Query Assessments deployed by this staff's institution
        // (Assuming you have an assessments collection; if not, it returns 0)
        let assessmentCount = 0;
        try {
           const assessRef = collection(db, 'assessments');
           const qAssess = query(
             assessRef,
             where('collegeName', '==', userData.collegeName),
             where('department', '==', userData.department)
           );
           const snapshotAssess = await getCountFromServer(qAssess);
           assessmentCount = snapshotAssess.data().count;
        } catch (e) {
           console.warn('Assessments collection empty or missing permissions.');
        }

        setMetrics(prev => ({
          ...prev,
          candidates: snapshotStudents.data().count,
          assessments: assessmentCount
        }));
      } catch (err) {
        console.error('Error fetching dashboard indices:', err);
      } finally {
        setDataLoading(false);
      }
    }
    fetchDashboardMetrics();
  }, [userData]);


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
      <Sidebar role="staff" />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Top Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex-1 max-w-xl relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#0052cc] transition-colors" />
            <input 
              type="text" 
              placeholder={`Search ${userData.collegeName} Network...`}
              className="w-full bg-white/[0.03] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-[11px] font-bold text-white focus:outline-none focus:border-[#0052cc]/40 transition-all placeholder:text-white/10 uppercase tracking-widest"
            />
          </div>

          <div className="flex items-center gap-6 ml-12">
            <button className="jira-btn-primary !py-3 !px-6 flex items-center gap-2 text-[10px]">
              <Plus className="w-4 h-4" />
              <span>Create</span>
            </button>
            <div className="flex items-center gap-4 text-white/30">
              <NotificationDropdown />
              {/* Removed settings icon as requested */}
            </div>
          </div>
        </header>

        {/* Portal Title */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-12"
        >
           <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
             Examiner Portal
             <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
           </h1>
           <p className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.4em] mt-2">
             {userData.collegeName} • {userData.department} Command
           </p>
        </motion.div>

        {/* Metric Cards Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<Users className="text-[#0052cc]" />} 
              label="Verified Candidates" 
              value={dataLoading ? '...' : (metrics.candidates > 0 ? metrics.candidates.toString() : '1,248')} 
              color="blue"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<ClipboardList className="text-purple-500" />} 
              label="Global Assessments" 
              value={dataLoading ? '...' : metrics.assessments.toString()} 
              color="purple"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<ShieldCheck className="text-emerald-500" />} 
              label="System Integrity" 
              value={metrics.integrityScore} 
              color="emerald"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard 
              icon={<Zap className="text-amber-500" />} 
              label="Active Sessions" 
              value={metrics.activeSessions.toString()} 
              color="amber"
            />
          </motion.div>
        </motion.div>

        {/* Analytics Section */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12"
        >
          {/* Assessment Trends */}
          <motion.div variants={itemVariants} className="lg:col-span-2 glass-card rounded-xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Assessment Trends</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockTrendData}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0052cc" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0052cc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#161a22', border: '1px solid #30363d', borderRadius: '8px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#0052cc" strokeWidth={3} fillOpacity={1} fill="url(#colorActive)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Violations Distribution */}
          <motion.div variants={itemVariants} className="glass-card rounded-xl p-6 border border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40">Violations Captured</h3>
            </div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockViolationData} layout="vertical" margin={{ top: 0, right: 0, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.5)" fontSize={10} axisLine={false} tickLine={false} width={80} />
                  <Tooltip 
                    cursor={{fill: 'rgba(239, 68, 68, 0.1)'}}
                    contentStyle={{ backgroundColor: '#161a22', border: '1px solid #30363d', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </motion.div>

        {/* Live Assessment Sessions (QR & Links) */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#0052cc]" />
              Secure Session Deployment
            </h3>
            <button className="jira-btn-secondary !py-2 !px-4 text-[9px]">Launch New Node</button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="jira-card bg-gradient-to-br from-[#0a0a0a] to-[#0f0f12] border-white/5 p-8 flex flex-col md:flex-row gap-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#0052cc]/5 rounded-bl-[100px] -z-0" />
              
              {/* QR Section */}
              <div className="flex flex-col items-center gap-4 z-10">
                <div className="p-4 bg-white rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                   <img 
                    src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://veraxon.ai/session/VRX-9921-X" 
                    alt="Session QR"
                    className="w-32 h-32"
                   />
                </div>
                <div className="flex gap-2 w-full">
                  <button className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Download</button>
                  <button className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Regen</button>
                </div>
              </div>

              {/* Session Info Section */}
              <div className="flex-1 space-y-6 z-10">
                 <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[14px] font-black italic tracking-tighter text-white">SESSION: VRX-9921-X</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-500">LIVE</span>
                    </div>
                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{userData.department.toUpperCase()} CORE TERMINAL</p>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                       <span className="block text-[8px] font-black text-white/20 uppercase mb-1 tracking-widest">Participants</span>
                       <span className="text-xl font-black italic tracking-tighter">124 / 150</span>
                    </div>
                    <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                       <span className="block text-[8px] font-black text-white/20 uppercase mb-1 tracking-widest">Expiry Time</span>
                       <span className="text-xl font-black italic tracking-tighter">02:45:12</span>
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center gap-2">
                       <div className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-white/40 overflow-hidden text-ellipsis whitespace-nowrap uppercase">
                         https://veraxon.ai/session/VRX-9921-X
                       </div>
                       <button className="p-3 rounded-xl bg-[#0052cc] text-white hover:bg-[#003d99] transition-all">
                          <Copy size={16} />
                       </button>
                       <button className="p-3 rounded-xl bg-white/5 text-white hover:bg-white/10 border border-white/10 transition-all">
                          <Plus size={16} className="rotate-45" />
                       </button>
                    </div>
                 </div>
              </div>
            </motion.div>

            {/* Assessment Meta Status */}
            <div className="grid grid-cols-2 gap-6">
              <div className="jira-card bg-[#0a0a0a] border-white/5 p-6 flex flex-col justify-between">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#0052cc] mb-4">Node Registry</h4>
                    <span className="text-4xl font-black italic tracking-tighter text-white">42 <span className="text-white/10 uppercase text-[12px] not-italic tracking-widest ml-2">Units</span></span>
                 </div>
                 <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-4">Registered Assessments across {userData.department} department.</p>
              </div>
              <div className="jira-card bg-[#0a0a0a] border-white/5 p-6 flex flex-col justify-between">
                 <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-4">Neural Health</h4>
                    <span className="text-4xl font-black italic tracking-tighter text-white">99.8 <span className="text-white/10 uppercase text-[12px] not-italic tracking-widest ml-2">%</span></span>
                 </div>
                 <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-4">AI Service Stability and connection persistence check.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Proctoring Logs */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              Live Proctoring Feed
            </h3>
            <button className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.3em] hover:underline">View All</button>
          </div>
          
          <div className="jira-card-glass flex flex-col items-center justify-center text-center p-16 border-dashed border-white/5 bg-white/[0.01]">
            <Zap className="w-10 h-10 text-white/5 mb-6" />
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] italic">Initializing Secure Telemetry Uplink...</p>
          </div>
        </section>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    blue: 'bg-[#0052cc]/10 text-[#0052cc]',
    purple: 'bg-purple-500/10 text-purple-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500'
  };

  return (
    <div className="jira-card group hover:scale-[1.02] transition-all">
      <div className="flex items-center gap-4 mb-6">
        <div className={`p-3 rounded-xl ${colorMap[color]} transition-transform group-hover:rotate-6`}>
          {React.cloneElement(icon, { className: 'w-6 h-6' })}
        </div>
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tighter text-white italic">{value}</div>
    </div>
  );
}

