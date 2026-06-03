'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { VeraxonLogo } from '@/lib/brand';
import { motion, AnimatePresence } from 'framer-motion';
import {
  SearchIcon, ChevronDownIcon, LogOutIcon, SettingsIcon,
  DashboardIcon, ProfileIcon
} from '@/components/icons';

export default function Navbar() {
  const { user, userData, loading, logOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (loading) return null;

  const dashHref = userData?.role === 'staff' || userData?.role === 'admin'
    ? '/staff/dashboard' : '/student/dashboard';

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#07080a]/92 border-b border-white/[0.07] backdrop-blur-2xl shadow-[0_2px_24px_rgba(0,0,0,0.5)]'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-screen-2xl mx-auto px-5 h-15 flex items-center justify-between gap-4" style={{ height: '60px' }}>

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0" aria-label="Veraxon Home">
          <VeraxonLogo
            size="SM"
            theme="dark"
            className="group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(0,82,204,0.35)]"
          />
          <span className="text-[14px] font-black uppercase tracking-[0.2em] text-white hidden sm:block group-hover:text-[#0052cc] transition-colors duration-200">
            VERAXON
          </span>
        </Link>

        {/* Search bar — authenticated only */}
        {user && (
          <div className="flex-1 max-w-sm hidden md:block">
            <div className="relative group">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#0052cc] transition-colors pointer-events-none">
                <SearchIcon size={14} />
              </span>
              <input
                type="search"
                placeholder={userData?.role === 'staff' ? 'Search assessments, students…' : 'Search tests, results…'}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 pl-10 pr-12 text-[12px] text-white placeholder-white/25 focus:outline-none focus:border-[#0052cc]/50 focus:bg-white/[0.06] transition-all"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:block border border-white/10 rounded text-[9px] px-1.5 py-0.5 text-white/20 bg-black/30 font-black tracking-wider">
                ⌘K
              </kbd>
            </div>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setProfileOpen(o => !o)}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.13] hover:bg-white/[0.04] transition-all"
              >
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Avatar" className="w-7 h-7 rounded-lg border border-white/10 object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#0052cc]/20 border border-[#0052cc]/20 flex items-center justify-center text-[11px] font-black text-[#0052cc]">
                    {userData?.username?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <span className="text-[12px] font-semibold text-white/65 hidden sm:block max-w-[90px] truncate">
                  {userData?.username?.split(' ')[0] || 'User'}
                </span>
                <span className={`text-white/30 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`}>
                  <ChevronDownIcon size={14} />
                </span>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -6 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -6 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-11 w-52 bg-[#0d1117]/98 border border-white/[0.10] rounded-2xl shadow-2xl z-50 overflow-hidden backdrop-blur-xl"
                    >
                      {/* User info */}
                      <div className="px-4 py-3.5 border-b border-white/[0.06]">
                        <p className="text-[13px] font-bold text-white truncate">{userData?.username || 'User'}</p>
                        <p className="text-[11px] text-white/35 truncate mt-0.5">{userData?.email}</p>
                        <span className={`inline-block mt-2 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          userData?.role === 'staff' || userData?.role === 'admin'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : 'bg-[#0052cc]/10 text-[#0052cc] border-[#0052cc]/20'
                        }`}>
                          {userData?.role || 'user'}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link href={dashHref} onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-white/55 hover:text-white hover:bg-white/[0.04] transition-colors">
                          <DashboardIcon size={15} /> Dashboard
                        </Link>
                        <Link href="/settings" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-white/55 hover:text-white hover:bg-white/[0.04] transition-colors">
                          <SettingsIcon size={15} /> Settings
                        </Link>
                      </div>

                      <div className="border-t border-white/[0.06] py-1">
                        <button
                          onClick={() => { logOut(); setProfileOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-[12px] font-medium text-red-400/60 hover:text-red-400 hover:bg-red-500/[0.06] transition-colors"
                        >
                          <LogOutIcon size={15} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link href="/login" className="jira-btn-secondary !py-2 !px-4 text-[11px]">
                Sign In
              </Link>
              <Link href="/register" className="jira-btn-primary !py-2 !px-4 text-[11px]">
                Get Started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
