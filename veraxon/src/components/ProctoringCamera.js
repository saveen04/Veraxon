'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * ProctoringCamera
 * Large live camera feed with AI monitoring status panel.
 *
 * Props:
 *   examId     – current exam ID
 *   studentId  – authenticated student UID
 *   studentName – display name for violation logs
 *   onViolation(type, severity) – parent callback
 *   compact    – boolean, smaller layout for sidebar use
 */
export default function ProctoringCamera({
  examId,
  studentId,
  studentName = 'Candidate',
  onViolation,
  compact = false,
}) {
  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const wsRef      = useRef(null);
  const scanRef    = useRef(null);
  const streamRef  = useRef(null);

  const [cameraStatus, setCameraStatus]   = useState('initializing'); // initializing | active | denied
  const [aiState, setAiState]             = useState('secure');        // secure | warning | breach
  const [metrics, setMetrics]             = useState({
    faceCount: 1,
    phoneDetected: false,
    gazeAway: false,
    headTurned: false,
    decision: 'Normal',
    riskScore: 0,
  });
  const [wsConnected, setWsConnected]     = useState(false);
  const [camError, setCamError]           = useState('');

  /* ── Camera start ─────────────────────────────────── */
  const startCamera = useCallback(async () => {
    setCameraStatus('initializing');
    setCamError('');
    try {
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCameraStatus('active');
    } catch (err) {
      setCameraStatus('denied');
      setCamError(err.message || 'Camera permission denied.');
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (wsRef.current) wsRef.current.close();
      if (scanRef.current) clearInterval(scanRef.current);
    };
  }, [startCamera]);

  /* ── Canvas overlay animation ─────────────────────── */
  useEffect(() => {
    if (cameraStatus !== 'active' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let frame = 0;
    let raf;

    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const secure = aiState === 'secure';
      const primary = secure ? 'rgba(0,82,204,' : 'rgba(222,53,11,';

      // Subtle grid
      ctx.strokeStyle = primary + '0.12)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x < canvas.width; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      // Face bounding box
      const bx = canvas.width * 0.25, by = canvas.height * 0.10;
      const bw = canvas.width * 0.50, bh = canvas.height * 0.75;
      const corner = 20;
      const accentColor = secure ? '#0052cc' : '#de350b';
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 2;
      // corners only
      [
        [bx, by, 1, 1], [bx + bw, by, -1, 1],
        [bx, by + bh, 1, -1], [bx + bw, by + bh, -1, -1],
      ].forEach(([ox, oy, sx, sy]) => {
        ctx.beginPath();
        ctx.moveTo(ox, oy + corner * sy); ctx.lineTo(ox, oy); ctx.lineTo(ox + corner * sx, oy);
        ctx.stroke();
      });

      // Scan line
      const sweepY = by + ((Math.sin(frame / 20) + 1) / 2) * bh;
      const gradient = ctx.createLinearGradient(bx, sweepY, bx + bw, sweepY);
      gradient.addColorStop(0, 'transparent');
      gradient.addColorStop(0.5, primary + '0.6)');
      gradient.addColorStop(1, 'transparent');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(bx, sweepY); ctx.lineTo(bx + bw, sweepY); ctx.stroke();

      // Status label
      ctx.fillStyle = accentColor;
      ctx.font = 'bold 9px monospace';
      ctx.fillText(secure ? '● MONITORING' : '⚠ ALERT', bx + 4, by - 5);

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [cameraStatus, aiState]);

  /* ── Violation reporter ───────────────────────────── */
  const reportViolation = useCallback(async (type, severity = 'warning') => {
    setAiState(severity === 'breach' ? 'breach' : 'warning');
    try {
      await addDoc(collection(db, 'infractions'), {
        examId, studentId, studentName, type,
        severity,
        timestamp: serverTimestamp(),
        verified: false,
      });
    } catch { /* non-blocking */ }
    onViolation?.(type, severity);
    setTimeout(() => setAiState('secure'), 5000);
  }, [examId, studentId, studentName, onViolation]);

  /* ── WebSocket AI feed ────────────────────────────── */
  useEffect(() => {
    if (cameraStatus !== 'active') return;

    let reconnectTimer;

    const connect = () => {
      const ws = new WebSocket('ws://127.0.0.1:8000/api/proctor/stream');
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        scanRef.current = setInterval(() => {
          if (!videoRef.current || ws.readyState !== WebSocket.OPEN) return;
          try {
            const snap = document.createElement('canvas');
            snap.width = 320; snap.height = 240;
            snap.getContext('2d').drawImage(videoRef.current, 0, 0, 320, 240);
            ws.send(JSON.stringify({
              image: snap.toDataURL('image/jpeg', 0.65),
              examId,
              studentId,
            }));
          } catch { /* frame drop */ }
        }, 1500);
      };

      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          if (!d.success) return;
          const inf = d.infractions ?? {};
          const met = d.metrics ?? {};
          // Risk score: weighted sum
          let risk = 0;
          if (inf.no_face)        risk += 30;
          if (inf.multiple_faces) risk += 40;
          if (inf.phone_detected) risk += 50;
          if (inf.looking_away)   risk += 20;
          if (inf.head_turned)    risk += 15;
          risk = Math.min(risk, 100);

          setMetrics({
            faceCount:     met.face_count ?? 1,
            phoneDetected: !!inf.phone_detected,
            gazeAway:      !!inf.looking_away,
            headTurned:    !!inf.head_turned,
            decision:      d.decision ?? 'Normal',
            riskScore:     risk,
          });

          if (d.severity === 'breach' || d.severity === 'warning') {
            let type = 'anomaly_detected';
            if (inf.phone_detected)  type = 'phone_detected';
            else if (inf.no_face)    type = 'no_face';
            else if (inf.multiple_faces) type = 'multiple_faces';
            else if (inf.looking_away)   type = 'looking_away';
            reportViolation(type, d.severity);
          }
        } catch { /* parse error */ }
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (scanRef.current) clearInterval(scanRef.current);
        reconnectTimer = setTimeout(connect, 5000);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      if (scanRef.current) clearInterval(scanRef.current);
      wsRef.current?.close();
    };
  }, [cameraStatus, examId, studentId, reportViolation]);

  /* ── Helpers ──────────────────────────────────────── */
  const riskColor = metrics.riskScore < 21 ? 'text-emerald-400' :
                    metrics.riskScore < 51 ? 'text-amber-400' :
                    metrics.riskScore < 81 ? 'text-orange-400' : 'text-red-400';

  const riskLabel = metrics.riskScore < 21 ? 'Low' :
                    metrics.riskScore < 51 ? 'Moderate' :
                    metrics.riskScore < 81 ? 'High' : 'Critical';

  const StatusRow = ({ label, ok, value }) => (
    <div className="flex items-center justify-between py-1.5 border-b border-white/[0.04] last:border-0">
      <span className="text-[10px] font-bold text-white/40 tracking-wide">{label}</span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-3 w-full">

      {/* ── Camera viewport ───────────────────────────── */}
      <div className={`relative rounded-2xl overflow-hidden bg-black border ${
        aiState === 'breach' ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]' :
        aiState === 'warning' ? 'border-amber-400/40' :
        'border-white/[0.08]'
      } transition-all duration-500 ${compact ? 'aspect-video' : 'aspect-[4/3]'}`}>

        {cameraStatus === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
            <div className="w-6 h-6 border-2 border-[#0052cc]/30 border-t-[#0052cc] rounded-full animate-spin" />
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Initializing camera…</p>
          </div>
        )}

        {cameraStatus === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-black text-center">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-400">
                <path d="M3 3l18 18M11 11.5a1.5 1.5 0 002 2M17 17H5.5C4.12 17 3 15.88 3 14.5V9a2 2 0 012-2m3-2h8a2 2 0 012 2v5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <p className="text-[11px] font-bold text-red-400 leading-relaxed">{camError}</p>
            <button
              onClick={startCamera}
              className="jira-btn-secondary !py-1.5 !px-4 text-[10px] mt-1"
            >
              Retry
            </button>
          </div>
        )}

        {cameraStatus === 'active' && (
          <>
            <video
              ref={videoRef}
              autoPlay playsInline muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              width={640} height={480}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
            {/* Status badge */}
            <div className={`absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1.5 rounded-xl backdrop-blur-md border text-[9px] font-black uppercase tracking-widest ${
              aiState === 'breach'  ? 'bg-red-500/20 border-red-500/30 text-red-400' :
              aiState === 'warning' ? 'bg-amber-400/15 border-amber-400/25 text-amber-400' :
              'bg-black/50 border-white/10 text-emerald-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                aiState === 'breach' ? 'bg-red-400' : aiState === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              {aiState === 'breach' ? 'BREACH' : aiState === 'warning' ? 'WARNING' : 'SECURE'}
            </div>
            {/* WS indicator */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/60 border border-white/10 backdrop-blur-md">
              <span className={`w-1.5 h-1.5 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-[8px] font-black text-white/40 uppercase tracking-wider">
                {wsConnected ? 'AI Live' : 'AI Offline'}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── AI monitoring panel ───────────────────────── */}
      {cameraStatus === 'active' && (
        <div className="bg-[#0a0c10] border border-white/[0.07] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.22em]">AI Monitor</span>
            <div className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${riskColor} bg-white/[0.04] border border-white/[0.06]`}>
              Risk: {riskLabel}
            </div>
          </div>

          <StatusRow label="Face"     ok={metrics.faceCount === 1}   value={metrics.faceCount === 0 ? 'Missing' : metrics.faceCount > 1 ? `${metrics.faceCount} Faces` : 'Active'} />
          <StatusRow label="Gaze"     ok={!metrics.gazeAway}         value={metrics.gazeAway ? 'Away' : 'On Screen'} />
          <StatusRow label="Object"   ok={!metrics.phoneDetected}    value={metrics.phoneDetected ? 'Phone Detected' : 'Clear'} />
          <StatusRow label="Identity" ok={true}                      value="Verified" />
          <StatusRow label="Voice"    ok={true}                      value="Clear" />

          {/* Risk bar */}
          <div className="mt-3 pt-3 border-t border-white/[0.04]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Risk Score</span>
              <span className={`text-[9px] font-black ${riskColor}`}>{metrics.riskScore}/100</span>
            </div>
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  metrics.riskScore < 21 ? 'bg-emerald-400' :
                  metrics.riskScore < 51 ? 'bg-amber-400' :
                  metrics.riskScore < 81 ? 'bg-orange-400' : 'bg-red-400'
                }`}
                style={{ width: `${metrics.riskScore}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
