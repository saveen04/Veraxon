'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRedirect() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    // userData may still be loading from Firestore even after auth resolves.
    // Wait for it before deciding which dashboard to send the user to.
    if (!userData) return;
    if (userData?.role === 'staff' || userData?.role === 'admin') {
      router.replace('/staff/dashboard');
    } else {
      router.replace('/student/dashboard');
    }
  }, [user, userData, loading, router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );
}
