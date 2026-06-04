'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import {
  History, CheckCircle2, XCircle, Clock, Search, Trophy,
  ShieldCheck, ShieldAlert, ChevronRight, BarChart2
} from 'lucide-react';

export default function StudentHistoryPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const fetchHistory = async () => {
      try {
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid),
          orderBy('lastUpdated', 'desc')
        );
        const snap = await getDocs(q);
        setSubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('History fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user]);

  const filtered = submissions.filter((s) =>
    !searchQuery || s.examTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const passed = submissions.filter((s) => (s.score || 0) >= 40).length;
  const avg = submissions.length
    ? (submissions.reduce((a, b) => a + (b.score || 0), 0) / submissions.length).toFixed(1)
    : 0;

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <header className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
          <div>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Student Portal</span>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 mt-1">
              <History className="w-8 h-8 text-[#0052cc]" /> My History
            </h1>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="jira-premium-card !p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[#0052cc]/10"><BarChart2 size={16} className="text-[#0052cc]" /></div>
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Attempts</p>
              <p className="text-2xl font-black italic text-white">{submissions.length}</p>
            </div>
          </div>
          <div className="jira-premium-card !p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-emerald-400/10"><Trophy size={16} className="text-emerald-400" /></div>
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Passed</p>
              <p className="text-2xl font-black italic text-emerald-400">{passed}</p>
            </div>
          </div>
          <div className="jira-premium-card !p-5 flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-purple-400/10"><ShieldCheck size={16} className="text-purple-400" /></div>
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Avg Score</p>
              <p className="text-2xl font-black italic text-purple-400">{avg}%</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search by exam title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="jira-input !pl-10 !py-2.5 !text-[11px]"
          />
        </div>

        {/* History Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <History className="w-16 h-16 text-white/10 mb-6" />
            <h3 className="text-xl font-black uppercase italic text-white/20 mb-2">No History Yet</h3>
            <p className="text-[11px] text-white/20 uppercase tracking-widest mb-8">
              Complete your first assessment to see history here.
            </p>
            <Link href="/student/assessments" className="jira-btn-primary !py-3 !px-6 text-[10px]">
              Join an Assessment
            </Link>
          </div>
        ) : (
          <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01]">
              {['Assessment', 'Score', 'Status', 'Date', ''].map((h) => (
                <span key={h} className="text-[9px] font-black uppercase tracking-widest text-white/30">{h}</span>
              ))}
            </div>
            <div className="divide-y divide-white/[0.03]">
              {filtered.map((sub) => {
                const score = sub.score || 0;
                const passed = score >= 40;
                const isDisqualified = sub.status === 'disqualified';
                const completedAt = sub.completedAt?.toDate ? sub.completedAt.toDate() : (sub.lastUpdated?.toDate ? sub.lastUpdated.toDate() : new Date());

                return (
                  <div key={sub.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center">
                    <div>
                      <p className="font-black text-sm text-white">{sub.examTitle || sub.examId?.substring(0, 12) || 'Assessment'}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">
                        {sub.totalViolations || 0} violation{(sub.totalViolations || 0) !== 1 ? 's' : ''} flagged
                      </p>
                    </div>
                    <div className={`text-xl font-black italic ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                      {score.toFixed(1)}%
                    </div>
                    <div>
                      {isDisqualified ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1.5 w-fit">
                          <ShieldAlert size={10} /> Disqualified
                        </span>
                      ) : passed ? (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1.5 w-fit">
                          <CheckCircle2 size={10} /> Passed
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border bg-red-500/10 text-red-400 border-red-500/20 flex items-center gap-1.5 w-fit">
                          <XCircle size={10} /> Failed
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/30">
                      {completedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                    </div>
                    <Link
                      href={`/student/result/${sub.id}`}
                      className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-all text-white/40 hover:text-[#0052cc] flex items-center justify-center"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
