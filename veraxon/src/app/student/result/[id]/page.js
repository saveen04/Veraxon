'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  CheckCircle2, XCircle, ShieldAlert, ShieldCheck, Trophy,
  BarChart2, ChevronLeft, Home, Clock, Target
} from 'lucide-react';

export default function StudentResultPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || !id) return;
    const fetchResult = async () => {
      try {
        const snap = await getDoc(doc(db, 'submissions', id));
        if (snap.exists() && snap.data().userId === user.uid) {
          setSubmission({ id: snap.id, ...snap.data() });
        } else {
          router.push('/student/history');
        }
      } catch (err) {
        console.error('Result fetch error:', err);
        router.push('/student/history');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [user, id, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  if (!submission) return null;

  const score = submission.score || 0;
  const passed = score >= 40;
  const disqualified = submission.status === 'disqualified';
  const violations = submission.totalViolations || 0;

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-start p-8 font-inter text-white selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />

      <div className="w-full max-w-2xl z-10">
        {/* Back nav */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/student/history" className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
            <ChevronLeft size={14} /> Back to History
          </Link>
        </div>

        {/* Result Card */}
        <div className={`glass-card !p-12 rounded-3xl border text-center relative overflow-hidden ${
          disqualified ? 'border-red-500/30' : passed ? 'border-emerald-500/30' : 'border-red-400/30'
        }`}>
          <div className={`absolute top-0 left-0 w-full h-1 ${
            disqualified ? 'bg-red-500' : passed ? 'bg-gradient-to-r from-emerald-500 to-[#0052cc]' : 'bg-red-500'
          }`} />

          {/* Icon */}
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 ${
            disqualified ? 'bg-red-500/10' : passed ? 'bg-emerald-500/10' : 'bg-red-500/10'
          }`}>
            {disqualified ? (
              <ShieldAlert className="w-10 h-10 text-red-400" />
            ) : passed ? (
              <Trophy className="w-10 h-10 text-emerald-400" />
            ) : (
              <XCircle className="w-10 h-10 text-red-400" />
            )}
          </div>

          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2">
            {disqualified ? 'Disqualified' : passed ? 'Assessment Passed' : 'Assessment Failed'}
          </h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-10">
            {submission.examTitle || 'Assessment Result'}
          </p>

          {/* Score Display */}
          <div className="relative w-40 h-40 mx-auto mb-10">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="60" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
              <circle
                cx="70" cy="70" r="60"
                fill="none"
                stroke={disqualified ? '#ef4444' : passed ? '#10b981' : '#ef4444'}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 60}`}
                strokeDashoffset={`${2 * Math.PI * 60 * (1 - score / 100)}`}
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-4xl font-black italic ${passed && !disqualified ? 'text-emerald-400' : 'text-red-400'}`}>
                {score.toFixed(1)}%
              </span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Score</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <Clock size={16} className="text-[#0052cc] mx-auto mb-2" />
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Duration</p>
              <p className="text-sm font-black text-white">Completed</p>
            </div>
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4">
              <Target size={16} className="text-purple-400 mx-auto mb-2" />
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Threshold</p>
              <p className="text-sm font-black text-white">40%</p>
            </div>
            <div className={`border rounded-xl p-4 ${violations > 0 ? 'bg-red-500/5 border-red-500/20' : 'bg-white/[0.02] border-white/5'}`}>
              <ShieldAlert size={16} className={`mx-auto mb-2 ${violations > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
              <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Violations</p>
              <p className={`text-sm font-black ${violations > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{violations}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-4">
            <Link href="/student/dashboard" className="flex-1 jira-btn-secondary !py-4 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
              <Home size={14} /> Dashboard
            </Link>
            <Link href="/student/assessments" className="flex-1 jira-btn-primary !py-4 text-[10px] uppercase tracking-widest flex items-center justify-center gap-2">
              New Session <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
