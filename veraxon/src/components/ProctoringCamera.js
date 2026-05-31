import React, { useRef, useEffect, useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * AI Proctoring Camera Component
 * @param {string} examId - Active Exam ID
 * @param {string} studentId - Active Student ID
 * @param {function} onViolation - Callback triggered locally on the parent
 */
export default function ProctoringCamera({ examId, studentId, onViolation }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState('initializing'); // initializing, active, denied
  const [integrityState, setIntegrityState] = useState('secure'); // secure, alert
  const [proctorMessage, setProctorMessage] = useState('SURVEILLANCE ACTIVE');
  const [cameraError, setCameraError] = useState('');
  
  // Real-time AI Telemetry States
  const [faceCount, setFaceCount] = useState(1);
  const [phoneScan, setPhoneScan] = useState('secure'); // secure, detected
  const [gazeScan, setGazeScan] = useState('center'); // center, distracted
  const [aiDecision, setAiDecision] = useState('Normal');
  const [activeSimulation, setActiveSimulation] = useState('');
  
  // 1. Request Webcam Stream
  const startCamera = async () => {
    setCameraStatus('initializing');
    setCameraError('');
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCameraStatus('active');
      setIntegrityState('secure');
      setProctorMessage('INTEGRITY SECURE');
    } catch (err) {
      console.error('Camera capture error:', err);
      setCameraStatus('denied');
      setCameraError('Webcam access was denied or is unavailable. Please grant permissions and retry.');
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Canvas Scanning Animation Loop
  useEffect(() => {
    if (cameraStatus !== 'active' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;
    let frameCount = 0;

    let boxX = 60;
    let boxY = 40;
    let boxW = 120;
    let boxH = 140;

    const renderLoop = () => {
      frameCount++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = integrityState === 'secure' ? 'rgba(0, 82, 204, 0.25)' : 'rgba(222, 53, 11, 0.4)';
      ctx.lineWidth = 1;
      
      // Grid lines
      for (let i = 20; i < canvas.width; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
      }
      for (let j = 20; j < canvas.height; j += 20) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(canvas.width, j);
        ctx.stroke();
      }

      if (frameCount % 60 === 0) {
        boxX = 60 + Math.floor(Math.sin(frameCount / 40) * 10);
        boxY = 45 + Math.floor(Math.cos(frameCount / 40) * 5);
      }

      ctx.strokeStyle = integrityState === 'secure' ? '#0052cc' : '#de350b';
      ctx.lineWidth = 2;
      
      // Draw Bracket Corners
      ctx.beginPath(); ctx.moveTo(boxX, boxY + 20); ctx.lineTo(boxX, boxY); ctx.lineTo(boxX + 20, boxY); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX + boxW - 20, boxY); ctx.lineTo(boxX + boxW, boxY); ctx.lineTo(boxX + boxW, boxY + 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX, boxY + boxH - 20); ctx.lineTo(boxX, boxY + boxH); ctx.lineTo(boxX + 20, boxY + boxH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(boxX + boxW - 20, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH); ctx.lineTo(boxX + boxW, boxY + boxH - 20); ctx.stroke();

      const sweepY = boxY + ((Math.sin(frameCount / 15) + 1) / 2) * boxH;
      ctx.strokeStyle = integrityState === 'secure' ? 'rgba(0, 82, 204, 0.7)' : 'rgba(222, 53, 11, 0.8)';
      ctx.beginPath();
      ctx.moveTo(boxX + 5, sweepY);
      ctx.lineTo(boxX + boxW - 5, sweepY);
      ctx.stroke();

      ctx.fillStyle = integrityState === 'secure' ? '#0052cc' : '#de350b';
      ctx.font = 'bold 8px monospace';
      ctx.fillText(proctorMessage, boxX + 5, boxY - 8);

      animationId = requestAnimationFrame(renderLoop);
    };

    renderLoop();
    return () => cancelAnimationFrame(animationId);
  }, [cameraStatus, integrityState, proctorMessage]);

  // 3. Main Logging Aggregator
  const reportViolation = async (type, evidenceBase64 = '') => {
    setIntegrityState('alert');
    setProctorMessage(`ALERT: ${type.toUpperCase()}`);
    
    try {
      // Log directly to Firestore
      await addDoc(collection(db, 'violations'), {
        examId,
        studentId,
        type,
        evidence: evidenceBase64 || `Anomaly flags triggered: ${type}`,
        timestamp: serverTimestamp(),
        verified: false
      });

      onViolation(type);
    } catch (e) {
      console.error('Failed to log proctor violation to Firestore:', e);
    }

    setTimeout(() => {
      setIntegrityState('secure');
      setProctorMessage('INTEGRITY SECURE');
    }, 4000);
  };

  // 4. Run Periodical base64 inference sweeps via WebSockets
  useEffect(() => {
    if (cameraStatus !== 'active') return;
    
    let ws = null;
    let scanInterval = null;

    const connectWebSocket = () => {
      ws = new WebSocket('ws://127.0.0.1:8000/api/proctor/stream');
      
      ws.onopen = () => {
        console.log('Connected to Veraxon Advanced AI Proctoring Feed.');
        
        // Start pumping frames across the WebSocket
        scanInterval = setInterval(() => {
          if (!videoRef.current || ws.readyState !== WebSocket.OPEN) return;
          try {
            const snapCanvas = document.createElement('canvas');
            snapCanvas.width = 240;
            snapCanvas.height = 180;
            const snapCtx = snapCanvas.getContext('2d');
            snapCtx.drawImage(videoRef.current, 0, 0, 240, 180);
            const base64Image = snapCanvas.toDataURL('image/jpeg', 0.6);

            ws.send(JSON.stringify({
              image: base64Image,
              examId: activeSimulation ? `${examId}_${activeSimulation}` : examId,
              studentId
            }));
          } catch (e) {
            console.warn('Frame dropped during WebSocket send', e);
          }
        }, 1500); // 1.5 second high-frequency tracking
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.success) {
            setFaceCount(data.metrics.face_count);
            setPhoneScan(data.infractions.phone_detected ? 'detected' : 'secure');
            setGazeScan(data.infractions.looking_away || data.infractions.head_turned ? 'distracted' : 'center');
            setAiDecision(data.decision);

            // Log if Random Forest / YOLO triggers Breach or Suspicious alerts
            if (data.severity === 'breach' || data.severity === 'warning') {
              let breachType = 'anomaly_detected';
              if (data.infractions.phone_detected) breachType = 'phone_detected';
              else if (data.infractions.no_face) breachType = 'no_face';
              else if (data.infractions.multiple_faces) breachType = 'multiple_faces';
              else if (data.infractions.looking_away) breachType = 'looking_away';
              
              reportViolation(breachType);
            }
          }
        } catch (err) {
          console.warn('Error parsing AI Feed:', err);
        }
      };

      ws.onclose = () => {
        if (scanInterval) clearInterval(scanInterval);
        console.warn('Disconnected from AI Proctoring Engine. Retrying in 5s module recovery phase...');
        setTimeout(connectWebSocket, 5000);
      };
      
      ws.onerror = (e) => {
        console.warn('AI WS Connection Error:', e);
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      if (scanInterval) clearInterval(scanInterval);
      if (ws) ws.close();
    };
  }, [cameraStatus, activeSimulation, examId, studentId]);

  // 5. Page focus handlers (standard visibility + fullscreen rules)
  useEffect(() => {
    if (cameraStatus !== 'active') return;

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        reportViolation('tab_switch');
      }
    };

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        reportViolation('fullscreen_exit');
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreen);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [cameraStatus]);

  return (
    <div className="jira-card p-6 flex flex-col items-center gap-4 relative">
      
      {/* Telemetry Header */}
      <div className="w-full flex items-center justify-between border-b border-[#22272e] pb-3 mb-2">
        <span className="text-xs font-bold text-white/40 tracking-wider uppercase font-sans">AI Proctoring Terminal</span>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#0d1117] border border-[#21262d] text-[9px] font-bold text-white select-none">
          <span className={`w-1.5 h-1.5 rounded-full ${
            cameraStatus === 'active' && integrityState === 'secure'
              ? 'bg-emerald-500 animate-pulse'
              : 'bg-[#de350b]'
          }`} />
          <span>Surveillance: {cameraStatus === 'active' ? (integrityState === 'secure' ? 'ACTIVE' : 'BREACH') : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="w-[240px] h-[180px] rounded border border-[#21262d] bg-black relative overflow-hidden group">
        
        {cameraStatus === 'initializing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <svg className="animate-spin h-5 w-5 text-[#0052cc] mb-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-[10px] text-white/40">Initializing camera feed...</p>
          </div>
        )}

        {cameraStatus === 'denied' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
            <p className="text-[10px] text-[#ff5630] font-semibold mb-2">{cameraError}</p>
            <button
              onClick={startCamera}
              className="jira-btn-secondary py-1 text-[9px]"
            >
              Retry Connection
            </button>
          </div>
        )}

        {cameraStatus === 'active' && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <canvas
              ref={canvasRef}
              width={240}
              height={180}
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          </>
        )}

      </div>

      {/* AI Telemetry Logs (JIRA dashboard style) */}
      {cameraStatus === 'active' && (
        <div className="w-full bg-[#0d1117] border border-[#21262d] rounded p-3 text-[10px] font-mono flex flex-col gap-1.5 text-white/70">
          <div className="flex justify-between border-b border-[#21262d]/50 pb-1 mb-1 font-bold text-white/50 text-[9px]">
            <span>METRIC</span>
            <span>STATUS</span>
          </div>
          <div className="flex justify-between">
            <span>Face Count:</span>
            <span className={faceCount === 1 ? "text-emerald-400" : "text-[#ff5630] font-bold animate-pulse"}>{faceCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Phone Scanner:</span>
            <span className={phoneScan === 'secure' ? "text-emerald-400" : "text-[#de350b] font-bold animate-pulse"}>{phoneScan.toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span>Gaze Track:</span>
            <span className={gazeScan === 'center' ? "text-emerald-400" : "text-[#ff5630]"}>{gazeScan.toUpperCase()}</span>
          </div>
          <div className="flex justify-between border-t border-[#21262d]/50 pt-1 mt-1 font-semibold">
            <span>RF Decision:</span>
            <span className={aiDecision === 'Normal' ? "text-[#0052cc]" : "text-[#de350b]"}>{aiDecision.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Manual Anomaly triggers for simulation */}
      {cameraStatus === 'active' && (
        <div className="flex flex-col gap-1.5 w-full mt-1 border-t border-[#22272e] pt-3">
          <span className="text-[9px] text-white/30 uppercase font-sans tracking-wide">Simulation Gates (AI Testing)</span>
          <div className="grid grid-cols-3 gap-1">
            <button
              onClick={() => setActiveSimulation(activeSimulation === 'simulate_no_face' ? '' : 'simulate_no_face')}
              className={`px-1.5 py-1 text-[8px] rounded border transition-all uppercase font-semibold ${
                activeSimulation === 'simulate_no_face' 
                  ? 'bg-[#de350b] text-white border-transparent' 
                  : 'bg-[#161a22] text-white/50 border-[#21262d] hover:text-white'
              }`}
            >
              No Face
            </button>
            <button
              onClick={() => setActiveSimulation(activeSimulation === 'simulate_multiple' ? '' : 'simulate_multiple')}
              className={`px-1.5 py-1 text-[8px] rounded border transition-all uppercase font-semibold ${
                activeSimulation === 'simulate_multiple' 
                  ? 'bg-[#de350b] text-white border-transparent' 
                  : 'bg-[#161a22] text-white/50 border-[#21262d] hover:text-white'
              }`}
            >
              Multi-Face
            </button>
            <button
              onClick={() => setActiveSimulation(activeSimulation === 'simulate_phone' ? '' : 'simulate_phone')}
              className={`px-1.5 py-1 text-[8px] rounded border transition-all uppercase font-semibold ${
                activeSimulation === 'simulate_phone' 
                  ? 'bg-[#de350b] text-white border-transparent' 
                  : 'bg-[#161a22] text-white/50 border-[#21262d] hover:text-white'
              }`}
            >
              Phone Scan
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
