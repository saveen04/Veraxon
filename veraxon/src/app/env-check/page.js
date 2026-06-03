'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Mic, Wifi, Monitor, Globe, Shield, CheckCircle2,
  XCircle, AlertCircle, ChevronRight, RefreshCw, Loader2
} from 'lucide-react';

const CHECKS = [
  { id: 'webcam', label: 'Webcam Access', icon: Camera, desc: 'Required for identity verification and proctoring' },
  { id: 'microphone', label: 'Microphone Access', icon: Mic, desc: 'Required for background noise detection' },
  { id: 'internet', label: 'Internet Speed', icon: Wifi, desc: 'Stable connection required for real-time sync' },
  { id: 'browser', label: 'Browser Compatibility', icon: Globe, desc: 'Modern browser with MediaDevices API' },
  { id: 'screen', label: 'Screen Resolution', icon: Monitor, desc: 'Minimum 1024×768 recommended' },
  { id: 'fullscreen', label: 'Fullscreen Support', icon: Shield, desc: 'Fullscreen mode enforced during exam' },
];

function getScore(results) {
  const total = CHECKS.length;
  const passed = Object.values(results).filter((v) => v === 'passed').length;
  return Math.round((passed / total) * 100);
}

export default function EnvironmentCheckPage() {
  const router = useRouter();
  const [results, setResults] = useState({});
  const [details, setDetails] = useState({});
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [examId, setExamId] = useState('');

  // Read examId from URL if coming from an exam link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setExamId(params.get('examId') || '');
    }
  }, []);

  const runChecks = async () => {
    setRunning(true);
    setDone(false);
    setResults({});
    setDetails({});

    const update = (id, status, detail = '') => {
      setResults((p) => ({ ...p, [id]: status }));
      setDetails((p) => ({ ...p, [id]: detail }));
    };

    // 1. Browser Compatibility
    update('browser', 'running');
    await delay(300);
    const hasMediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const hasFullscreen = !!document.documentElement.requestFullscreen;
    update('browser', hasMediaDevices ? 'passed' : 'failed',
      hasMediaDevices ? 'Chrome/Firefox/Edge — Fully Compatible' : 'Browser missing MediaDevices API');

    // 2. Screen Resolution
    update('screen', 'running');
    await delay(200);
    const w = window.screen.width, h = window.screen.height;
    update('screen', (w >= 1024 && h >= 768) ? 'passed' : 'failed',
      `${w}×${h} — ${w >= 1024 && h >= 768 ? 'Meets minimum requirement' : 'Below minimum 1024×768'}`);

    // 3. Fullscreen Support
    update('fullscreen', 'running');
    await delay(200);
    update('fullscreen', hasFullscreen ? 'passed' : 'failed',
      hasFullscreen ? 'Fullscreen API available' : 'Fullscreen not supported in this browser');

    // 4. Internet Speed (ping test)
    update('internet', 'running');
    try {
      const start = Date.now();
      await fetch('/api/stats', { method: 'HEAD', cache: 'no-store' }).catch(() => {});
      const ms = Date.now() - start;
      const ok = ms < 3000;
      update('internet', ok ? 'passed' : 'warning',
        ok ? `${ms}ms latency — Stable` : `${ms}ms latency — Slow connection detected`);
    } catch {
      update('internet', 'warning', 'Could not measure latency');
    }

    // 5. Webcam
    update('webcam', 'running');
    if (hasMediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
        update('webcam', 'passed', 'Webcam accessible and ready');
      } catch (e) {
        update('webcam', 'failed', `Camera denied: ${e.message}`);
      }
    } else {
      update('webcam', 'failed', 'Browser does not support camera access');
    }

    // 6. Microphone
    update('microphone', 'running');
    if (hasMediaDevices) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        update('microphone', 'passed', 'Microphone accessible and ready');
      } catch (e) {
        update('microphone', 'failed', `Mic denied: ${e.message}`);
      }
    } else {
      update('microphone', 'failed', 'Browser does not support audio access');
    }

    setRunning(false);
    setDone(true);
  };

  const score = getScore(results);
  const allCritical = results.webcam === 'passed' && results.microphone === 'passed' && results.browser === 'passed';

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8 font-inter text-white selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl z-10"
      >
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl bg-[#0052cc]/10 border border-[#0052cc]/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#0052cc]" />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white mb-2">
            Environment Check
          </h1>
          <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">
            System Readiness Diagnostic
          </p>
        </div>

        {/* Check Cards */}
        <div className="space-y-3 mb-8">
          {CHECKS.map((check) => {
            const status = results[check.id] || 'pending';
            const Icon = check.icon;

            return (
              <motion.div
                key={check.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`p-4 rounded-xl border flex items-center gap-4 transition-all ${
                  status === 'passed' ? 'border-emerald-500/20 bg-emerald-500/5' :
                  status === 'failed' ? 'border-red-500/20 bg-red-500/5' :
                  status === 'warning' ? 'border-amber-500/20 bg-amber-500/5' :
                  status === 'running' ? 'border-[#0052cc]/20 bg-[#0052cc]/5' :
                  'border-white/5 bg-white/[0.02]'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${
                  status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' :
                  status === 'failed' ? 'bg-red-500/10 text-red-400' :
                  status === 'warning' ? 'bg-amber-500/10 text-amber-400' :
                  status === 'running' ? 'bg-[#0052cc]/10 text-[#0052cc]' :
                  'bg-white/5 text-white/30'
                }`}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-black uppercase tracking-widest text-white">{check.label}</p>
                  <p className="text-[10px] text-white/40 mt-0.5">
                    {details[check.id] || check.desc}
                  </p>
                </div>

                <div className="shrink-0">
                  {status === 'running' ? (
                    <Loader2 size={16} className="text-[#0052cc] animate-spin" />
                  ) : status === 'passed' ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : status === 'failed' ? (
                    <XCircle size={16} className="text-red-400" />
                  ) : status === 'warning' ? (
                    <AlertCircle size={16} className="text-amber-400" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-white/10" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Score + Actions */}
        {done && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-2xl border mb-6 text-center ${
              score >= 80 ? 'border-emerald-500/30 bg-emerald-500/5' :
              score >= 50 ? 'border-amber-500/30 bg-amber-500/5' :
              'border-red-500/30 bg-red-500/5'
            }`}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">System Readiness Score</p>
            <p className={`text-5xl font-black italic ${
              score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-red-400'
            }`}>{score}%</p>
            <p className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
              {score >= 80 ? 'System ready — proceed with confidence' :
               score >= 50 ? 'Some issues detected — review warnings above' :
               'Critical issues — resolve before proceeding'}
            </p>
          </motion.div>
        )}

        <div className="flex gap-4">
          <button
            onClick={runChecks}
            disabled={running}
            className="flex-1 jira-btn-secondary !py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest disabled:opacity-50"
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {running ? 'Running Checks...' : done ? 'Re-run Checks' : 'Run System Check'}
          </button>

          {done && examId && (
            <button
              onClick={() => router.push(`/exam/${examId}`)}
              disabled={!allCritical}
              className={`flex-1 !py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest ${
                allCritical
                  ? 'jira-btn-primary'
                  : 'bg-white/5 text-white/20 rounded cursor-not-allowed font-black'
              }`}
            >
              {allCritical ? 'Enter Exam' : 'Fix Issues First'} <ChevronRight size={14} />
            </button>
          )}

          {done && !examId && (
            <button
              onClick={() => router.back()}
              disabled={!allCritical}
              className={`flex-1 !py-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest ${
                allCritical
                  ? 'jira-btn-primary'
                  : 'bg-white/5 text-white/20 rounded cursor-not-allowed font-black'
              }`}
            >
              Continue <ChevronRight size={14} />
            </button>
          )}
        </div>

        {!done && !running && (
          <p className="text-center text-[10px] text-white/20 uppercase tracking-widest mt-4">
            Click &ldquo;Run System Check&rdquo; to begin diagnostic
          </p>
        )}
      </motion.div>
    </div>
  );
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
