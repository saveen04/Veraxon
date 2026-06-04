'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, Cell, PieChart, Pie, ResponsiveContainer
} from 'recharts';
import {
  Trophy, ShieldCheck, ShieldAlert, CheckCircle2, XCircle,
  ChevronRight, BarChart2, TrendingUp, Activity, Clock
} from 'lucide-react';

function Skel({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

/* ── Small stat card ─────────────────────────────────────────── */
function StatCard({ icon, label, value, color, bg, sub }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="jira-premium-card !p-5 flex items-start gap-4 hover:scale-[1.02] transition-all"
    >
      <div className={`p-3 rounded-xl ${bg} ${color} shrink-0 text-lg`}>{icon}</div>
      <div className="flex-1">
        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-2xl font-black leading-tight ${color}`}>{value}</p>
        {sub && <p className="text-[8px] text-white/20 mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

const TOOLTIP = {
  contentStyle: { background: '#10121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 },
};

export default function ResultsPage() {
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();

  const [results,  setResults]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  /* ── Fetch directly from Firestore (no Admin SDK needed) ────── */
  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace('/login'); return; }

    let cancelled = false;
    (async () => {
      try {
        // Single-field query to avoid composite index requirement
        const snap = await getDocs(query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid)
        ));

        if (cancelled) return;

        const rows = snap.docs
          .map(d => {
            const data = d.data();
            const pct  = data.percentage ?? data.score ?? 0;
            const completedAt = data.completedAt?.toDate?.()
              || data.lastUpdated?.toDate?.()
              || null;
            return {
              id:              d.id,
              examId:          data.examId,
              examTitle:       data.examTitle || data.examId || 'Assessment',
              status:          data.status,
              score:           pct,
              percentage:      pct,
              passed:          pct >= 40 && data.status !== 'disqualified',
              totalViolations: data.totalViolations ?? 0,
              completedAt:     completedAt?.toISOString() ?? null,
              answeredCount:   (data.finalAnswers ?? data.answers ?? []).filter(a => a !== null && a !== undefined).length,
              totalQuestions:  data.totalQuestions ?? 0,
            };
          })
          .sort((a, b) => {
            const at = a.completedAt ? new Date(a.completedAt).getTime() : 0;
            const bt = b.completedAt ? new Date(b.completedAt).getTime() : 0;
            return bt - at;
          });

        if (!cancelled) {
          if (rows.length === 0) setError('No results yet. Complete an assessment to see your scores here.');
          else setResults(rows);
        }
      } catch (e) {
        console.error('[Results] fetch error:', e.code, e.message);
        if (!cancelled) setError('Failed to load results. Please refresh the page.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, router]);

  /* ── Aggregate ───────────────────────────────────────────────── */
  const total      = results.length;
  const passed     = results.filter(r => r.passed).length;
  const failed     = total - passed;
  const avgPct     = total ? Math.round(results.reduce((s, r) => s + r.percentage, 0) / total) : 0;
  const bestPct    = total ? Math.max(...results.map(r => r.percentage)) : 0;
  const totalViols = results.reduce((s, r) => s + r.totalViolations, 0);

  /* ── Chart data ──────────────────────────────────────────────── */
  const trendData = [...results].reverse().map((r, i) => ({
    name:  `#${i + 1}`,
    score: r.percentage,
  }));

  const pieData = [
    { name: 'Passed', value: passed, fill: '#10b981' },
    { name: 'Failed', value: failed, fill: '#ef4444' },
  ].filter(d => d.value > 0);

  const riskColor = v => v === 0 ? '#10b981' : v <= 2 ? '#f59e0b' : '#ef4444';

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden">
      <div className="ambient-matrix-bg opacity-15" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="student" />

        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 xl:p-10 custom-scrollbar">

            {/* Header */}
            <header className="flex items-center justify-between mb-10 border-b border-white/[0.06] pb-7">
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}>
                <p className="text-[8px] font-black text-white/25 uppercase tracking-[0.3em] mb-1">Performance Dashboard</p>
                <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                  <Trophy className="w-9 h-9 text-amber-400 drop-shadow-lg" /> 
                  <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                    My Results
                  </span>
                </h1>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                <Link href="/student/assessments" className="jira-btn-primary !py-3 !px-6 text-[10px] flex items-center gap-2 hover:scale-105 transition-transform">
                  <Activity size={14} /> Take Assessment
                </Link>
              </motion.div>
            </header>

            {/* Loading skeleton */}
            {(authLoading || loading) && (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="jira-premium-card !p-5">
                      <div className="flex items-center gap-4 mb-3"><Skel className="w-11 h-11" /><Skel className="h-3 w-20" /></div>
                      <Skel className="h-7 w-16" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-6 mb-8">
                  <div className="col-span-2 jira-premium-card !p-6"><Skel className="h-[200px]" /></div>
                  <div className="jira-premium-card !p-6"><Skel className="h-[200px]" /></div>
                </div>
                <div className="jira-premium-card"><Skel className="h-48" /></div>
              </>
            )}

            {/* Error / empty */}
            {!loading && !authLoading && error && (
              <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/[0.06] rounded-2xl">
                <Trophy className="w-14 h-14 text-white/10 mb-5" />
                <p className="text-[13px] font-bold text-white/30 mb-6">{error}</p>
                <Link href="/student/assessments" className="jira-btn-primary !py-3 !px-7 text-[11px]">
                  Take Your First Assessment
                </Link>
              </div>
            )}

            {/* Content */}
            {!loading && !authLoading && !error && total > 0 && (
              <>
                {/* Stat cards */}
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  transition={{ staggerChildren: 0.1 }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
                >
                  <StatCard icon={<BarChart2 size={18} />}    label="Total Attempts"    value={total}          color="text-[#0052cc]"   bg="bg-[#0052cc]/10" />
                  <StatCard icon={<CheckCircle2 size={18} />} label="Passed"   value={passed}         color="text-emerald-400" bg="bg-emerald-400/10" sub={`${failed} failed`} />
                  <StatCard icon={<TrendingUp size={18} />}   label="Average" value={`${avgPct}%`}  color="text-amber-400"   bg="bg-amber-400/10"  sub={`Best: ${bestPct}%`} />
                  <StatCard icon={<ShieldAlert size={18} />}  label="Violations" value={totalViols}   color="text-red-400"     bg="bg-red-400/10" sub={totalViols === 0 ? "Clean record" : "Review needed"} />
                </motion.div>

                {/* Charts */}
                {total > 1 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 12 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10"
                  >
                    <motion.div className="lg:col-span-2 jira-premium-card !p-7 hover:border-[#0052cc]/30 transition-all">
                      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Performance Trend</h3>
                      <p className="text-[8px] text-white/20 mb-4">Track your scores across all attempts</p>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <defs>
                              <linearGradient id="gradTrend" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#0052cc" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#0052cc" stopOpacity={0.01} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} unit="%" />
                            <Tooltip {...TOOLTIP} formatter={v => [`${v}%`, 'Score']} />
                            <Line type="monotone" dataKey="score" stroke="#0052cc" strokeWidth={3}
                              dot={{ fill: '#0052cc', r: 4 }} activeDot={{ r: 6 }} isAnimationActive={true} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <motion.p className="text-[8px] text-red-400/60 uppercase tracking-wider mt-3 text-center border-t border-white/[0.05] pt-3">
                        ⚠ 40% pass threshold marked
                      </motion.p>
                    </motion.div>

                    <motion.div className="jira-premium-card !p-7 hover:border-emerald-400/30 transition-all">
                      <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Pass / Fail</h3>
                      <p className="text-[8px] text-white/20 mb-4">Success rate breakdown</p>
                      {pieData.length > 0 ? (
                        <div className="h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={pieData}
                                dataKey="value"
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={72}
                                paddingAngle={4}
                                label={({ name, percent }) => `${name} ${Math.round(percent * 100)}%`}
                                labelLine={false}
                                isAnimationActive={true}
                                style={{ fontSize: 9, fontWeight: 800 }}
                              >
                                {pieData.map((e, i) => (
                                  <Cell key={i} fill={e.fill} />
                                ))}
                              </Pie>
                              <Tooltip {...TOOLTIP} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-[200px] flex items-center justify-center">
                          <p className="text-[11px] text-white/20">No data yet</p>
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                )}

                {/* Results table */}
                <motion.div 
                  initial={{ opacity: 0, y: 12 }} 
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-[#0a0c10] border border-white/[0.06] rounded-2xl overflow-hidden mb-8 hover:border-white/[0.1] transition-all"
                >
                  {/* Table header */}
                  <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_52px] gap-3 px-6 py-4 border-b border-white/[0.05] bg-gradient-to-r from-white/[0.02] to-transparent">
                    {['Assessment','Score','Violations','Status','Answered',''].map(h => (
                      <span key={h} className="text-[8px] font-black uppercase tracking-widest text-white/30">{h}</span>
                    ))}
                  </div>

                  {/* Table rows */}
                  <div className="divide-y divide-white/[0.03] max-h-[500px] overflow-y-auto custom-scrollbar">
                    {results.map((r, i) => (
                      <div
                        key={r.id}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_52px] gap-3 px-6 py-5 hover:bg-white/[0.03] transition-all items-center group"
                      >
                        {/* Title */}
                        <div className="min-w-0">
                          <p className="text-[12px] font-bold text-white truncate group-hover:text-[#0052cc] transition-colors">{r.examTitle}</p>
                          <p className="text-[8px] text-white/20 mt-1.5 flex items-center gap-1.5">
                            <Clock size={10} className="text-white/20" />
                            {r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </p>
                        </div>

                        {/* Score with mini bar */}
                        <div>
                          <p className={`text-[16px] font-black italic ${r.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.percentage}%
                          </p>
                          <div className="w-16 h-1.5 bg-white/[0.06] rounded-full mt-2 overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(r.percentage, 100)}%` }}
                              transition={{ duration: 0.8, delay: i * 0.04 }}
                              className={`h-full rounded-full ${r.passed ? 'bg-gradient-to-r from-emerald-400 to-green-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                            />
                          </div>
                        </div>

                        {/* Violations */}
                        <div className="flex items-center gap-2 justify-start">
                          <span className={`text-[13px] font-black ${
                            r.totalViolations === 0 ? 'text-emerald-400' :
                            r.totalViolations <= 2  ? 'text-amber-400' : 'text-red-400'
                          }`}>{r.totalViolations}</span>
                          {r.totalViolations === 0
                            ? <ShieldCheck size={12} className="text-emerald-400" />
                            : r.totalViolations <= 2
                            ? <ShieldAlert size={12} className="text-amber-400" />
                            : <ShieldAlert size={12} className="text-red-400" />
                          }
                        </div>

                        {/* Status */}
                        <div>
                          {r.status === 'disqualified' ? (
                            <span className="text-[8px] font-black px-2.5 py-1.5 rounded-lg border bg-red-500/10 text-red-400 border-red-500/30 uppercase w-fit flex items-center gap-1 whitespace-nowrap">
                              <ShieldAlert size={10} /> DQ
                            </span>
                          ) : r.passed ? (
                            <span className="text-[8px] font-black px-2.5 py-1.5 rounded-lg border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 uppercase w-fit flex items-center gap-1 whitespace-nowrap">
                              <CheckCircle2 size={10} /> Pass
                            </span>
                          ) : (
                            <span className="text-[8px] font-black px-2.5 py-1.5 rounded-lg border bg-red-500/10 text-red-400 border-red-500/30 uppercase w-fit flex items-center gap-1 whitespace-nowrap">
                              <XCircle size={10} /> Fail
                            </span>
                          )}
                        </div>

                        {/* Answered */}
                        <div className="text-[8px] text-white/25 font-medium">
                          {r.totalQuestions > 0 ? `${r.answeredCount}/${r.totalQuestions}` : '—'}
                        </div>

                        {/* Link */}
                        <Link href={`/student/result/${r.id}`}
                          className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:bg-[#0052cc]/20 hover:border-[#0052cc]/40 transition-all text-white/25 hover:text-[#0052cc] flex items-center justify-center group-hover:scale-110">
                          <ChevronRight size={15} />
                        </Link>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
            )}

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
