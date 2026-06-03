'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Clock, Calendar, Play, ChevronRight, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function StudentRetakesPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [retakes, setRetakes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'assignments'),
      where('assignedTo', 'array-contains', user.uid),
      where('isRetake', '==', true)
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      data.sort((a, b) => {
        const aT = a.assignedAt?.toMillis?.() || 0;
        const bT = b.assignedAt?.toMillis?.() || 0;
        return bT - aT;
      });
      setRetakes(data);
      setLoading(false);
    }, err => {
      console.error('Retakes listener:', err);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const isExpired = (a) => {
    if (!a.dueDate) return false;
    return new Date(a.dueDate) < new Date();
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-inter text-white selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1">
        <Sidebar role="student" />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <div>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Student Portal</span>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 mt-1">
                <RefreshCw className="w-7 h-7 text-amber-400" /> Retake Assessments
              </h1>
            </div>
            <div className="px-4 py-2 rounded-xl bg-amber-400/10 border border-amber-400/20">
              <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                {retakes.filter(r => !isExpired(r)).length} Active Retakes
              </span>
            </div>
          </header>

          {retakes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center border border-dashed border-white/5 rounded-2xl">
              <RefreshCw className="w-12 h-12 text-white/10 mb-4" />
              <h3 className="text-lg font-black uppercase italic text-white/20 mb-2">No Retakes Assigned</h3>
              <p className="text-[11px] text-white/15 uppercase tracking-widest">
                When your instructor assigns a retake, it will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {retakes.map(retake => {
                const expired = isExpired(retake);
                return (
                  <motion.div
                    key={retake.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`jira-premium-card !p-6 flex items-center gap-6 border transition-all ${
                      expired ? 'border-red-500/10 opacity-60' : 'border-amber-400/15 hover:border-amber-400/30'
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                      expired ? 'bg-red-500/10' : 'bg-amber-400/10'
                    }`}>
                      {expired ? <AlertCircle className="w-6 h-6 text-red-400" /> : <RefreshCw className="w-6 h-6 text-amber-400" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-black text-white text-base truncate">{retake.testTitle}</h3>
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 shrink-0">
                          Retake
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[9px] text-white/30 uppercase tracking-widest flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar size={9} />
                          Assigned: {retake.assignedAt?.toDate ? retake.assignedAt.toDate().toLocaleDateString() : 'Now'}
                        </span>
                        {retake.dueDate && (
                          <span className={`flex items-center gap-1 ${expired ? 'text-red-400' : 'text-amber-400'}`}>
                            <Clock size={9} />
                            Due: {new Date(retake.dueDate).toLocaleDateString()}
                            {expired && ' (Expired)'}
                          </span>
                        )}
                        {retake.sessionCode && (
                          <span className="font-mono">Code: {retake.sessionCode}</span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    {expired ? (
                      <div className="text-[10px] font-black text-red-400 uppercase tracking-widest shrink-0">
                        Expired
                      </div>
                    ) : (
                      <Link
                        href={`/env-check?examId=${retake.testId}`}
                        className="jira-btn-primary !py-2.5 !px-5 text-[9px] flex items-center gap-2 shrink-0 hover:shadow-[0_0_20px_rgba(0,82,204,0.4)]"
                      >
                        <Play size={12} className="fill-current" /> Start Retake <ChevronRight size={12} />
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      <Footer className="ml-64" />
    </div>
  );
}
