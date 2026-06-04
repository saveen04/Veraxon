'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  CheckCircle2, XCircle, ShieldAlert, ShieldCheck,
  Clock, Trophy, ChevronLeft, AlertTriangle, Activity
} from 'lucide-react';

/* ─── Circular score ring ────────────────────────────────────── */
function ScoreRing({ pct, passed }) {
  const r = 64, circ = 2 * Math.PI * r;
  return (
    <div className="relative flex items-center justify-center w-40 h-40">
      <div className={`absolute inset-0 rounded-full blur-2xl opacity-25 ${passed ? 'bg-emerald-400' : 'bg-red-400'}`} />
      <svg width={160} height={160} className="-rotate-90">
        <circle cx={80} cy={80} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
        <circle cx={80} cy={80} r={r} fill="none"
          stroke={passed ? '#10b981' : '#ef4444'} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (circ * Math.min(pct, 100)) / 100}
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-black italic leading-none ${passed ? 'text-emerald-400' : 'text-red-400'}`}>{pct}%</span>
        <span className="text-[8px] font-black text-white/25 uppercase tracking-widest mt-0.5">Score</span>
      </div>
    </div>
  );
}

export default function ResultDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id     = params?.id;
  const { user, loading: authLoading } = useAuth();

  const [sub,     setSub]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [expanded,setExpanded]= useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }
    if (!id) return;

    let cancelled = false;
    (async () => {
      try {
        // Fetch submission directly from client Firestore — no Admin SDK needed
        const subDoc = await getDoc(doc(db, 'submissions', id));
        if (!subDoc.exists()) { setError('Result not found.'); return; }

        const d = subDoc.data();

        // Fetch test questions for answer review
        let questions = [];
        if (d.examId) {
          try {
            const testDoc = await getDoc(doc(db, 'tests', d.examId));
            if (testDoc.exists()) questions = testDoc.data().questions ?? [];
          } catch { /* questions optional */ }
        }

        // Fetch violations for this submission
        let violations = [];
        try {
          const vSnap = await getDocs(query(
            collection(db, 'infractions'),
            where('studentId', '==', d.userId)
          ));
          violations = vSnap.docs
            .filter(v => v.data().examId === d.examId)
            .map(v => ({
              id:        v.id,
              type:      v.data().type,
              severity:  v.data().severity,
              timestamp: v.data().timestamp?.toDate?.()?.toISOString() ?? null,
            }))
            .sort((a, b) => (b.timestamp || '') > (a.timestamp || '') ? 1 : -1);
        } catch { /* violations optional */ }

        const answers       = d.finalAnswers ?? d.answers ?? [];
        const questionResults = questions.map((q, idx) => {
          const studentAns = answers[idx] ?? null;
          const isCorrect  = q.correctAnswer !== undefined
            ? studentAns === q.correctAnswer : null;
          return {
            number:    idx + 1,
            text:      q.text,
            options:   q.options ?? [],
            studentAns,
            correct:   q.correctAnswer ?? null,
            isCorrect,
            marks:     q.marks ?? 1,
          };
        });

        const totalMarks = questions.reduce((s, q) => s + (q.marks ?? 1), 0) || questions.length || 1;
        const earned     = questionResults.reduce((s, q) => s + (q.isCorrect ? (q.marks ?? 1) : 0), 0);
        const pct        = d.percentage ?? d.score ?? (questions.length > 0 ? Math.round((earned / totalMarks) * 100) : 0);

        if (!cancelled) {
          setSub({
            id,
            examId:          d.examId,
            examTitle:       d.examTitle ?? 'Assessment',
            status:          d.status,
            score:           earned || d.score || 0,
            totalMarks,
            percentage:      pct,
            passed:          pct >= 40 && d.status !== 'disqualified',
            totalViolations: d.totalViolations ?? 0,
            completedAt:     d.completedAt?.toDate?.()?.toISOString() ?? d.lastUpdated?.toDate?.()?.toISOString() ?? null,
            questionResults,
            violations,
            answeredCount:   answers.filter(a => a !== null && a !== undefined).length,
            totalQuestions:  questions.length,
          });
        }
      } catch (e) {
        console.error('[ResultDetail]', e.code, e.message);
        if (!cancelled) setError('Failed to load result. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, id, router]);

  if (authLoading || loading) {
    return (
      <div className="h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar role="student" />
          <div className="flex-1 ml-64 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-10">
              <Trophy className="w-12 h-12 text-white/10 mb-4" />
              <p className="text-white/30 text-sm mb-6">{error || 'Result not found.'}</p>
              <Link href="/results" className="jira-btn-primary !py-2 !px-6 text-[11px]">Back to Results</Link>
            </main>
            <Footer />
          </div>
        </div>
      </div>
    );
  }

  const qr        = sub.questionResults ?? [];
  const correct   = qr.filter(q => q.isCorrect).length;
  const incorrect = qr.filter(q => q.isCorrect === false).length;
  const unanswered= qr.filter(q => q.isCorrect === null).length;

  /* ── Chart data ──────────────────────────────────────────────── */
  const breakdownData = [
    { name: 'Correct',    value: correct,   fill: '#10b981' },
    { name: 'Incorrect',  value: incorrect, fill: '#ef4444' },
    { name: 'Unanswered', value: unanswered, fill: 'rgba(255,255,255,0.12)' },
  ];

  const violByType = sub.violations?.reduce((acc, v) => {
    acc[v.type] = (acc[v.type] || 0) + 1; return acc;
  }, {}) ?? {};
  const violChartData = Object.entries(violByType).map(([type, count]) => ({
    name: type.replace(/_/g, ' '),
    count,
  }));

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden">
      <div className="ambient-matrix-bg opacity-15" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 xl:p-10 custom-scrollbar">

          {/* ── Header ──────────────────────────────────────── */}
          <header className="mb-8 border-b border-white/[0.06] pb-6">
            <Link href="/results" className="flex items-center gap-2 text-[11px] font-bold text-white/35 hover:text-white transition-colors mb-4">
              <ChevronLeft size={14} /> Back to Results
            </Link>
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div>
                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Result Detail</p>
                <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white mt-1 max-w-xl">
                  {sub.examTitle}
                </h1>
                <div className="flex items-center gap-4 mt-2 flex-wrap">
                  <span className="text-[10px] text-white/30 flex items-center gap-1">
                    <Clock size={10} />
                    {sub.completedAt ? new Date(sub.completedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : 'N/A'}
                  </span>
                  {sub.status === 'disqualified' && (
                    <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1.5 uppercase">
                      <ShieldAlert size={10} /> Disqualified
                    </span>
                  )}
                </div>
              </div>
              <ScoreRing pct={sub.percentage ?? 0} passed={sub.passed} />
            </div>
          </header>

          {/* ── Summary cards ───────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: <Trophy size={16} className="text-amber-400" />,     label: 'Score',        value: `${sub.score ?? 0} / ${sub.totalMarks ?? 0}`,  color: 'bg-amber-400/10' },
              { icon: <CheckCircle2 size={16} className="text-emerald-400" />, label: 'Correct',  value: `${correct} / ${qr.length}`,                   color: 'bg-emerald-400/10' },
              { icon: <ShieldAlert size={16} className="text-red-400" />,  label: 'Violations',   value: sub.totalViolations ?? 0,                       color: 'bg-red-400/10' },
              { icon: <Activity size={16} className="text-[#0052cc]" />,   label: 'Answered',     value: `${sub.answeredCount ?? 0} / ${sub.totalQuestions ?? 0}`, color: 'bg-[#0052cc]/10' },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="jira-premium-card !p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${color} shrink-0`}>{icon}</div>
                <div>
                  <p className="text-[9px] font-black text-white/25 uppercase tracking-widest">{label}</p>
                  <p className="text-lg font-black text-white leading-tight">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Charts row ──────────────────────────────────── */}
          {qr.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Question breakdown bar */}
              <div className="jira-premium-card !p-6">
                <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Question Breakdown</p>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={breakdownData} layout="vertical">
                      <XAxis type="number" stroke="rgba(255,255,255,0.15)" fontSize={9} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={9} axisLine={false} tickLine={false} width={72} />
                      <Tooltip contentStyle={{ background: '#10121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }} />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {breakdownData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Violations chart or integrity card */}
              <div className="jira-premium-card !p-6">
                <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-5">Integrity Report</p>
                {violChartData.length > 0 ? (
                  <div className="h-[160px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={violChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={8} axisLine={false} tickLine={false} />
                        <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip contentStyle={{ background: '#10121a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, fontSize: 11 }} />
                        <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[160px] flex flex-col items-center justify-center gap-3">
                    <ShieldCheck size={36} className="text-emerald-400" />
                    <p className="text-[12px] font-bold text-emerald-400">No violations detected</p>
                    <p className="text-[10px] text-white/25 text-center">This session maintained full integrity throughout.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Question-by-question review ─────────────────── */}
          {qr.length > 0 && (
            <div className="mb-8">
              <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.22em] mb-4">Question Review</p>
              <div className="space-y-3">
                {qr.map((q, idx) => {
                  const open = expanded === idx;
                  const isC  = q.isCorrect === true;
                  const isW  = q.isCorrect === false;

                  return (
                    <div
                      key={idx}
                      className={`rounded-xl border transition-all ${
                        isC ? 'border-emerald-500/20 bg-emerald-500/[0.03]' :
                        isW ? 'border-red-500/20 bg-red-500/[0.03]' :
                        'border-white/[0.06] bg-white/[0.02]'
                      }`}
                    >
                      <button
                        onClick={() => setExpanded(open ? null : idx)}
                        className="w-full flex items-center gap-4 px-5 py-4 text-left"
                      >
                        {/* Number */}
                        <span className="text-[11px] font-black text-white/30 w-7 shrink-0">Q{idx + 1}</span>
                        {/* Status icon */}
                        {isC ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" /> :
                         isW ? <XCircle     size={15} className="text-red-400 shrink-0" /> :
                               <AlertTriangle size={15} className="text-amber-400 shrink-0" />}
                        {/* Question text */}
                        <span className="flex-1 text-[12px] font-medium text-white/75 truncate">{q.text}</span>
                        {/* Marks */}
                        <span className={`text-[10px] font-black shrink-0 ${isC ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isC ? `+${q.marks}` : '0'} / {q.marks}
                        </span>
                        <ChevronLeft size={14} className={`text-white/20 shrink-0 transition-transform ${open ? '-rotate-90' : 'rotate-180'}`} />
                      </button>

                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 space-y-2">
                              {q.options.map((opt, oi) => {
                                const isStudent = q.studentAns === oi;
                                const isAnswer  = q.correct === oi;
                                return (
                                  <div key={oi} className={`flex items-start gap-3 px-4 py-2.5 rounded-xl border text-[12px] ${
                                    isAnswer  ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' :
                                    isStudent && !isAnswer ? 'bg-red-500/10 border-red-500/25 text-red-300' :
                                    'bg-white/[0.02] border-white/[0.06] text-white/50'
                                  }`}>
                                    <span className="font-black shrink-0 w-5 text-center">{String.fromCharCode(65 + oi)}</span>
                                    <span className="flex-1">{opt}</span>
                                    {isAnswer  && <span className="text-emerald-400 text-[9px] font-black uppercase shrink-0">✓ Correct</span>}
                                    {isStudent && !isAnswer && <span className="text-red-400 text-[9px] font-black uppercase shrink-0">Your Answer</span>}
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Violations log ──────────────────────────────── */}
          {sub.violations?.length > 0 && (
            <div className="jira-premium-card !p-0 overflow-hidden mb-8">
              <div className="px-6 py-4 border-b border-white/[0.05] flex items-center gap-2">
                <ShieldAlert size={14} className="text-red-400" />
                <p className="text-[10px] font-black text-red-400 uppercase tracking-[0.22em]">
                  Violation Log ({sub.violations.length})
                </p>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {sub.violations.map((v, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${v.severity === 'breach' ? 'bg-red-500' : 'bg-amber-400'}`} />
                    <span className="text-[12px] font-semibold text-white/70 flex-1 capitalize">
                      {v.type.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                      v.severity === 'breach' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                    }`}>{v.severity}</span>
                    <span className="text-[9px] text-white/20">
                      {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4 pb-4">
            <Link href="/results" className="jira-btn-secondary !py-3 !px-6 text-[11px]">← All Results</Link>
            <Link href="/student/assessments" className="jira-btn-primary !py-3 !px-6 text-[11px]">Take Another Assessment</Link>
          </div>

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
