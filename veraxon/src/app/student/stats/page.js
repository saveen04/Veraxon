'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ReferenceLine
} from 'recharts';
import {
  TrendingUp, ShieldCheck, ShieldAlert, Trophy,
  BarChart2, AlertTriangle, ChevronRight, Activity,
  Target, Award, Clock
} from 'lucide-react';

function Skel({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

function PageSpinner() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );
}

function StatCard({ icon, label, value, color, bg, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="jira-premium-card !p-5 flex items-center gap-4"
    >
      <div className={`p-3 rounded-xl ${bg} ${color} shrink-0`}>{icon}</div>
      <div>
        <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{label}</p>
        <p className={`text-2xl font-black italic leading-tight ${color}`}>{value}</p>
        {sub && <p className="text-[9px] text-white/25 mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

const TOOLTIP_STYLE = {
  contentStyle: { background: '#10121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 },
  labelStyle:   { color: 'rgba(255,255,255,0.5)' },
};

export default function StudentStatsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [stats,   setStats]   = useState(null);
  const [charts,  setCharts]  = useState(null);
  const [recent,  setRecent]  = useState([]);
  const [fetching,setFetching]= useState(true);
  const [error,   setError]   = useState('');

  /* ── Auth guard ─────────────────────────────────────────────── */
  useEffect(() => {
    if (loading) return;
    if (!user || !userData) { router.replace('/login'); return; }
    if (userData.role === 'staff' || userData.role === 'admin') {
      router.replace('/staff/stats');
    }
  }, [loading, user, userData, router]);

  /* ── Fetch from client-side Firestore (no Admin SDK needed) ─── */
  useEffect(() => {
    if (loading || !user) return;
    let cancelled = false;

    (async () => {
      try {
        const [subSnap, vSnap] = await Promise.all([
          getDocs(query(collection(db, 'submissions'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'infractions'), where('studentId', '==', user.uid))),
        ]);

        if (cancelled) return;

        const submissions = subSnap.docs
          .map(d => {
            const data = d.data();
            const score = data.percentage ?? data.score ?? 0;
            const completedAt = data.completedAt?.toDate?.() || data.lastUpdated?.toDate?.() || null;
            return {
              id:              d.id,
              examTitle:       data.examTitle || data.examId || 'Assessment',
              status:          data.status,
              score,
              passed:          score >= 40 && data.status !== 'disqualified',
              totalViolations: data.totalViolations ?? 0,
              completedAt:     completedAt?.toISOString() ?? null,
            };
          })
          .sort((a, b) => (b.completedAt || '') > (a.completedAt || '') ? 1 : -1);

        const completed = submissions.filter(s => s.status === 'completed' || s.status === 'disqualified');
        const passed    = completed.filter(s => s.passed).length;
        const failed    = completed.length - passed;
        const avgScore  = completed.length
          ? Number((completed.reduce((a, s) => a + s.score, 0) / completed.length).toFixed(1))
          : 0;
        const bestScore = completed.length ? Math.max(...completed.map(s => s.score)) : 0;
        const totalViols = submissions.reduce((a, s) => a + s.totalViolations, 0);

        // Violation breakdown
        const typeMap = {};
        vSnap.docs.forEach(d => {
          const t = d.data().type || 'unknown';
          typeMap[t] = (typeMap[t] || 0) + 1;
        });
        const violBreakdown = Object.entries(typeMap)
          .map(([name, count]) => ({ name: name.replace(/_/g, ' '), count }))
          .sort((a, b) => b.count - a.count);

        // Charts
        const trendData = [...completed].reverse().slice(-12).map((s, i) => ({
          name: `#${i + 1}`, score: s.score,
        }));

        const histogram = [
          { range: '0–20',   min: 0,  max: 20  },
          { range: '20–40',  min: 20, max: 40  },
          { range: '40–60',  min: 40, max: 60  },
          { range: '60–80',  min: 60, max: 80  },
          { range: '80–100', min: 80, max: 101 },
        ].map(b => ({
          range: b.range,
          count: completed.filter(s => s.score >= b.min && s.score < b.max).length,
        }));

        if (!cancelled) {
          setStats({ totalAttempts: submissions.length, completedCount: completed.length, passedCount: passed, failedCount: failed, avgScore, bestScore, totalViolations: totalViols, integrityScore: Math.max(0, 100 - totalViols * 5) });
          setCharts({ trendData, histogram, passRate: [{ name: 'Passed', value: passed, fill: '#10b981' }, { name: 'Failed', value: failed, fill: '#ef4444' }].filter(d => d.value > 0), violationBreakdown: violBreakdown });
          setRecent(submissions.slice(0, 10));
          if (submissions.length === 0) setError('No assessments completed yet. Take an assessment to see your analytics.');
        }
      } catch (e) {
        console.error('[StudentStats] error:', e.code, e.message);
        if (!cancelled) setError('Failed to load analytics. Please try again.');
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();

    return () => { cancelled = true; };
  }, [loading, user]);

  if (loading) return <PageSpinner />;
  if (!user || !userData) return <PageSpinner />;
  if (userData.role === 'staff' || userData.role === 'admin') return <PageSpinner />;

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden">
      <div className="ambient-matrix-bg opacity-15" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 xl:p-10 custom-scrollbar">

          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-6">
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Student Portal</p>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 mt-1">
                <Activity className="w-7 h-7 text-[#0052cc]" /> My Analytics
              </h1>
              <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1.5">
                {userData.collegeName} · {userData.department}
              </p>
            </div>
            <Link href="/results" className="jira-btn-secondary !py-2 !px-5 text-[11px] flex items-center gap-2">
              <BarChart2 size={13} /> View Results
            </Link>
          </header>

          {/* Error state */}
          {error && (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/[0.06] rounded-2xl text-center">
              <Activity className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-[13px] font-bold text-white/30 mb-4">{error}</p>
              <Link href="/student/assessments" className="jira-btn-primary !py-2.5 !px-6 text-[11px]">
                Take an Assessment
              </Link>
            </div>
          )}

          {/* Skeleton while loading */}
          {fetching && !error && (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="jira-premium-card !p-5">
                    <div className="flex items-center gap-4 mb-3"><Skel className="w-11 h-11" /><Skel className="h-3 w-24" /></div>
                    <Skel className="h-8 w-16" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="col-span-2 jira-premium-card !p-6"><Skel className="h-[220px]" /></div>
                <div className="jira-premium-card !p-6"><Skel className="h-[220px]" /></div>
              </div>
            </>
          )}

          {/* Content */}
          {!fetching && !error && stats && (
            <>
              {/* Stat cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={<BarChart2 size={17} />}     label="Total Attempts"  value={stats.totalAttempts}   color="text-[#0052cc]"   bg="bg-[#0052cc]/10" />
                <StatCard icon={<Trophy size={17} />}         label="Passed"          value={stats.passedCount}     color="text-emerald-400" bg="bg-emerald-400/10" sub={`${stats.failedCount} failed`} />
                <StatCard icon={<TrendingUp size={17} />}     label="Avg Score"       value={`${stats.avgScore}%`}  color="text-amber-400"   bg="bg-amber-400/10"  sub={`Best: ${stats.bestScore}%`} />
                <StatCard icon={<ShieldCheck size={17} />}    label="Integrity"       value={`${stats.integrityScore}%`} color="text-violet-400"  bg="bg-violet-400/10" sub={`${stats.totalViolations} violations`} />
              </div>

              {/* Charts row 1: trend + pass/fail */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

                {/* Score trend */}
                <div className="lg:col-span-2 jira-premium-card !p-6">
                  <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Score Trend</p>
                  {charts?.trendData?.length > 0 ? (
                    <div className="h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={charts.trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} unit="%" />
                          <Tooltip {...TOOLTIP_STYLE} formatter={v => [`${v}%`, 'Score']} />
                          <ReferenceLine y={40} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" label={{ value: "Pass", fill: "rgba(239,68,68,0.5)", fontSize: 8 }} />
                          <Line type="monotone" dataKey="score" stroke="#0052cc" strokeWidth={2.5} dot={{ fill: '#0052cc', r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[210px] flex items-center justify-center">
                      <p className="text-[11px] text-white/20 uppercase tracking-widest">No completed assessments yet</p>
                    </div>
                  )}
                </div>

                {/* Pass / fail pie */}
                <div className="jira-premium-card !p-6">
                  <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Pass / Fail</p>
                  {charts?.passRate?.length > 0 ? (
                    <div className="h-[210px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={charts.passRate} dataKey="value"
                            cx="50%" cy="45%" innerRadius={55} outerRadius={78}
                            paddingAngle={3} label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                            labelLine={false} style={{ fontSize: 9 }}
                          >
                            {charts.passRate.map((e, i) => <Cell key={i} fill={e.fill} />)}
                          </Pie>
                          <Tooltip {...TOOLTIP_STYLE} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[210px] flex items-center justify-center">
                      <p className="text-[11px] text-white/20">No data yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Charts row 2: score histogram + violations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

                {/* Score histogram */}
                <div className="jira-premium-card !p-6">
                  <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Score Distribution</p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={charts?.histogram ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="range" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip {...TOOLTIP_STYLE} />
                        <Bar dataKey="count" radius={[4,4,0,0]} maxBarSize={36}>
                          {(charts?.histogram ?? []).map((d, i) => (
                            <Cell key={i} fill={
                              d.range === '0–20'  ? '#ef4444' :
                              d.range === '20–40' ? '#f97316' :
                              d.range === '40–60' ? '#f59e0b' :
                              d.range === '60–80' ? '#84cc16' : '#10b981'
                            } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Violation breakdown */}
                <div className="jira-premium-card !p-6">
                  <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Violation Breakdown</p>
                  {charts?.violationBreakdown?.length > 0 ? (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={charts.violationBreakdown} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                          <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} allowDecimals={false} />
                          <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.3)" fontSize={8} axisLine={false} tickLine={false} width={80} />
                          <Tooltip {...TOOLTIP_STYLE} />
                          <Bar dataKey="count" fill="#ef4444" radius={[0,4,4,0]} maxBarSize={22} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[180px] flex flex-col items-center justify-center gap-3">
                      <ShieldCheck size={32} className="text-emerald-400" />
                      <p className="text-[12px] font-bold text-emerald-400">No violations recorded</p>
                      <p className="text-[10px] text-white/25">Clean integrity across all sessions</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent submissions table */}
              {recent.length > 0 && (
                <div className="bg-[#0a0c10] border border-white/[0.06] rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
                    <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em]">Recent Attempts</p>
                    <Link href="/results" className="text-[9px] font-black text-[#0052cc] hover:underline uppercase tracking-widest flex items-center gap-1">
                      All Results <ChevronRight size={11} />
                    </Link>
                  </div>
                  <div className="divide-y divide-white/[0.03]">
                    {recent.slice(0, 6).map((s, i) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center gap-5 px-6 py-4 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-bold text-white truncate">{s.examTitle}</p>
                          <p className="text-[9px] text-white/25 mt-0.5 flex items-center gap-1">
                            <Clock size={9} />
                            {s.completedAt ? new Date(s.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                          </p>
                        </div>
                        <div className={`text-lg font-black italic ${s.score >= 40 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {s.score}%
                          <div className="w-14 h-1 bg-white/[0.06] rounded-full mt-1 overflow-hidden">
                            <div className={`h-full rounded-full ${s.score >= 40 ? 'bg-emerald-400' : 'bg-red-400'}`} style={{ width: `${Math.min(s.score, 100)}%` }} />
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {s.totalViolations === 0
                            ? <ShieldCheck size={13} className="text-emerald-400" />
                            : <ShieldAlert size={13} className="text-amber-400" />
                          }
                          <span className={`text-[10px] font-black ${s.totalViolations === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {s.totalViolations}
                          </span>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border shrink-0 ${
                          s.status === 'disqualified' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          s.score >= 40 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {s.status === 'disqualified' ? 'DQ' : s.score >= 40 ? 'Pass' : 'Fail'}
                        </span>
                        <Link href={`/student/result/${s.id}`} className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-[#0052cc]/10 hover:border-[#0052cc]/30 transition-all text-white/25 hover:text-[#0052cc]">
                          <ChevronRight size={14} />
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
