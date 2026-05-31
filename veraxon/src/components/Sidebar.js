'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  BrainCircuit, 
  History, 
  Settings, 
  LogOut,
  MonitorPlay,
  Zap
} from 'lucide-react';

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const { userData, logOut } = useAuth();

  const studentItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', href: '/student/dashboard' },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Assessments', href: '/student/assessments' },
    { icon: <Zap className="w-5 h-5" />, label: 'Analytics', href: '/student/stats' },
    { icon: <History className="w-5 h-5" />, label: 'My History', href: '/student/history' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/settings' },
  ];

  const staffItems = [
    { icon: <LayoutDashboard className="w-5 h-5" />, label: 'Overview', href: '/staff/dashboard' },
    { icon: <ClipboardList className="w-5 h-5" />, label: 'Assessments', href: '/staff/assessments' },
    { icon: <Users className="w-5 h-5" />, label: 'Candidates', href: '/staff/candidates' },
    { icon: <BrainCircuit className="w-5 h-5" />, label: 'Intelligence', href: '/staff/stats' },
    { icon: <MonitorPlay className="w-5 h-5" />, label: 'Live Monitor', href: '/staff/proctor' },
    { icon: <Settings className="w-5 h-5" />, label: 'Settings', href: '/settings' },
  ];

  const menuItems = role === 'staff' ? staffItems : studentItems;

  return (
    <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col fixed left-0 top-0 h-screen z-40">
      {/* Brand Logo */}
      <div className="p-8 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0052cc] to-purple-600 flex items-center justify-center font-black text-white text-sm shadow-lg shadow-[#0052cc]/20">
            V
          </div>
          <span className="font-black text-xl tracking-tighter uppercase italic text-white/90">Veraxon</span>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive 
                  ? 'bg-white/5 text-[#0052cc]' 
                  : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
              }`}
            >
              <div className={`${isActive ? 'text-[#0052cc]' : 'text-inherit group-hover:text-white transition-colors'}`}>
                {React.cloneElement(item.icon, { className: 'w-5 h-5' })}
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-[0.15em] ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                 <div className="ml-auto w-1 h-4 bg-[#0052cc] rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Footer Action */}
      <div className="mt-auto p-4 border-t border-white/5 bg-black/20">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-[#0052cc]/20 flex items-center justify-center text-[#0052cc] font-black text-[10px]">
              {userData?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black text-white/80 uppercase truncate">
                {userData?.username || 'User Node'}
              </span>
              <span className="text-[7px] font-bold text-white/20 uppercase tracking-widest truncate">
                {userData?.department || 'Department Alpha'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={logOut}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-white/20 hover:text-red-500 hover:bg-red-500/5 transition-all group"
        >
          <LogOut className="w-4 h-4 group-hover:rotate-12 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
