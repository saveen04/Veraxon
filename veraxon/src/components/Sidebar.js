'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { VeraxonLogo } from '@/lib/brand';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DashboardIcon, AssessmentIcon, ResultsIcon, SessionIcon,
  AnalyticsIcon, SettingsIcon, StudentsIcon, MonitorIcon,
  BuilderIcon, AssignIcon, HistoryIcon, BellIcon, LogOutIcon,
  ReportsIcon, ProfileIcon, MenuIcon, CloseIcon
} from '@/components/icons';

/* ─── Single nav item ─────────────────────────────────────────── */
function NavItem({ icon: Icon, label, href, badge }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');

  return (
    <Link
      href={href}
      className={`
        relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl
        transition-all duration-200 group
        ${isActive
          ? 'bg-[#0052cc]/12 border border-[#0052cc]/25 text-white shadow-[0_2px_12px_rgba(0,82,204,0.1)]'
          : 'border border-transparent text-white/50 hover:text-white hover:bg-white/[0.05] hover:border-white/[0.07]'
        }
      `}
    >
      {/* Active left bar */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#0052cc] rounded-r-full shadow-[0_0_8px_rgba(0,82,204,0.9)]" />
      )}

      {/* Icon */}
      <span className={`shrink-0 transition-all duration-200 ${
        isActive ? 'text-[#0052cc]' : 'text-white/35 group-hover:text-white/75 group-hover:scale-110'
      }`}>
        <Icon size={20} />
      </span>

      {/* Label */}
      <span className={`text-[13px] font-semibold leading-none tracking-wide flex-1 ${
        isActive ? 'text-white' : ''
      }`}>
        {label}
      </span>

      {/* Badge */}
      {badge != null && (
        <span className="text-[10px] font-bold bg-[#0052cc] text-white px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-none">
          {badge}
        </span>
      )}
    </Link>
  );
}

/* ─── Section divider label ───────────────────────────────────── */
function SectionLabel({ label }) {
  return (
    <div className="px-3.5 pt-4 pb-1.5">
      <span className="text-[9px] font-black uppercase tracking-[0.28em] text-white/20">
        {label}
      </span>
    </div>
  );
}

/* ─── Sidebar content (shared between desktop + mobile) ───────── */
function SidebarContent({ onNavigate }) {
  const { user, userData, logOut } = useAuth();
  const role = userData?.role;
  const photoURL = userData?.photoURL || user?.photoURL || null;

  /* Student nav — all items always visible, no retakes */
  const studentNav = [
    { section: 'Main' },
    { icon: DashboardIcon,  label: 'Dashboard',    href: '/student/dashboard' },
    { icon: AssessmentIcon, label: 'Assessments',  href: '/student/assessments' },
    { icon: SessionIcon,    label: 'Sessions',     href: '/student/sessions' },
    { icon: ResultsIcon,    label: 'Results',      href: '/student/history' },
    { section: 'Performance' },
    { icon: AnalyticsIcon,  label: 'Analytics',    href: '/student/stats' },
    { section: 'Account' },
    { icon: ProfileIcon,    label: 'Profile',      href: '/settings' },
    { icon: SettingsIcon,   label: 'Settings',     href: '/settings' },
    { icon: BellIcon,       label: 'Notifications',href: '/student/notifications' },
  ];

  /* Staff nav — all items always visible */
  const staffNav = [
    { section: 'Overview' },
    { icon: DashboardIcon,  label: 'Dashboard',          href: '/staff/dashboard' },
    { icon: StudentsIcon,   label: 'Students',           href: '/staff/candidates' },
    { section: 'Assessments' },
    { icon: AssessmentIcon, label: 'Assessment Mgmt',    href: '/staff/assessments' },
    { icon: BuilderIcon,    label: 'Builder',            href: '/staff/builder' },
    { icon: AssignIcon,     label: 'Assignments',        href: '/staff/assign' },
    { section: 'Monitoring' },
    { icon: MonitorIcon,    label: 'Proctor Monitor',    href: '/staff/proctor' },
    { icon: AnalyticsIcon,  label: 'Analytics',          href: '/staff/stats' },
    { icon: ReportsIcon,    label: 'Reports',            href: '/staff/stats' },
    { section: 'Account' },
    { icon: SettingsIcon,   label: 'Settings',           href: '/settings' },
    { icon: BellIcon,       label: 'Notifications',      href: '/staff/notifications' },
  ];

  const navItems = role === 'staff' || role === 'admin' ? staffNav : studentNav;

  return (
    <aside className="w-64 bg-[#07080a] border-r border-white/[0.06] flex flex-col h-full">

      {/* ── Brand header ────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-white/[0.06]">
        <Link href="/" className="flex items-center gap-3 group" onClick={onNavigate}>
          <VeraxonLogo size="SM" className="group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(0,82,204,0.3)]" />
          <span className="font-black text-[15px] tracking-tight uppercase italic text-white/90 group-hover:text-white transition-colors">
            Veraxon
          </span>
        </Link>
      </div>

      {/* ── Role pill ───────────────────────────────────────── */}
      <div className="px-4 py-2.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full animate-pulse ${
            role === 'staff' || role === 'admin' ? 'bg-violet-400' : 'bg-emerald-400'
          }`} />
          <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${
            role === 'staff' || role === 'admin' ? 'text-violet-400' : 'text-emerald-400'
          }`}>
            {role === 'staff' || role === 'admin' ? 'Examiner Portal' : 'Student Terminal'}
          </span>
        </div>
      </div>

      {/* ── Navigation ──────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-2 custom-scrollbar" aria-label="Main navigation">
        {navItems.map((item, idx) => {
          if (item.section) {
            return <SectionLabel key={`section-${idx}`} label={item.section} />;
          }
          return (
            <NavItem
              key={item.href}
              icon={item.icon}
              label={item.label}
              href={item.href}
              badge={item.badge}
            />
          );
        })}
      </nav>

      {/* ── User footer ─────────────────────────────────────── */}
      <div className="p-3 border-t border-white/[0.06] space-y-1">
        {/* Profile card */}
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.09] transition-all group"
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt={userData?.username || 'User'}
              className="w-9 h-9 rounded-xl object-cover border border-white/10 shrink-0"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-[#0052cc]/20 border border-[#0052cc]/20 flex items-center justify-center text-[#0052cc] font-black text-sm shrink-0">
              {userData?.username?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white/85 truncate leading-tight">
              {userData?.username || userData?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[11px] text-white/30 truncate mt-0.5">
              {userData?.department || userData?.collegeName || 'Institution'}
            </p>
          </div>
        </Link>

        {/* Sign out */}
        <button
          onClick={logOut}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-white/35 hover:text-red-400 hover:bg-red-500/[0.07] border border-transparent hover:border-red-500/10 transition-all group"
        >
          <LogOutIcon size={18} />
          <span className="text-[13px] font-semibold">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}

/* ─── Main export ─────────────────────────────────────────────── */
export default function Sidebar({ role: _role }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3.5 left-4 z-50 lg:hidden p-2 rounded-xl bg-[#0a0a0f]/90 border border-white/10 text-white/60 hover:text-white transition-colors backdrop-blur-md"
        onClick={() => setMobileOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        {mobileOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
      </button>

      {/* Desktop — always visible fixed sidebar */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen z-40 w-64">
        <SidebarContent onNavigate={undefined} />
      </div>

      {/* Mobile — slide-in drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 h-screen z-50 lg:hidden w-64"
            >
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
