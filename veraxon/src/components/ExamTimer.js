'use client';

import React, { useEffect, useState, useRef } from 'react';

/**
 * ExamTimer – sticky countdown with visual urgency states.
 * @param {number} initialMinutes – exam duration in minutes
 * @param {function} onTimeUp – called when timer hits zero
 */
export default function ExamTimer({ initialMinutes, onTimeUp }) {
  const [secondsLeft, setSecondsLeft] = useState((initialMinutes ?? 60) * 60);
  const onTimeUpRef = useRef(onTimeUp);
  onTimeUpRef.current = onTimeUp;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onTimeUpRef.current?.();
      return;
    }
    const id = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const pct = secondsLeft / ((initialMinutes ?? 60) * 60);
  const urgent   = secondsLeft < 120;   // < 2 min
  const warning  = secondsLeft < 300;   // < 5 min

  const color = urgent ? 'text-red-400' : warning ? 'text-amber-400' : 'text-emerald-400';
  const ring  = urgent ? 'border-red-500/40 bg-red-500/5' : warning ? 'border-amber-500/30 bg-amber-500/5' : 'border-white/10 bg-white/[0.03]';
  const dot   = urgent ? 'bg-red-400' : warning ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2 rounded-xl border font-mono transition-all duration-500 ${ring}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 animate-pulse ${dot}`} />
      <span className={`text-sm font-black tracking-widest ${color} tabular-nums`}>{formatted}</span>
      {urgent && (
        <span className="text-[9px] font-black text-red-400 uppercase tracking-widest animate-pulse">
          LOW
        </span>
      )}
    </div>
  );
}
