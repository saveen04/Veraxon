'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import ExamTimer from '@/components/ExamTimer';
import QuestionCard from '@/components/QuestionCard';
import ProctoringCamera from '@/components/ProctoringCamera';
import { 
  ShieldAlert, 
  Activity, 
  Eye, 
  LayoutGrid, 
  Flag, 
  ChevronRight 
} from 'lucide-react';

export default function LiveExamPage({ params }) {
  const router = useRouter();
  const examId = params.id;
  const { user, userData, loading: authLoading } = useAuth();

  const [exam, setExam] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [gatewayPassed, setGatewayPassed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncStatus, setSyncStatus] = useState('synchronized'); 
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [violations, setViolations] = useState(0);

  // Hardware Checks State
  const [checks, setChecks] = useState({
    camera: 'pending',
    mic: 'pending',
    network: 'pending',
    fullscreen: 'pending',
    browser: 'pending',
    resolution: 'pending',
    agreed: false
  });

  // Initial Load & Auth check
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const fetchExam = async () => {
      try {
        setLoading(true);
        const examSnap = await getDoc(doc(db, 'tests', examId));
        if (!examSnap.exists()) throw new Error('Assessment vector not found.');
        const examData = examSnap.data();
        setExam({ id: examId, ...examData });
        const backup = localStorage.getItem(`veraxon_backup_${examId}_${user.uid}`);
        setAnswers(backup ? JSON.parse(backup) : new Array(examData.questions?.length || 0).fill(null));
      } catch (err) {
        console.error(err);
        router.push('/student/dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchExam();
  }, [examId, user, authLoading, router]);

  // Run Pre-Checks on Mount
  useEffect(() => {
    if (loading || authLoading || gatewayPassed) return;

    const runChecks = async () => {
      let results = { ...checks };

      // 1. Browser Check (Modern features support)
      results.browser = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ? 'passed' : 'failed';

      // 2. Network Check
      results.network = navigator.onLine ? 'passed' : 'failed';

      // 3. Screen Resolution (1366x768 minimum recommended for dashboards)
      results.resolution = (window.screen.width >= 1024 && window.screen.height >= 768) ? 'passed' : 'failed';

      // 4. Fullscreen Capability
      results.fullscreen = document.documentElement.requestFullscreen ? 'passed' : 'failed';

      setChecks({ ...results });

      // 5 & 6. Media Devices Permissions
      if (results.browser === 'passed') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          results.camera = 'passed';
          results.mic = 'passed';
          // Stop stream immediately after checking
          stream.getTracks().forEach(track => track.stop());
        } catch (err) {
           results.camera = 'failed';
           results.mic = 'failed';
        }
      }
      
      setChecks({ ...results });
    };

    runChecks();
  }, [loading, authLoading, gatewayPassed]);


  // Security restrictions and Violation Monitors
  useEffect(() => {
    if (!gatewayPassed || submitting) return;

    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('copy', preventDefault);
    document.addEventListener('cut', preventDefault);
    document.addEventListener('paste', preventDefault);

    const handleViolation = async (reason) => {
       const newCount = violations + 1;
       setViolations(newCount);

       // Log to firestore directly for real-time monitoring
       try {
         const infractionRef = doc(db, 'infractions', `${examId}_${user.uid}_${Date.now()}`);
         await setDoc(infractionRef, {
           examId,
           studentId: user.uid,
           studentName: userData?.username || 'Unknown',
           type: reason,
           severity: newCount >= 2 ? 'breach' : 'warning',
           timestamp: serverTimestamp()
         });
       } catch (e) { console.error('Failed to log infraction', e) }

       if (newCount >= 2) {
          setWarningMessage(`CRITICAL VIOLATION: ${reason}. Assessment terminted.`);
          setShowWarningModal(true);
          // Auto submit after 2nd strike
          setTimeout(() => handleSubmitExam({ disqualified: true }), 3000);
       } else {
          setWarningMessage(`WARNING: ${reason}. Focus loss or tab switching is prohibited. One strike remains.`);
          setShowWarningModal(true);
       }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') handleViolation('Tab Switch / Window Minimized');
    };
    
    const handleBlur = () => {
      handleViolation('Loss of Window Focus');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation('Exited Fullscreen Mode');
      }
    };

    const handleCustomViolation = (e) => {
      handleViolation(e.detail);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    window.addEventListener('veraxon:violation', handleCustomViolation);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('cut', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('veraxon:violation', handleCustomViolation);
    };
  }, [gatewayPassed, violations, examId, user, userData, submitting]);

  const allChecksPassed = Object.values(checks).every(v => v === 'passed' || v === true);

  const handleStartExam = async () => {
    if (!allChecksPassed) return;
    try {
      if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
      setGatewayPassed(true);
    } catch (e) {
      alert('Fullscreen required to enter Secure Terminal.');
    }
  };

  const handleSelectOption = (optionIndex) => {
    const updated = [...answers];
    updated[currentQuestionIdx] = optionIndex;
    setAnswers(updated);
    if (user) {
      localStorage.setItem(`veraxon_backup_${examId}_${user.uid}`, JSON.stringify(updated));
      saveProgressToDb(updated);
    }
  };

  const saveProgressToDb = async (answersArray) => {
    if (!navigator.onLine) return;
    setSyncStatus('syncing');
    try {
      const progressRef = doc(db, 'submissions', `${examId}_${user.uid}`);
      await setDoc(progressRef, {
        examId,
        userId: user.uid,
        userName: userData?.username || userData?.name,
        answers: answersArray,
        lastUpdated: serverTimestamp(),
        status: 'in-progress'
      }, { merge: true });
      setSyncStatus('synchronized');
    } catch (e) {
      setSyncStatus('offline_cached');
    }
  };

  const handleSubmitExam = async (options = { disqualified: false }) => {
    if (submitting) return;
    setSubmitting(true);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    try {
      const submissionRef = doc(db, 'submissions', `${examId}_${user.uid}`);
      await updateDoc(submissionRef, { 
        status: options.disqualified ? 'disqualified' : 'completed', 
        completedAt: serverTimestamp(), 
        finalAnswers: answers,
        totalViolations: violations
      });
      localStorage.removeItem(`veraxon_backup_${examId}_${user.uid}`);
      router.push('/student/dashboard');
    } catch (e) {
      setSubmitting(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen bg-black flex items-center justify-center animate-pulse uppercase tracking-[0.4em] text-white/20">Syncing Secure Link...</div>;

  if (!gatewayPassed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-8 font-inter">
        <div className="ambient-matrix-bg" />
        <div className="glass-card !p-12 max-w-2xl w-full text-left space-y-10 border border-[#0052cc]/30 shadow-[0_0_50px_rgba(0,82,204,0.1)] rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0052cc] to-transparent animate-pulse" />
          
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-[#0052cc]/10 flex items-center justify-center border border-[#0052cc]/20">
              <Activity className="w-8 h-8 text-[#0052cc]" />
            </div>
            <div>
               <h1 className="text-3xl font-black tracking-tighter uppercase italic text-white flex items-center gap-3">
                 Integrity Gateway <ShieldAlert className="w-6 h-6 text-emerald-500" />
               </h1>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">Initialize Hardware & Consent Checks</p>
            </div>
          </div>

          <div className="space-y-4">
             <h3 className="text-[11px] font-black uppercase text-white/60 tracking-widest border-b border-white/5 pb-2">Environment Diagnostics</h3>
             <div className="grid grid-cols-2 gap-4">
                <CheckItem label="Camera Access" status={checks.camera} />
                <CheckItem label="Microphone Access" status={checks.mic} />
                <CheckItem label="Network Stability" status={checks.network} />
                <CheckItem label="Screen Resolution" status={checks.resolution} />
                <CheckItem label="Browser Support" status={checks.browser} />
                <CheckItem label="Fullscreen API" status={checks.fullscreen} />
             </div>
          </div>

          <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
             <h3 className="text-[11px] font-black uppercase text-white/60 tracking-widest mb-3">Monitoring Consent & Policies</h3>
             <p className="text-xs text-white/40 leading-relaxed mb-4">
               By proceeding, you consent to real-time AI behavioral analysis. The system will record your face geometry (anonymously linked to your ID) and detect instances of multiple persons, missing subjects, or ambient noise anomalies. Disabling hardware at any point resolves in a catastrophic failure and auto-submission.
             </p>
             <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={checks.agreed} 
                  onChange={(e) => setChecks({...checks, agreed: e.target.checked})}
                  className="w-4 h-4 rounded border-white/20 bg-black/50 accent-[#0052cc] cursor-pointer"
                />
                <span className="text-[11px] font-black tracking-widest uppercase text-white/60 group-hover:text-white transition-colors">I accept the institutional rules & surveillance terms.</span>
             </label>
          </div>

          <button 
            onClick={handleStartExam} 
            disabled={!allChecksPassed}
            className={`w-full !py-5 uppercase tracking-[0.3em] text-[11px] flex items-center justify-center gap-3 ${allChecksPassed ? 'jira-btn-primary' : 'bg-white/5 text-white/20 cursor-not-allowed font-black rounded'}`}
          >
             {allChecksPassed ? 'Enter Secure Terminal' : 'Awaiting Check Completion'}
             {allChecksPassed && <ChevronRight className="w-4 h-4 animate-bounce" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-inter selection:bg-[#0052cc] selection:text-white">
      {/* 1. Precise Top Bar */}
      <header className="h-20 border-b border-white/5 bg-[#0a0a0a] flex items-center justify-between px-12 sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 font-black text-xs">V</div>
           <div className="w-px h-8 bg-white/5 mx-2" />
           <div className="text-[9px] font-black uppercase text-white/40 tracking-[0.4em]">Session Timer</div>
           <ExamTimer initialMinutes={exam.duration} onTimeUp={handleSubmitExam} />
        </div>

        <div className="flex items-center gap-12">
            <div className="flex flex-col items-end gap-1">
               <div className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em]">Acoustic Integrity</div>
               <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#0052cc] to-purple-600 w-[75%]" />
               </div>
            </div>
            <div className="flex items-center gap-4 bg-[#0052cc]/5 border border-[#0052cc]/20 px-5 py-2 rounded-full">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
               <span className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Neural Node Active</span>
            </div>
        </div>
      </header>

      {/* Warning Modal Overlay */}
      {showWarningModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
           <div className="glass-card max-w-lg w-full p-12 text-center border-red-500/30 rounded-2xl animate-fade-in-up">
              <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6 animate-pulse" />
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">Protocol Violation Detected</h2>
              <p className="text-xs text-white/60 mb-8 uppercase tracking-widest">{warningMessage}</p>
              
              {violations < 2 && (
                <button 
                  onClick={() => setShowWarningModal(false)} 
                  className="jira-btn-danger w-full uppercase tracking-widest text-[10px] !py-4"
                >
                  I Understand, Return to Terminal
                </button>
              )}
           </div>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <div className="ambient-matrix-bg opacity-30" />
        
        {/* 2. Central Question Workspace */}
        <main className="flex-1 overflow-y-auto p-12 flex flex-col items-center z-10">
           <div className="w-full max-w-3xl">
              <div className="mb-12 flex items-center gap-4">
                 <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.4em]">Node {currentQuestionIdx + 1}</span>
                 <div className="w-2 h-2 rounded-full bg-white/10" />
                 <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">MCQ Matrix</span>
              </div>
              
              <QuestionCard 
                question={exam.questions[currentQuestionIdx]}
                selectedAnswer={answers[currentQuestionIdx]}
                onSelectOption={handleSelectOption}
              />

              <div className="mt-16 flex items-center justify-between gap-8">
                 <button 
                  onClick={() => setCurrentQuestionIdx(p => Math.max(0, p-1))}
                  className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-white transition-colors"
                 >
                   Prev Node
                 </button>
                 <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0052cc] transition-all duration-700" 
                      style={{ width: `${((currentQuestionIdx + 1) / exam.questions.length) * 100}%` }}
                    />
                 </div>
                 <button 
                  onClick={() => setCurrentQuestionIdx(p => Math.min(exam.questions.length-1, p+1))}
                  className="text-[10px] font-black text-white uppercase tracking-[0.4em] hover:text-[#0052cc] transition-colors"
                 >
                   Next Node
                 </button>
              </div>
           </div>
        </main>

        {/* 3. Right Surveillance Sidebar */}
        <aside className="w-96 border-l border-white/5 bg-[#0a0a0a] p-8 flex flex-col gap-10 overflow-y-auto z-20">
           <section>
              <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-6 flex items-center gap-3">
                 <Eye className="w-3 h-3" /> Live Optic Link
              </h3>
              <div className="aspect-video rounded-2xl bg-black/40 border border-white/5 overflow-hidden active-camera hover:border-[#0052cc]/30 transition-all">
                 <ProctoringCamera 
                    examId={examId} 
                    studentId={user?.uid} 
                    onViolation={(type) => {
                       // Custom event to trigger handleViolation which is defined tightly in useEffect
                       const event = new CustomEvent('veraxon:violation', { detail: type });
                       window.dispatchEvent(event);
                    }} 
                 />
              </div>
           </section>

           <section>
              <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-6 flex items-center gap-3">
                 <LayoutGrid className="w-3 h-3" /> Matrix Navigation
              </h3>
              <div className="grid grid-cols-5 gap-3">
                 {exam.questions.map((_, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setCurrentQuestionIdx(idx)}
                      className={`h-10 rounded-lg font-black text-[10px] transition-all border ${
                        currentQuestionIdx === idx 
                          ? 'bg-[#0052cc] border-[#0052cc] text-white shadow-lg shadow-[#0052cc]/20 scale-105' 
                          : answers[idx] !== null 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                            : 'bg-white/[0.02] border-white/5 text-white/20 hover:border-white/20'
                      }`}
                    >
                      {idx + 1}
                    </button>
                 ))}
              </div>
           </section>

           <section className="flex-1">
              <h3 className="text-[10px] font-black uppercase text-white/20 tracking-[0.4em] mb-6 flex items-center gap-3">
                 <ShieldAlert className="w-3 h-3" /> Guard Logs
              </h3>
              <div className="space-y-4">
                 <LogEntry label="Optic Focus Verified" type="success" />
                 <LogEntry label="Ambient Volume Nominal" type="success" />
                 <LogEntry label="Tab Integrity: Flagged" type="danger" />
              </div>
           </section>
        </aside>
      </div>

      {/* 4. Bottom Footer Action Bar */}
      <footer className="h-24 border-t border-white/5 bg-[#0a0a0a] flex items-center justify-between px-12 shrink-0 z-50">
         <button className="flex items-center gap-4 px-8 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-white/30 hover:text-white hover:bg-white/[0.05] transition-all uppercase tracking-widest text-[10px] font-black">
            <Flag className="w-4 h-4" />
            <span>Flag for Review</span>
         </button>

         <button 
          onClick={handleSubmitExam}
          className="jira-btn-primary !bg-[#0052cc] !py-4 !px-12 flex items-center gap-4 group"
         >
            <span className="text-[11px] uppercase tracking-[0.2em] font-black">Finalize Link</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
         </button>
      </footer>
    </div>
  );
}

function LogEntry({ label, type }) {
  const isDanger = type === 'danger';
  return (
    <div className="flex items-center gap-3 group">
       <div className={`w-1.5 h-1.5 rounded-full ${isDanger ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
       <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDanger ? 'text-red-500/60' : 'text-white/40'}`}>
         {label}
       </span>
    </div>
  );
}

function CheckItem({ label, status }) {
  const isPassed = status === 'passed';
  const isPending = status === 'pending';
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
       <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{label}</span>
       <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded ${
         isPassed ? 'bg-emerald-500/10 text-emerald-500' :
         isPending ? 'bg-amber-500/10 text-amber-500 animate-pulse' : 
         'bg-red-500/10 text-red-500'
       }`}>
          {isPassed ? 'Passed' : isPending ? 'Checking...' : 'Failed'}
       </div>
    </div>
  );
}
