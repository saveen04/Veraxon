'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthContext';
import { VeraxonLogo } from '@/lib/brand';

export default function RegisterPage() {
  const router = useRouter();
  const { googleSignIn } = useAuth();

  const [role, setRole] = useState('student');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    mobileNumber: '',
    // Student specifics
    registerNumber: '',
    collegeName: '',
    department: '',
    academicYear: '',
    // Staff specifics
    staffId: '',
    designation: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (formData.password.length < 6) {
        throw new Error('Sequence (Password) must be at least 6 characters strong.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      const baseProfile = {
        uid,
        email: formData.email,
        username: formData.username,
        mobileNumber: formData.mobileNumber,
        department: formData.department,
        collegeName: formData.collegeName,
        role: role,
        createdAt: new Date().toISOString(),
        profileCompleted: true
      };

      if (role === 'student') {
        baseProfile.registerNumber = formData.registerNumber;
        baseProfile.academicYear = formData.academicYear;
      } else {
        baseProfile.staffId = formData.staffId;
        baseProfile.designation = formData.designation;
      }

      await setDoc(doc(db, 'users', uid), baseProfile);

      setSuccess('Identity Vector Allocated Successfully. Switching to Login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed due to network anomaly.');
    } finally {
      if (!success) setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await googleSignIn(role);

      if (result.roleMismatch && !result.isNew) {
        setRole(result.role);
      }

      if (!result.profileCompleted) {
        router.push('/onboarding');
      } else {
        router.push(result.role === 'student' ? '/student/dashboard' : '/staff/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Google Auth Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col lg:flex-row relative selection:bg-[#0052cc] selection:text-white font-inter overflow-hidden">
      <div className="ambient-matrix-bg" />

      {/* Left Side: Branding / Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-black">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/space.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 z-0" />

        <div className="relative z-10 text-center px-12">
          <VeraxonLogo size="XL" className="mb-10 mx-auto drop-shadow-[0_0_50px_rgba(0,82,204,0.6)] hover:scale-105 transition-transform duration-1000" />
          <h1 className="text-8xl font-extrabold tracking-[-0.05em] text-white uppercase italic mb-4 leading-none">
            Veraxon<span className="text-[#0052cc]">.</span>
          </h1>
          <p className="text-[13px] font-bold text-white/60 uppercase tracking-[0.6em] leading-relaxed max-w-md mx-auto">
            Neural Architecture for Institutional Academic Integrity
          </p>

          <div className="mt-24 flex flex-col items-center gap-6">
            <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#0052cc]/50 to-transparent" />
            <div className="flex gap-12 text-[#0052cc]/40">
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-black tracking-widest text-white/80">CORE</span>
                <span className="text-[9px] font-bold tracking-[0.3em] mt-2">v4.0.1</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-black tracking-widest text-white/80">MODE</span>
                <span className="text-[9px] font-bold tracking-[0.3em] mt-2">ENFORCED</span>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none" />
      </div>

      {/* Right Side: Register Form */}
      <div className="w-full lg:w-1/2 h-screen relative flex flex-col items-center bg-black p-8 sm:px-12 sm:py-0 overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-lg relative z-10 py-12 m-auto">
          {/* Header Mobile Only */}
          <div className="lg:hidden flex flex-col items-center mb-12 text-center">
            <VeraxonLogo size="LG" className="drop-shadow-[0_0_20px_rgba(0,82,204,0.4)]" />
            <h2 className="text-3xl font-black tracking-tighter text-white uppercase italic mt-4">Veraxon</h2>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <p className="text-[11px] font-bold text-[#0052cc] uppercase tracking-[0.4em] mb-3">Deploy Identity</p>
            <p className="text-[10px] font-medium text-white/40 uppercase tracking-[0.2em]">Initialize secure academic node based on hierarchy</p>
          </div>

          {/* Role Switcher */}
          <div className="grid grid-cols-2 p-1 bg-[#0a0a0a] border border-white/5 rounded-xl mb-6 shadow-xl">
            <button
              onClick={() => { setRole('student'); setError(''); }}
              className={`py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all duration-300 ${role === 'student'
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'text-white/30 hover:text-white/60'
                }`}
            >
              Student Registration
            </button>
            <button
              onClick={() => { setRole('staff'); setError(''); }}
              className={`py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-lg transition-all duration-300 ${role === 'staff'
                  ? 'bg-white text-black shadow-lg shadow-white/20'
                  : 'text-white/30 hover:text-white/60'
                }`}
            >
              Staff Allocation
            </button>
          </div>

          {/* Error / Success Overlay */}
          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 text-center border-l-4 border-l-red-500 animate-fade-in text-balance">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500 text-center border-l-4 border-l-emerald-500 animate-pulse">
              {success}
            </div>
          )}

          {/* Unified Dynamic Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Core Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Full Name</label>
                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" />
              </div>
              <div>
                <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Mobile Node</label>
                <input type="tel" name="mobileNumber" required value={formData.mobileNumber} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Email Identity</label>
              <input type="email" name="email" required value={formData.email} onChange={handleChange} className="jira-input uppercase !tracking-widest !py-2.5" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Origin Institution</label>
                <input type="text" name="collegeName" required value={formData.collegeName} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" />
              </div>
              <div>
                <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Department</label>
                <input type="text" name="department" required value={formData.department} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-4 my-2">
              <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-widest">{role} Specific Fields</span>
              {role === 'student' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Register Number</label>
                    <input type="text" name="registerNumber" required value={formData.registerNumber} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Academic Year</label>
                    <input type="text" name="academicYear" required value={formData.academicYear} onChange={handleChange} placeholder="e.g. 3rd Year" className="jira-input !tracking-widest !py-2.5" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Staff ID</label>
                    <input type="text" name="staffId" required value={formData.staffId} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Designation</label>
                    <input type="text" name="designation" required value={formData.designation} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-[8px] font-black text-white/30 uppercase tracking-[0.3em] ml-1 mb-1.5">Access Sequence (Password)</label>
              <input type="password" name="password" required minLength="6" value={formData.password} onChange={handleChange} className="jira-input !tracking-widest !py-2.5" placeholder="••••••••" />
            </div>

            <button type="submit" disabled={loading} className="jira-btn-primary shimmer w-full py-4 mt-2">
              {loading && !success ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" /> : 'Compile Secure Registration'}
            </button>
          </form>

          <div className="flex items-center gap-6 my-8 opacity-10">
            <div className="flex-grow h-px bg-white" />
            <span className="text-[7px] font-black text-white uppercase tracking-[0.5em]">OR OAUTH2</span>
            <div className="flex-grow h-px bg-white" />
          </div>

          <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="w-full py-4 rounded-xl border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.05] text-white font-black text-[10px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-4 group">
            <svg className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Automated Google Config
          </button>

          <div className="text-center mt-12 pb-12 lg:pb-0">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
              Already Deployed?{' '}
              <Link href="/login" className="text-[#0052cc] hover:text-white transition-colors">Invoke Login</Link>
            </p>
          </div>
        </div>

        {/* Standardized Footer */}
        <footer className="mt-auto py-8 w-full text-center">
          <div className="flex flex-col items-center gap-2 opacity-30">
            <VeraxonLogo size="XS" className="grayscale" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Veraxon Assessment Platform</p>
            <p className="text-[7px] font-bold text-white/50 uppercase tracking-widest">© 2026 v4.0.1 • All Rights Reserved</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
