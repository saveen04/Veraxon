'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  ShieldCheck, Users, BarChart2, TrendingUp, AlertTriangle,
  Download, Search, ChevronRight, Activity, Trophy, ShieldAlert
} from 'lucide-react';

function PageSpinner() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );
}

function Skel({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#10121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 },
};

export default function StaffStatsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [apiData,   setApiData]   = useState(null);
  const [fetching,  setFetching]  = useState(true);
  const [error,     setError]     = useState('');
  const [search,    setSearch]    = useState('');

  /* ── Auth guard ─────────────────────────────────────────────── */
  useEffect(() => {
    if (loading) return;
    if (!user || !userData) { router.replace('/login'); return; }
    if (userData.role === 'student') router.replace('/student/stats');
  }, [loading, user, userData, router]);

  /* ── Fetch stats ─────────────────────────────────────────────── */
  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role !== 'staff' && userData.role !== 'admin') return;

    (async () => {
      try {
        const params = new URLSearchParams({
          createdBy:   user.uid,
          collegeName: userData.collegeName || '',
        });
        const res  = await fetch(`/api/stats?${params}`);
        const data = await res.json();
        if (data.success) setApiData(data);
        else setError('No analytics data available.');
      } catch {
        setError('Failed to load analytics.');
      } finally {
        setFetching(false);
      }
    })();
  }, [loading, user, userData]);

  /* ── CSV export ─────────────────────────────────────────────── */
  const handleExportCSV = () => {
    if (!apiData?.recentActivity) return;
    const headers = ['Student', 'Exam', 'Violation Type', 'Severity', 'Date'];
    const rows = apiData.recentActivity.map(a => [
      a.studentName, a.examTitle, a.type, a.severity,
      a.timestamp ? new Date(a.timestamp).toLocaleDateString() : 'N/A',
    ]);
    const csv  = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `veraxon-stats-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <PageSpinner />;
  if (!user || !userData) return <PageSpinner />;
  if (userData.role === 'student') return <PageSpinner />;

  const s = apiData?.stats;
  const c = apiData?.charts;

  const filteredActivity = (apiData?.recentActivity ?? []).filter(a =>
    !search ||
    (a.studentName || '').toLowerCase().includes(search.toLowerCase()) ||
    (a.examTitle   || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="staff" />
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 xl:p-10 custom-scrollbar">

          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-6">
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Intelligence</p>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 mt-1">
                <Activity className="w-7 h-7 text-[#0052cc]" /> Institutional Analytics
              </h1>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1.5">
                {userData.collegeName} · {userData.department}
              </p>
            </div>
            <button onClick={handleExportCSV} className="jira-btn-secondary !py-2.5 !px-5 flex items-center gap-2 text-[11px]">
              <Download size={14} /> Export CSV
            </button>
          </header>

          {error && (
            <div className="py-20 text-center border border-dashed border-white/[0.06] rounded-2xl">
              <Activity className="w-12 h-12 text-white/10 mx-auto mb-4" />
              <p className="text-[13px] font-bold text-white/30">{error}</p>
            </div>
          )}

          {fetching && !error && (
            <>
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="jira-premium-card !p-5"><div className="flex items-center gap-4 mb-3"><Skel className="w-11 h-11" /><Skel className="h-3 w-20" /></div><Skel className="h-8 w-16" /></div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="col-span-2 jira-premium-card !p-6"><Skel className="h-[220px]" /></div>
                <div className="jira-premium-card !p-6"><Skel className="h-[220px]" /></div>
              </div>
            </>
          )}

          {!fetching && !error && s && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Candidates',       value: s.candidatesCount,   icon: <Users size={16} />,         color: 'text-[#0052cc]',   bg: 'bg-[#0052cc]/10' },
                  { label: 'Assessments',       value: s.testsCount,        icon: <BarChart2 size={16} />,     color: 'text-violet-400',  bg: 'bg-violet-400/10' },
                  { label: 'Avg Score',         value: `${s.avgScore}%`,    icon: <TrendingUp size={16} />,    color: 'text-amber-400',   bg: 'bg-amber-400/10' },
                  { label: 'Integrity',         value: `${s.integrityScore}%`, icon: <ShieldCheck size={16}/>, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
                ].map((item, i) => (
                  <motion.div key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                    className="jira-premium-card !p-5 flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${item.bg} ${item.color}`}>{item.icon}</div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{item.label}</p>
                      <p className={`text-2xl font-black italic ${item.color}`}>{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              {c?.scoreDistribution?.length > 0 && (
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="col-span-2 jira-premium-card !p-6">
                    <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Score Distribution</p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={c.scoreDistribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                          <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} domain={[0,100]} unit="%" />
                          <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Score']} />
                          <Bar dataKey="score" fill="#0052cc" radius={[4,4,0,0]} maxBarSize={28} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="jira-premium-card !p-6">
                    <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Pass Rate</p>
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={c.passRate} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value"
                            label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`} labelLine={false} style={{ fontSize: 9 }}>
                            {c.passRate.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip {...TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Violation breakdown */}
              {c?.violationBreakdown?.length > 0 && (
                <div className="jira-premium-card !p-6 mb-8">
                  <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Violation Types</p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={c.violationBreakdown} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                        <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} allowDecimals={false} />
                        <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={9} axisLine={false} tickLine={false} width={88} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="count" fill="#ef4444" radius={[0,4,4,0]} maxBarSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Activity table */}
              <div className="bg-[#0a0c10] border border-white/[0.06] rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-4">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="text" placeholder="Search violations…" value={search} onChange={e => setSearch(e.target.value)}
                      className="jira-input !pl-10 !py-2 !text-[11px]" />
                  </div>
                  <span className="text-[10px] text-white/30 font-black uppercase tracking-widest ml-auto">
                    {filteredActivity.length} events
                  </span>
                </div>

                <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-white/[0.04] bg-white/[0.01]">
                  {['Student','Assessment','Type','Severity','Time'].map(h => (
                    <span key={h} className="text-[9px] font-black uppercase tracking-widest text-white/25">{h}</span>
                  ))}
                </div>

                <div className="divide-y divide-white/[0.03]">
                  {filteredActivity.length === 0 ? (
                    <div className="py-14 text-center">
                      <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-3" />
                      <p className="text-[11px] text-white/20 uppercase tracking-widest">No violations recorded</p>
                    </div>
                  ) : (
                    filteredActivity.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                        className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 px-6 py-3.5 hover:bg-white/[0.02] transition-colors items-center">
                        <p className="text-[12px] font-bold text-white truncate">{a.studentName}</p>
                        <p className="text-[11px] text-white/55 truncate">{a.examTitle}</p>
                        <p className="text-[10px] font-bold text-white/60 capitalize">{a.type?.replace(/_/g, ' ')}</p>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border w-fit ${
                          a.severity === 'breach' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}>{a.severity}</span>
                        <p className="text-[9px] text-white/25">
                          {a.timestamp ? new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
