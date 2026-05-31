'use client';

import React, { useEffect, useState } from 'react';

/**
 * High accuracy countdown timer component for exams
 * @param {number} initialMinutes - Total duration of the exam in minutes
 * @param {function} onTimeUp - Callback triggered when timer hits 0:00
 */
export default function ExamTimer({ initialMinutes, onTimeUp }) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialMinutes * 60);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      onTimeUp();
      return;
    }

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [secondsRemaining, onTimeUp]);

  const formatTime = () => {
    const mins = Math.floor(secondsRemaining / 60);
    const secs = secondsRemaining % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = secondsRemaining < 120; // less than 2 minutes

  return (
    <div className={`px-4 py-2 rounded-lg border font-mono font-bold text-sm transition-all duration-300 flex items-center gap-2 ${
      isLowTime
        ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse'
        : 'bg-white/[0.03] border-white/10 text-white'
    }`}>
      <span className="flex h-2 w-2 relative">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          isLowTime ? 'bg-red-500' : 'bg-accentBlue'
        }`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          isLowTime ? 'bg-red-500' : 'bg-accentBlue'
        }`}></span>
      </span>
      <span>🕒 REMAINING: {formatTime()}</span>
    </div>
  );
}
