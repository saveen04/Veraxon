'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ShieldCheck, Users, BarChart2, TrendingUp, AlertTriangle,
  Download, Search, ChevronRight, Activity, Trophy, Target
} from 'lucide-react';

const PIE_COLORS = ['#10b981', '#ef4444', '#f59e0b'];

export default function StaffStatsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && (!user || (userData && userData.role !== 'staff' && userData.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!userData) return;
      try {
        // Use simple queries to avoid composite index requirement
        const q = query(
          collection(db, 'submissions'),
          where('collegeName', '==', userData?.collegeName || '')
        );
        const querySnapshot = await getDocs(q);
        const all = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

        // Filter by department client-side to avoid 2-field composite index
        const filtered = all.filter((s) =>
          !userData?.department || s.department === userData.department
        );

        // Sort by completedAt client-side
        filtered.sort((a, b) => {
          const aT = a.completedAt?.toMillis?.() || 0;
          const bT = b.completedAt?.toMillis?.() || 0;
          return bT - aT;
        });

        setSubmissions(filtered);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userData) fetchStats();
  }, [userData]);

  const completed = submissions.filter((s) => s.status === 'completed' || s.status === 'disqualified');
  const passed = completed.filter((s) => (s.score || 0) >= 40).length;
  const avg = completed.length
    ? (completed.reduce((a, b) => a + (b.score || 0), 0) / completed.length).toFixed(1)
    : 0;
  const totalViolations = submissions.reduce((a, b) => a + (b.totalViolations || 0), 0);

  const pieData = [
    { name: 'Passed', value: passed },
    { name: 'Failed', value: Math.max(0, completed.length - passed) },
  ].filter((d) => d.value > 0);

  // Build per-student score chart data (last 20)
  const scoreData = completed.slice(0, 20).map((s) => ({
    name: (s.userName || 'Anon').substring(0, 8),
    score: parseFloat((s.score || 0).toFixed(1)),
  })).reverse();

  const filtered = submissions.filter((s) =>
    !searchQuery ||
    (s.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.examTitle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExportCSV = () => {
    const headers = ['Name', 'Score', 'Status', 'Violations', 'Date'];
    const rows = submissions.map((s) => [
      s.userName || 'Anonymous',
      (s.score || 0).toFixed(1) + '%',
      s.status || 'unknown',
      s.totalViolations || 0,
      s.completedAt?.toDate ? s.completedAt.toDate().toLocaleDateString() : 'N/A',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veraxon-stats-${userData?.department || 'dept'}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-inter">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex font-inter text-white selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />
      <Sidebar role="staff" />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Intelligence</span>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 mt-1">
              <Activity className="w-8 h-8 text-[#0052cc]" /> Institutional Analytics
            </h1>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">
              {userData?.collegeName} • {userData?.department}
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="jira-btn-secondary !py-2.5 !px-5 flex items-center gap-2 text-[10px]"
          >
            <Download size={14} /> Export CSV
          </button>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Submissions', value: submissions.length, icon: <BarChart2 size={16} />, color: 'text-[#0052cc]', bg: 'bg-[#0052cc]/10' },
            { label: 'Passed', value: passed, icon: <Trophy size={16} />, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Avg Score', value: `${avg}%`, icon: <TrendingUp size={16} />, color: 'text-purple-400', bg: 'bg-purple-400/10' },
            { label: 'Total Violations', value: totalViolations, icon: <AlertTriangle size={16} />, color: totalViolations > 0 ? 'text-red-400' : 'text-emerald-400', bg: totalViolations > 0 ? 'bg-red-400/10' : 'bg-emerald-400/10' },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="jira-premium-card !p-5 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{s.label}</p>
                <p className={`text-2xl font-black italic ${s.color}`}>{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        {completed.length > 0 && (
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-2 jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Score Distribution</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={scoreData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#161a22', border: '1px solid #30363d', borderRadius: '8px' }} />
                    <Bar dataKey="score" fill="#0052cc" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Pass Rate</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Legend iconSize={10} iconType="circle" formatter={(val) => (
                      <span className="text-[10px] text-white/60 uppercase font-bold">{val}</span>
                    )} />
                    <Tooltip contentStyle={{ backgroundColor: '#161a22', border: '1px solid #30363d', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Candidates Table */}
        <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="jira-input !pl-10 !py-2 !text-[11px]"
              />
            </div>
            <span className="text-[10px] text-white/30 uppercase font-black tracking-widest ml-auto">
              {filtered.length} records
            </span>
          </div>

          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01]">
            {['Candidate', 'Score', 'Status', 'Violations', 'Date'].map((h) => (
              <span key={h} className="text-[9px] font-black uppercase tracking-widest text-white/30">{h}</span>
            ))}
          </div>

          <div className="divide-y divide-white/[0.03]">
            {filtered.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[11px] text-white/20 uppercase tracking-widest">No data available for this department.</p>
              </div>
            ) : (
              filtered.map((sub) => {
                const score = sub.score || 0;
                const passed = score >= 40;
                const completedAt = sub.completedAt?.toDate?.() || new Date();

                return (
                  <div key={sub.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center">
                    <div>
                      <p className="font-black text-sm text-white">{sub.userName || 'Anonymous'}</p>
                      <p className="text-[9px] text-white/30 mt-0.5">{sub.userId?.substring(0, 10)}...</p>
                    </div>
                    <p className={`font-black text-sm ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {score.toFixed(1)}%
                    </p>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border w-fit ${
                      sub.status === 'disqualified' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {sub.status === 'disqualified' ? 'Disqualified' : passed ? 'Passed' : 'Failed'}
                    </span>
                    <span className={`text-sm font-black ${(sub.totalViolations || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {sub.totalViolations || 0}
                    </span>
                    <span className="text-[10px] text-white/30">
                      {completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
      <Footer className="ml-64" />
    </div>
  );
}
