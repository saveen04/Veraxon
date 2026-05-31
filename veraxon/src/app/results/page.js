'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('veraxon_user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const user = JSON.parse(storedUser);
    setStudent(user);

    const fetchResult = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/result/get?studentId=${user.id}`);
        const data = await res.json();
        
        if (data.success) {
          setResult(data.result);
        }
      } catch (err) {
        console.error('Failed to load exam results:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center text-center p-4">
        <svg className="animate-spin h-10 w-10 text-accentBlue mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs text-white/50 tracking-wider">COMPILING SECURED ACADEMIC SCORECARD...</span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#030303] flex items-center justify-center p-4 selection:bg-accentBlue selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-accentBlue/5 rounded-full blur-[110px] pointer-events-none" />

      {/* Main Results Card */}
      <div className="w-full max-w-xl p-8 rounded-2xl border border-white/5 bg-[#0f0f12] shadow-2xl relative z-10 text-center space-y-8">
        
        {/* Header Icon */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accentBlue to-accentViolet flex items-center justify-center font-black text-white text-xl shadow-lg shadow-accentBlue/25 mb-4">
            V
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-outfit">Assessment Completed</h2>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-semibold">Integrity Verified Scorecard</p>
        </div>

        {!result ? (
          <div className="p-6 text-center text-xs text-white/30 border border-white/5 border-dashed rounded-xl">
            No evaluated result records found. Enter dashboard sessions to start attempts.
          </div>
        ) : (
          <>
            {/* 1. Score Circular radial chart dial */}
            <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
              {/* Glow Behind Score */}
              <div className={`absolute inset-0 rounded-full blur-xl opacity-35 ${
                result.passed ? 'bg-emerald-500' : 'bg-red-500'
              }`} />
              
              {/* Outer Ring Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="stroke-white/5 fill-transparent"
                  strokeWidth="8"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className={`fill-transparent transition-all duration-1000 ${
                    result.passed ? 'stroke-emerald-500' : 'stroke-red-500'
                  }`}
                  strokeWidth="8"
                  strokeDasharray={402}
                  strokeDashoffset={402 - (402 * result.percentage) / 100}
                  strokeLinecap="round"
                />
              </svg>

              {/* Center Numeric details */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white font-outfit leading-none">
                  {result.percentage}%
                </span>
                <span className="text-[9px] text-white/45 tracking-widest font-bold uppercase mt-1">PERCENTAGE</span>
              </div>
            </div>

            {/* 2. Pass/Fail Indicator Banner */}
            <div className={`py-3 px-6 rounded-xl border font-bold text-sm uppercase tracking-widest ${
              result.passed
                ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                : 'bg-red-500/10 border-red-500/25 text-red-400'
            }`}>
              Result: {result.passed ? '🛡️ PASSED' : '⚠️ FAIL (BELOW THRESHOLD)'}
            </div>

            {/* 3. Detailed Data Fields Table */}
            <div className="p-5 rounded-xl border border-white/5 bg-white/[0.01] divide-y divide-white/5 text-left text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-white/45">Assessment Title</span>
                <span className="font-semibold text-white truncate max-w-[280px]">{result.examTitle}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-white/45">Marks Obtained</span>
                <span className="font-bold text-white">
                  {result.score} / {result.totalMarks} Marks
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-white/45">Completed On</span>
                <span className="text-white/70">
                  {new Date(result.createdAt).toLocaleDateString()} at{' '}
                  {new Date(result.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </>
        )}

        {/* 4. Action Button Return to Portal */}
        <Link
          href="/dashboard"
          className="block w-full py-4 rounded-xl bg-accentBlue text-white font-bold text-sm tracking-widest hover:bg-accentBlue/90 hover:shadow-lg hover:shadow-accentBlue/25 transition-all uppercase"
        >
          Return to Integrity Terminal
        </Link>

      </div>
    </div>
  );
}
