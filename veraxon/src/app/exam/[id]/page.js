'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import ExamTimer from '@/components/ExamTimer';
import QuestionCard from '@/components/QuestionCard';
import ProctoringCamera from '@/components/ProctoringCamera';
import { VeraxonLogo } from '@/lib/brand';

/* ── Question status colours ─────────────────────────────────── */
// gray   = not visited
// yellow = visited but not answered
// green  = answered
// blue   = current
// red    = flagged
function qStatus(idx, current, answers, flags, visited) {
  if (idx === current)              return 'current';
  if (flags.has(idx))               return 'flagged';
  if (answers[idx] !== null && answers[idx] !== undefined) return 'answered';
  if (visited.has(idx))             return 'visited';
  return 'unvisited';
}

const STATUS_STYLES = {
  unvisited: 'bg-white/[0.04] border-white/[0.07] text-white/30 hover:border-white/20',
  visited:   'bg-amber-400/10 border-amber-400/30 text-amber-400',
  answered:  'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  current:   'bg-[#0052cc] border-[#0052cc] text-white shadow-[0_0_12px_rgba(0,82,204,0.5)] scale-110',
  flagged:   'bg-red-500/10 border-red-500/30 text-red-400',
};

/* ── Pre-exam env check ──────────────────────────────────────── */
function EnvCheck({ onPass, examTitle }) {
  const [checks, setChecks] = useState({
    camera: 'pending', mic: 'pending', browser: 'pending',
    internet: 'pending', fullscreen: 'pending',
  });
  const [agreed, setAgreed] = useState(false);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const upd = (k, v) => setChecks(p => ({ ...p, [k]: v }));

    upd('browser', navigator.mediaDevices?.getUserMedia ? 'passed' : 'failed');
    upd('fullscreen', !!document.documentElement.requestFullscreen ? 'passed' : 'passed');
    upd('internet', navigator.onLine ? 'passed' : 'failed');

    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      s.getTracks().forEach(t => t.stop());
      upd('camera', 'passed');
      upd('mic', 'passed');
    } catch {
      upd('camera', 'failed');
      upd('mic', 'failed');
    }
    setRunning(false);
  };

  useEffect(() => { run(); }, []);

  const allPassed = Object.values(checks).every(v => v === 'passed') && agreed;

  const CheckRow = ({ label, status }) => (
    <div className={`flex items-center justify-between px-5 py-3.5 rounded-xl border transition-all ${
      status === 'passed'  ? 'bg-emerald-500/5 border-emerald-500/20' :
      status === 'failed'  ? 'bg-red-500/5 border-red-500/20' :
      'bg-white/[0.02] border-white/[0.06]'
    }`}>
      <span className="text-[12px] font-semibold text-white/80">{label}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${
        status === 'passed'  ? 'text-emerald-400 bg-emerald-500/10' :
        status === 'failed'  ? 'text-red-400 bg-red-500/10' :
        'text-amber-400 bg-amber-400/10 animate-pulse'
      }`}>
        {status === 'passed' ? 'Ready' : status === 'failed' ? 'Failed' : 'Checking…'}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6 font-inter">
      <div className="ambient-matrix-bg opacity-20" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl z-10"
      >
        <div className="text-center mb-8">
          <VeraxonLogo size="SM" theme="dark" className="mx-auto mb-5 opacity-80" />
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Pre-Exam Check
          </h1>
          {examTitle && (
            <p className="text-[11px] text-white/35 uppercase tracking-widest mt-2">{examTitle}</p>
          )}
        </div>

        <div className="jira-premium-card !p-6 space-y-3 mb-5">
          <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.25em] mb-4">
            System Requirements
          </p>
          <CheckRow label="Camera"      status={checks.camera} />
          <CheckRow label="Microphone"  status={checks.mic} />
          <CheckRow label="Browser"     status={checks.browser} />
          <CheckRow label="Internet"    status={checks.internet} />
          <CheckRow label="Fullscreen"  status={checks.fullscreen} />
        </div>

        <div className="jira-premium-card !p-5 mb-5">
          <p className="text-[11px] text-white/50 leading-relaxed mb-4">
            By starting this exam you agree to AI-based proctoring including face monitoring,
            voice detection, and object detection throughout the session.
            Any violation may result in automatic submission.
          </p>
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox" checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="w-4 h-4 accent-[#0052cc] cursor-pointer"
            />
            <span className="text-[12px] font-semibold text-white/60 group-hover:text-white transition-colors">
              I accept the monitoring terms and conditions
            </span>
          </label>
        </div>

        <div className="flex gap-3">
          <button
            onClick={run} disabled={running}
            className="jira-btn-secondary !py-3 !px-5 text-[11px] flex-shrink-0"
          >
            {running ? 'Checking…' : 'Re-run'}
          </button>
          <button
            onClick={onPass} disabled={!allPassed}
            className={`flex-1 !py-3 text-[12px] font-black flex items-center justify-center gap-2 ${
              allPassed ? 'jira-btn-primary' : 'bg-white/[0.04] text-white/20 rounded-xl cursor-not-allowed border border-white/[0.06]'
            }`}
          >
            {allPassed ? 'Begin Exam' : 'Complete checks to continue'}
            {allPassed && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Violation modal ─────────────────────────────────────────── */
function ViolationModal({ message, count, maxViolations, onDismiss }) {
  const isFinal = count >= maxViolations;
  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-md rounded-2xl border p-8 text-center ${
          isFinal ? 'border-red-500/40 bg-[#120808]' : 'border-amber-400/30 bg-[#12100a]'
        }`}
      >
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center ${
          isFinal ? 'bg-red-500/15' : 'bg-amber-400/10'
        }`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className={isFinal ? 'text-red-400' : 'text-amber-400'}>
            <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2 className={`text-xl font-black uppercase italic tracking-tight mb-2 ${isFinal ? 'text-red-400' : 'text-amber-400'}`}>
          {isFinal ? 'Exam Terminated' : `Warning ${count} / ${maxViolations - 1}`}
        </h2>
        <p className="text-[12px] text-white/55 leading-relaxed mb-6">{message}</p>
        <div className="flex gap-1 justify-center mb-5">
          {Array.from({ length: maxViolations - 1 }).map((_, i) => (
            <div key={i} className={`w-8 h-1.5 rounded-full ${i < count ? 'bg-red-500' : 'bg-white/10'}`} />
          ))}
        </div>
        {!isFinal && (
          <button onClick={onDismiss} className="jira-btn-danger w-full !py-3 text-[12px]">
            I understand — return to exam
          </button>
        )}
      </motion.div>
    </div>
  );
}

/* ── Main exam page ──────────────────────────────────────────── */
const MAX_VIOLATIONS = 4; // warn at 1,2,3 → auto-submit at 4

export default function LiveExamPage({ params }) {
  const examId = params.id;
  const router = useRouter();
  const { user, userData, loading: authLoading } = useAuth();

  const [exam,             setExam]             = useState(null);
  const [answers,          setAnswers]           = useState([]);
  const [flagged,          setFlagged]           = useState(new Set());
  const [visited,          setVisited]           = useState(new Set([0]));
  const [currentIdx,       setCurrentIdx]        = useState(0);
  const [gatewayPassed,    setGatewayPassed]     = useState(false);
  const [pageLoading,      setPageLoading]       = useState(true);
  const [submitting,       setSubmitting]        = useState(false);
  const [syncStatus,       setSyncStatus]        = useState('saved'); // saved | saving | offline
  const [violations,       setViolations]        = useState(0);
  const [showModal,        setShowModal]         = useState(false);
  const [modalMsg,         setModalMsg]          = useState('');
  const [showConfirmSubmit,setShowConfirmSubmit] = useState(false);

  const violationsRef = useRef(0);
  violationsRef.current = violations;

  /* ── Auth guard ─────────────────────────────────── */
  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  /* ── Load exam data ─────────────────────────────── */
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        let snap = await getDoc(doc(db, 'tests', examId));
        if (!snap.exists()) snap = await getDoc(doc(db, 'exams', examId));
        if (!snap.exists()) throw new Error('Exam not found');
        const data = snap.data();
        setExam({ id: examId, ...data });
        const backup = localStorage.getItem(`vx_bk_${examId}_${user.uid}`);
        setAnswers(backup ? JSON.parse(backup) : new Array(data.questions?.length || 0).fill(null));
      } catch { router.push('/student/dashboard'); }
      finally  { setPageLoading(false); }
    })();
  }, [examId, user, router]);

  /* ── Navigate to question ───────────────────────── */
  const goTo = useCallback((idx) => {
    setVisited(v => new Set(v).add(idx));
    setCurrentIdx(idx);
  }, []);

  /* ── Answer selection ───────────────────────────── */
  const handleAnswer = useCallback((val) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentIdx] = val;
      localStorage.setItem(`vx_bk_${examId}_${user?.uid}`, JSON.stringify(next));
      saveProgress(next);
      return next;
    });
  }, [currentIdx, examId, user]);

  /* ── Flag toggle ────────────────────────────────── */
  const toggleFlag = useCallback(() => {
    setFlagged(f => {
      const next = new Set(f);
      next.has(currentIdx) ? next.delete(currentIdx) : next.add(currentIdx);
      return next;
    });
  }, [currentIdx]);

  /* ── Save progress ──────────────────────────────── */
  const saveProgress = useCallback(async (ans) => {
    if (!user || !navigator.onLine) { setSyncStatus('offline'); return; }
    setSyncStatus('saving');
    try {
      await setDoc(doc(db, 'submissions', `${examId}_${user.uid}`), {
        examId, userId: user.uid,
        userName: userData?.username || '',
        answers: ans,
        lastUpdated: serverTimestamp(),
        status: 'in-progress',
      }, { merge: true });
      setSyncStatus('saved');
    } catch { setSyncStatus('offline'); }
  }, [examId, user, userData]);

  /* ── Violation handler ──────────────────────────── */
  const handleViolation = useCallback(async (reason, severity = 'warning') => {
    const count = violationsRef.current + 1;
    setViolations(count);

    try {
      await setDoc(doc(db, 'infractions', `${examId}_${user?.uid}_${Date.now()}`), {
        examId, studentId: user?.uid,
        studentName: userData?.username || 'Unknown',
        type: reason, severity: count >= MAX_VIOLATIONS ? 'breach' : severity,
        timestamp: serverTimestamp(),
      });
    } catch { /* non-blocking */ }

    if (count >= MAX_VIOLATIONS) {
      setModalMsg('Maximum violations reached. Your exam has been automatically submitted.');
      setShowModal(true);
      setTimeout(() => submitExam({ disqualified: true }), 3500);
    } else {
      const remaining = MAX_VIOLATIONS - 1 - count;
      setModalMsg(
        `Violation detected: ${reason.replace(/_/g, ' ')}. ` +
        (remaining > 0
          ? `${remaining} warning${remaining > 1 ? 's' : ''} remaining before auto-submission.`
          : 'This is your final warning.')
      );
      setShowModal(true);
    }
  }, [examId, user, userData]);

  /* ── Browser security events ────────────────────── */
  useEffect(() => {
    if (!gatewayPassed || submitting) return;
    const block = (e) => e.preventDefault();
    ['contextmenu','copy','cut','paste'].forEach(ev => document.addEventListener(ev, block));

    const onHide      = () => { if (document.visibilityState === 'hidden') handleViolation('tab_switch'); };
    const onBlur      = () => handleViolation('window_focus_lost');
    const onFullscreen= () => { if (!document.fullscreenElement) handleViolation('fullscreen_exit'); };
    const onViolEvent = (e) => handleViolation(e.detail?.type || e.detail, e.detail?.severity);

    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreen);
    window.addEventListener('veraxon:violation', onViolEvent);

    return () => {
      ['contextmenu','copy','cut','paste'].forEach(ev => document.removeEventListener(ev, block));
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.removeEventListener('veraxon:violation', onViolEvent);
    };
  }, [gatewayPassed, submitting, handleViolation]);

  /* ── Submit exam ────────────────────────────────── */
  const submitExam = useCallback(async ({ disqualified = false } = {}) => {
    if (submitting) return;
    setSubmitting(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      const ref = doc(db, 'submissions', `${examId}_${user?.uid}`);
      await updateDoc(ref, {
        status: disqualified ? 'disqualified' : 'completed',
        completedAt: serverTimestamp(),
        finalAnswers: answers,
        totalViolations: violationsRef.current,
      });
      localStorage.removeItem(`vx_bk_${examId}_${user?.uid}`);
    } catch { /* continue to redirect anyway */ }
    router.push('/student/dashboard');
  }, [submitting, examId, user, answers, router]);

  /* ── Enter fullscreen ───────────────────────────── */
  const enterExam = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch { /* fullscreen optional */ }
    setGatewayPassed(true);
  };

  /* ── Early returns ──────────────────────────────── */
  if (pageLoading || authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  if (!gatewayPassed) {
    return <EnvCheck examTitle={exam?.title} onPass={enterExam} />;
  }

  if (!exam) return null;

  const questions   = exam.questions ?? [];
  const totalQ      = questions.length;
  const answered    = answers.filter(a => a !== null && a !== undefined).length;
  const currentQ    = questions[currentIdx];

  const syncLabel = { saved: 'Saved', saving: 'Saving…', offline: 'Offline' }[syncStatus];
  const syncColor = { saved: 'text-emerald-400', saving: 'text-amber-400', offline: 'text-red-400' }[syncStatus];

  /* ── Render ─────────────────────────────────────── */
  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden select-none">

      {/* ── Violation modal ────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <ViolationModal
            message={modalMsg}
            count={violations}
            maxViolations={MAX_VIOLATIONS}
            onDismiss={() => setShowModal(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Submit confirm ─────────────────────────── */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-[200] bg-black/85 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm jira-premium-card !p-8 text-center"
            >
              <h2 className="text-xl font-black text-white uppercase italic mb-2">Submit Exam?</h2>
              <p className="text-[12px] text-white/45 mb-1">{answered} of {totalQ} questions answered.</p>
              {answered < totalQ && (
                <p className="text-[11px] text-amber-400 mb-5">{totalQ - answered} unanswered</p>
              )}
              {answered === totalQ && <div className="mb-5" />}
              <div className="flex gap-3">
                <button onClick={() => setShowConfirmSubmit(false)} className="flex-1 jira-btn-secondary !py-3 text-[11px]">
                  Cancel
                </button>
                <button onClick={() => submitExam()} className="flex-1 jira-btn-primary !py-3 text-[11px]">
                  Submit
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Top header bar ─────────────────────────── */}
      <header className="h-14 bg-[#07080a] border-b border-white/[0.07] flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-4">
          <VeraxonLogo size="XS" theme="dark" className="opacity-70" />
          <div className="w-px h-5 bg-white/10" />
          <div className="hidden sm:block">
            <p className="text-[11px] font-bold text-white/80 leading-tight truncate max-w-[220px]">{exam.title}</p>
            <p className="text-[9px] text-white/30 uppercase tracking-widest">
              {answered}/{totalQ} answered
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className={`text-[9px] font-black uppercase tracking-widest ${syncColor}`}>{syncLabel}</span>
          <div className="w-px h-5 bg-white/10" />
          <ExamTimer initialMinutes={exam.duration ?? 60} onTimeUp={() => submitExam()} />
          <div className="w-px h-5 bg-white/10" />
          {violations > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              <span className="text-[10px] font-black text-red-400">{violations} violation{violations > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Three-column body ──────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Camera + AI panel ──────────────── */}
        <aside className="w-72 xl:w-80 bg-[#07080a] border-r border-white/[0.06] flex flex-col p-4 gap-4 overflow-y-auto shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-white/35 uppercase tracking-[0.2em]">Proctoring</span>
            <span className="flex items-center gap-1.5 text-[9px] font-black text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> LIVE
            </span>
          </div>
          <ProctoringCamera
            examId={examId}
            studentId={user?.uid}
            studentName={userData?.username}
            onViolation={(type, severity) => handleViolation(type, severity)}
          />
        </aside>

        {/* ── CENTER: Question workspace ───────────── */}
        <main className="flex-1 overflow-y-auto flex flex-col custom-scrollbar">
          <div className="flex-1 flex flex-col items-center justify-start p-6 xl:p-10">
            <div className="w-full max-w-2xl">

              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                    Progress
                  </span>
                  <span className="text-[10px] font-bold text-white/30">
                    {Math.round((answered / totalQ) * 100)}%
                  </span>
                </div>
                <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0052cc] rounded-full transition-all duration-500"
                    style={{ width: `${(answered / totalQ) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question card */}
              <AnimatePresence mode="wait">
                <QuestionCard
                  key={currentIdx}
                  question={currentQ}
                  selectedAnswer={answers[currentIdx]}
                  onSelectOption={handleAnswer}
                  isFlagged={flagged.has(currentIdx)}
                  onToggleFlag={toggleFlag}
                  questionNumber={currentIdx + 1}
                  totalQuestions={totalQ}
                />
              </AnimatePresence>

              {/* Prev / Next navigation */}
              <div className="flex items-center justify-between mt-8 gap-4">
                <button
                  onClick={() => currentIdx > 0 && goTo(currentIdx - 1)}
                  disabled={currentIdx === 0}
                  className="jira-btn-secondary !py-2.5 !px-6 text-[11px] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ← Previous
                </button>
                <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">
                  {currentIdx + 1} / {totalQ}
                </span>
                {currentIdx < totalQ - 1 ? (
                  <button
                    onClick={() => goTo(currentIdx + 1)}
                    className="jira-btn-primary !py-2.5 !px-6 text-[11px]"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirmSubmit(true)}
                    className="jira-btn-primary !py-2.5 !px-6 text-[11px] !bg-emerald-600 hover:!bg-emerald-500"
                  >
                    Submit Exam
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* ── RIGHT: Question navigator ─────────────── */}
        <aside className="w-60 xl:w-68 bg-[#07080a] border-l border-white/[0.06] flex flex-col p-4 overflow-y-auto shrink-0">

          {/* Legend */}
          <div className="mb-4">
            <p className="text-[10px] font-black text-white/35 uppercase tracking-[0.2em] mb-3">
              Question Status
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-bold text-white/40">
              {[
                { color: 'bg-white/[0.06]',       label: 'Not Visited' },
                { color: 'bg-amber-400/20',       label: 'Visited' },
                { color: 'bg-emerald-500/20',     label: 'Answered' },
                { color: 'bg-[#0052cc]',          label: 'Current' },
                { color: 'bg-red-500/20',         label: 'Flagged' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${color} shrink-0`} />
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="w-full h-px bg-white/[0.05] mb-4" />

          {/* Grid */}
          <div className="grid grid-cols-5 gap-2 mb-6">
            {questions.map((_, idx) => {
              const st = qStatus(idx, currentIdx, answers, flagged, visited);
              return (
                <button
                  key={idx}
                  onClick={() => goTo(idx)}
                  className={`h-9 rounded-lg text-[11px] font-black border transition-all duration-150 ${STATUS_STYLES[st]}`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Summary stats */}
          <div className="mt-auto space-y-2 pt-4 border-t border-white/[0.05]">
            {[
              { label: 'Answered',    count: answers.filter(a => a !== null && a !== undefined).length, color: 'text-emerald-400' },
              { label: 'Unanswered',  count: totalQ - answers.filter(a => a !== null && a !== undefined).length, color: 'text-white/40' },
              { label: 'Flagged',     count: flagged.size, color: 'text-red-400' },
            ].map(({ label, count, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/35">{label}</span>
                <span className={`text-[11px] font-black ${color}`}>{count}</span>
              </div>
            ))}
          </div>

          {/* Submit button */}
          <button
            onClick={() => setShowConfirmSubmit(true)}
            className="mt-4 jira-btn-primary !py-3 text-[11px] w-full"
          >
            Submit Exam
          </button>
        </aside>
      </div>
    </div>
  );
}
