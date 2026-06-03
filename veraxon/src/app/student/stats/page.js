'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, ShieldCheck, Trophy, Zap, BarChart2,
  Clock, Target, AlertTriangle, ChevronRight, Activity
} from 'lucide-react';

const COLORS = ['#0052cc', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function StudentStatsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (!authLoading && userData && userData.role !== 'student' && userData.role !== 'admin') {
      router.push('/staff/stats');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        // Simple query — no composite index needed
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            const aTime = a.completedAt?.toMillis?.() || a.lastUpdated?.toMillis?.() || 0;
            const bTime = b.completedAt?.toMillis?.() || b.lastUpdated?.toMillis?.() || 0;
            return bTime - aTime;
          });
        setSubmissions(data);
      } catch (err) {
        console.error('Stats fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // Computed stats
  const totalAttempts = submissions.length;
  const completed = submissions.filter((s) => s.status === 'completed' || s.status === 'disqualified');
  const passed = completed.filter((s) => (s.score || 0) >= 40).length;
  const avg = completed.length
    ? (completed.reduce((a, b) => a + (b.score || 0), 0) / completed.length).toFixed(1)
    : 0;
  const totalViolations = submissions.reduce((a, b) => a + (b.totalViolations || 0), 0);

  // Chart data — last 10 submissions
  const trendData = completed.slice(-10).reverse().map((s, i) => ({
    name: `#${i + 1}`,
    score: parseFloat((s.score || 0).toFixed(1)),
    passed: (s.score || 0) >= 40 ? 1 : 0,
  }));

  const pieData = [
    { name: 'Passed', value: passed },
    { name: 'Failed', value: Math.max(0, completed.length - passed) },
  ].filter((d) => d.value > 0);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex font-inter text-white selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />
      <Sidebar role="student" />

      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        <header className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Analytics</span>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 mt-1">
              <Activity className="w-8 h-8 text-[#0052cc]" /> My Performance
            </h1>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mt-1">
              {userData?.collegeName} • {userData?.department}
            </p>
          </div>
        </header>

        {/* Stat Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Attempts', value: totalAttempts, icon: <BarChart2 size={16} />, color: 'text-[#0052cc]', iconBg: 'bg-[#0052cc]/10' },
            { label: 'Passed', value: passed, icon: <Trophy size={16} />, color: 'text-emerald-400', iconBg: 'bg-emerald-400/10' },
            { label: 'Avg Score', value: `${avg}%`, icon: <TrendingUp size={16} />, color: 'text-purple-400', iconBg: 'bg-purple-400/10' },
            { label: 'Violations', value: totalViolations, icon: <AlertTriangle size={16} />, color: totalViolations > 0 ? 'text-red-400' : 'text-emerald-400', iconBg: totalViolations > 0 ? 'bg-red-400/10' : 'bg-emerald-400/10' },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="jira-premium-card !p-5 flex items-center gap-4"
            >
              <div className={`p-2.5 rounded-xl ${s.iconBg} ${s.color}`}>{s.icon}</div>
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
            {/* Score Trend */}
            <div className="col-span-2 jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Score Trend</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#161a22', border: '1px solid #30363d', borderRadius: '8px' }}
                      itemStyle={{ fontSize: '12px' }}
                    />
                    <Line type="monotone" dataKey="score" stroke="#0052cc" strokeWidth={3} dot={{ fill: '#0052cc', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pass/Fail distribution */}
            <div className="jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Pass/Fail</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={index === 0 ? '#10b981' : '#ef4444'} />
                      ))}
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

        {/* Recent Attempts Table */}
        <div className="jira-premium-card !p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Recent Attempts</h3>
            <Link href="/student/history" className="text-[9px] font-black text-[#0052cc] uppercase tracking-widest hover:underline flex items-center gap-1">
              View All <ChevronRight size={12} />
            </Link>
          </div>

          {submissions.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center">
              <Activity className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-[11px] text-white/20 uppercase tracking-widest">No attempts yet. Join an assessment to begin.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {submissions.slice(0, 5).map((sub) => {
                const score = sub.score || 0;
                const passed = score >= 40;
                const completedAt = sub.completedAt?.toDate?.() || sub.lastUpdated?.toDate?.() || new Date();

                return (
                  <div key={sub.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div>
                      <p className="font-black text-sm text-white">{sub.examTitle || sub.examId?.substring(0, 12) || 'Assessment'}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
                        {completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-lg font-black italic ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                        {score.toFixed(1)}%
                      </span>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border ${
                        sub.status === 'disqualified' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        passed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {sub.status === 'disqualified' ? 'Disqualified' : passed ? 'Passed' : 'Failed'}
                      </span>
                      <Link href={`/student/result/${sub.id}`} className="text-white/20 hover:text-[#0052cc] transition-colors">
                        <ChevronRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer className="ml-64" />
    </div>
  );
}
