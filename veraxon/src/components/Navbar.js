'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Navbar() {
  const router = useRouter();
  const { user, userData, loading, logOut } = useAuth();
  
  if (loading) return null; // Or a sleek skeleton

  return (
    <header className="fixed top-0 left-0 w-full z-50 border-b border-white/5 bg-[#0d1117]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-3 active:scale-95 transition-all duration-300 w-[200px]">
        <img 
          src="/logov-removebg-preview.png" 
          alt="Veraxon Logo" 
          className="h-9 w-auto hover:drop-shadow-[0_0_15px_rgba(0,82,204,0.4)] transition-all duration-500"
        />
        <span className="text-lg font-black uppercase tracking-[0.2em] text-white hidden sm:block">
          VERAXON
        </span>
      </Link>

      {/* Center Animated Universal Search (Only for Auth Users) */}
      {user && (
        <div className="flex-1 max-w-xl hidden md:block px-6">
          <div className="relative group">
            <svg className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2 group-hover:text-[#0052cc] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder={`Search ${userData?.role === 'staff' ? 'Assessments & Candidates' : 'History & Nodes'}...`}
              className="w-full bg-[#161b22] border border-white/10 rounded-xl py-2 pl-10 pr-12 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#0052cc] transition-all focus:bg-[#1a212b] hover:bg-[#1a212b]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 border border-white/10 rounded text-[9px] px-1.5 py-0.5 text-white/30 hidden lg:block bg-black/20">
              CTRL+K
            </div>
          </div>
        </div>
      )}

      {/* Auth Links */}
      <div className="flex items-center gap-4 w-[280px] justify-end">
        {user ? (
          <>
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Profile" className="w-8 h-8 rounded-full border border-white/10 object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] uppercase font-bold text-white/50">
                {userData?.username?.charAt(0) || 'U'}
              </div>
            )}
            
            <button
              onClick={logOut}
              className="text-[10px] font-semibold uppercase tracking-wider text-white/50 hover:text-red-400 transition-colors duration-200"
            >
              Sign Out
            </button>
            <Link
              href={userData?.role === 'staff' || userData?.role === 'admin' ? '/staff/dashboard' : '/student/dashboard'}
              className="jira-btn-primary !py-2 !px-4 text-[10px]"
            >
              Terminal
            </Link>
          </>
        ) : (
          <>
            <Link 
              href="/login" 
              className="jira-btn-secondary !py-2 !px-4 text-[10px]"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="jira-btn-primary !py-2 !px-4 text-[10px]"
            >
              Initialize Node
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
