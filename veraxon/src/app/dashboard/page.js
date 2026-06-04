'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function DashboardRedirect() {
  const router    = useRouter();
  const { user, userData, loading } = useAuth();
  const didRedirect = useRef(false);

  useEffect(() => {
    if (loading || didRedirect.current) return;

    didRedirect.current = true;

    if (!user || !userData) {
      router.replace('/login');
      return;
    }

    if (userData.role === 'staff' || userData.role === 'admin') {
      router.replace('/staff/dashboard');
    } else {
      router.replace('/student/dashboard');
    }
  }, [loading, user, userData, router]);

  return null;
}
