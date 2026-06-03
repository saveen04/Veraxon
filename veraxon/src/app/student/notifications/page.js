'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { BellIcon } from '@/components/icons';

export default function StudentNotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (!loading && !user) return null;

  return (
    <div className="min-h-screen bg-black flex flex-col font-inter text-white">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1">
        <Sidebar role="student" />
        <main className="flex-1 ml-64 p-10 overflow-y-auto">
          <header className="flex items-center gap-4 mb-8 border-b border-white/[0.06] pb-6">
            <span className="text-[#0052cc]"><BellIcon size={28} /></span>
            <div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Student Portal</p>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white mt-1">Notifications</h1>
            </div>
          </header>

          <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/[0.06] rounded-2xl text-center">
            <span className="text-white/10 mb-4"><BellIcon size={48} /></span>
            <p className="text-[12px] font-bold text-white/25 uppercase tracking-widest">No notifications</p>
            <p className="text-[10px] text-white/15 uppercase tracking-widest mt-2">
              Assignment alerts and updates will appear here.
            </p>
          </div>
        </main>
      </div>
      <Footer className="ml-64" />
    </div>
  );
}
