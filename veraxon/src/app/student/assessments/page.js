'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import NotificationDropdown from '@/components/NotificationDropdown';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play, Search, QrCode, Link as LinkIcon, ChevronRight,
  ClipboardList, Clock, Layers, AlertCircle, CheckCircle2,
  Calendar, RefreshCw, Shield
} from 'lucide-react';

export default function StudentAssessmentsPage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [sessionToken, setSessionToken] = useState('');
  const [entryMode, setEntryMode] = useState('manual');
  const [tokenError, setTokenError] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);
  const [assignedTests, setAssignedTests] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);

  // Wait for auth to fully resolve before doing anything
  useEffect(() => {
    if (loading) return;
    if (!user) router.push('/login');
  }, [user, loading, router]);

  // Load tests assigned specifically to this student
  useEffect(() => {
    if (loading || !user) return;
    setTestsLoading(true);

    let didCancel = false;

    const loadPublishedTests = async (existingIds = []) => {
      try {
        const pubSnap = await getDocs(query(
          collection(db, 'tests'),
          where('status', '==', 'published')
        ));
        return pubSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(t => !existingIds.includes(t.id));
      } catch (e) {
        console.warn('loadPublishedTests error:', e.code);
        return [];
      }
    };

    // Single-field query only — avoids composite index requirement.
    // Filter status === 'active' client-side.
    const q = query(
      collection(db, 'assignments'),
      where('assignedTo', 'array-contains', user.uid)
    );

    const unsub = onSnapshot(q, async (snap) => {
      if (didCancel) return;

      // Filter active assignments client-side
      const assignments = snap.docs
        .map(d => ({ assignmentId: d.id, ...d.data() }))
        .filter(a => a.status === 'active');

      if (assignments.length === 0) {
        // No assignments at all — just show published tests
        const pubTests = await loadPublishedTests();
        if (!didCancel) {
          setAssignedTests(pubTests);
          setTestsLoading(false);
        }
        return;
      }

      const testPromises = assignments.map(async (assignment) => {
        try {
          const testSnap = await getDoc(doc(db, 'tests', assignment.testId));
          if (testSnap.exists()) {
            return {
              id: testSnap.id,
              ...testSnap.data(),
              assignmentId: assignment.assignmentId,
              dueDate: assignment.dueDate,
              isRetake: assignment.isRetake || false,
              sessionCode: assignment.sessionCode,
              sessionLink: assignment.sessionLink,
              assignedAt: assignment.assignedAt,
            };
          }
        } catch { /* skip missing tests */ }
        return null;
      });

      const resolved = (await Promise.all(testPromises)).filter(Boolean);
      const resolvedIds = resolved.map(t => t.id);
      const pubTests = await loadPublishedTests(resolvedIds);

      if (!didCancel) {
        setAssignedTests([...resolved, ...pubTests]);
        setTestsLoading(false);
      }
    }, async (err) => {
      // Any Firestore error (permission-denied, missing-index) → fall back to published tests
      console.warn('assignments snapshot error:', err.code);
      if (!didCancel) {
        const pubTests = await loadPublishedTests();
        setAssignedTests(pubTests);
        setTestsLoading(false);
      }
    });

    return () => {
      didCancel = true;
      unsub();
    };
  }, [user, loading]);

  const handleJoinByToken = async () => {
    const token = sessionToken.trim();
    if (!token) {
      setTokenError('Please enter a session token or exam ID.');
      return;
    }
    setTokenLoading(true);
    setTokenError('');

    try {
      // Try exact ID
      const snap = await getDoc(doc(db, 'tests', token));
      if (snap.exists() && snap.data().status === 'published') {
        router.push(`/env-check?examId=${token}`);
        return;
      }
      // Try lowercase
      const snapLower = await getDoc(doc(db, 'tests', token.toLowerCase()));
      if (snapLower.exists() && snapLower.data().status === 'published') {
        router.push(`/env-check?examId=${token.toLowerCase()}`);
        return;
      }
      // Try session code
      const q = query(collection(db, 'tests'), where('sessionCode', '==', token.toUpperCase()));
      const qSnap = await getDocs(q);
      if (!qSnap.empty) {
        router.push(`/env-check?examId=${qSnap.docs[0].id}`);
        return;
      }
      // Try assignment session code
      const aq = query(collection(db, 'assignments'), where('sessionCode', '==', token.toUpperCase()));
      const aSnap = await getDocs(aq);
      if (!aSnap.empty) {
        router.push(`/env-check?examId=${aSnap.docs[0].data().testId}`);
        return;
      }

      setTokenError('Session not found or not active. Check the token and try again.');
    } catch (err) {
      console.error('Token join error:', err);
      setTokenError('Failed to verify session. Please try again.');
    } finally {
      setTokenLoading(false);
    }
  };

  // Don't block the whole page on auth loading — show content skeleton instead
  if (!loading && !user) return null;

  const regularTests = assignedTests.filter(t => !t.isRetake);
  const retakeTests  = assignedTests.filter(t => t.isRetake);

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar role="student" />
        <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 xl:p-10 custom-scrollbar">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-6">
            <div>
              <span className="text-[9px] font-black text-white/35 uppercase tracking-[0.3em]">Student Portal</span>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3 mt-1.5">
                <ClipboardList className="w-8 h-8 text-[#0052cc]" /> Assessments
              </h1>
            </div>
            <div className="flex items-center gap-4 text-white/30">
              <NotificationDropdown />
            </div>
          </header>

          <div className="grid grid-cols-3 gap-8 mb-8">
            {/* Join Session Card */}
            <div className="col-span-1">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="jira-premium-card !p-8 flex flex-col items-center text-center h-full"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#0052cc]/10 flex items-center justify-center text-[#0052cc] mb-6 border border-[#0052cc]/20">
                  <Shield size={28} />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2">Join Session</h3>
                <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mb-6">
                  Enter token or scan QR code
                </p>

                {/* Mode Toggle */}
                <div className="grid grid-cols-2 gap-2 w-full mb-6">
                  <button
                    onClick={() => setEntryMode('qr')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      entryMode === 'qr'
                        ? 'bg-[#0052cc]/10 border-[#0052cc] text-[#0052cc]'
                        : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/10'
                    }`}
                  >
                    <QrCode size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Scan QR</span>
                  </button>
                  <button
                    onClick={() => setEntryMode('manual')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                      entryMode === 'manual'
                        ? 'bg-[#0052cc]/10 border-[#0052cc] text-[#0052cc]'
                        : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/10'
                    }`}
                  >
                    <LinkIcon size={18} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Manual</span>
                  </button>
                </div>

                {/* Token Input */}
                <div className="w-full space-y-3">
                  <input
                    type="text"
                    placeholder={entryMode === 'qr' ? 'Paste QR token here' : 'Enter Exam ID or Token'}
                    value={sessionToken}
                    onChange={(e) => { setSessionToken(e.target.value); setTokenError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinByToken()}
                    className={`w-full bg-white/[0.03] border rounded-xl py-3 text-center text-sm font-black uppercase tracking-[0.2em] text-white placeholder:text-white/10 focus:border-[#0052cc]/40 outline-none transition-all ${
                      tokenError ? 'border-red-500/40' : 'border-white/5'
                    }`}
                  />
                  <AnimatePresence>
                    {tokenError && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-red-400 text-[10px] font-black uppercase tracking-wider px-1"
                      >
                        <AlertCircle size={12} /> {tokenError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <button
                    onClick={handleJoinByToken}
                    disabled={tokenLoading}
                    className="w-full jira-btn-primary !py-3 text-[11px] flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {tokenLoading
                      ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      : <Play size={14} className="fill-current" />
                    }
                    {tokenLoading ? 'Verifying...' : 'Authorize Entry'}
                    {!tokenLoading && <ChevronRight size={14} />}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* Available Tests Panel */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <ClipboardList size={12} /> Assigned Assessments
                </h2>
                <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">
                  {regularTests.length} available
                </span>
              </div>

              {testsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-white/[0.02] border border-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : regularTests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/5 rounded-2xl">
                  <ClipboardList className="w-12 h-12 text-white/10 mb-4" />
                  <p className="text-[11px] text-white/20 uppercase tracking-widest">No assessments assigned yet.</p>
                  <p className="text-[10px] text-white/10 uppercase tracking-widest mt-1">
                    Contact your instructor or use the session token.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {regularTests.map((test, i) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="glass-card !p-5 rounded-xl border border-white/5 flex items-center justify-between gap-4 hover:border-[#0052cc]/30 transition-all group"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#0052cc]/10 flex items-center justify-center shrink-0 group-hover:bg-[#0052cc]/20 transition-colors">
                          <Layers size={16} className="text-[#0052cc]" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-white truncate">{test.title}</h4>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className="text-[9px] font-black text-white/30 uppercase flex items-center gap-1">
                              <Clock size={9} /> {test.duration} min
                            </span>
                            <span className="text-[9px] font-black text-white/30 uppercase">
                              {test.questions?.length || test.questionCount || 0} Qs
                            </span>
                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                              test.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400' :
                              test.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                              'bg-amber-500/10 text-amber-400'
                            }`}>
                              {test.difficulty || 'Medium'}
                            </span>
                            {test.dueDate && (
                              <span className="text-[8px] font-black text-amber-400 flex items-center gap-1">
                                <Calendar size={8} /> Due {new Date(test.dueDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Link
                        href={`/env-check?examId=${test.id}`}
                        className="jira-btn-primary !py-2 !px-4 text-[9px] flex items-center gap-2 shrink-0"
                      >
                        <Play size={11} className="fill-current" /> Start
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Retakes section */}
              {retakeTests.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw size={12} className="text-amber-400" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                      Retake Assignments ({retakeTests.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {retakeTests.map((test, i) => (
                      <motion.div
                        key={`retake-${test.id}-${i}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card !p-4 rounded-xl border border-amber-400/15 flex items-center justify-between gap-4 hover:border-amber-400/30 transition-all"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-amber-400/10 flex items-center justify-center shrink-0">
                            <RefreshCw size={14} className="text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-white truncate">{test.title}</p>
                            <p className="text-[9px] text-amber-400/70 uppercase tracking-widest mt-0.5">Retake</p>
                          </div>
                        </div>
                        <Link
                          href={`/env-check?examId=${test.id}`}
                          className="bg-amber-400/10 border border-amber-400/20 text-amber-400 hover:bg-amber-400/20 transition-all !py-2 !px-4 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 shrink-0"
                        >
                          <Play size={11} className="fill-current" /> Start Retake
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
