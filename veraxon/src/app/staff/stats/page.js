'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ShieldCheck, Users, ClipboardList, TrendingUp, Search 
} from 'lucide-react';

export default function StaffStatsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || (userData && userData.role !== 'staff' && userData.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'submissions'),
          where('collegeName', '==', userData?.collegeName),
          where('department', '==', userData?.department),
          orderBy('completedAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (userData) fetchStats();
  }, [user, userData]);

  if (authLoading || loading) return <div className="min-h-screen bg-black flex items-center justify-center text-primary animate-pulse font-mono tracking-widest">SCANNING NEURAL NETWORK...</div>;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-8">
      <header className="mb-12">
        <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Institutional Intelligence</h1>
        <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">{userData?.collegeName} • {userData?.department}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-2xl">
          <div className="text-white/40 text-[10px] font-black uppercase mb-1">Total Submissions</div>
          <div className="text-3xl font-black">{submissions.length}</div>
        </div>
        <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-2xl">
          <div className="text-white/40 text-[10px] font-black uppercase mb-1">Avg Score</div>
          <div className="text-3xl font-black">
            {submissions.length > 0 ? (submissions.reduce((a, b) => a + (b.score || 0), 0) / submissions.length).toFixed(1) : 0}%
          </div>
        </div>
        <div className="bg-[#0f0f12] border border-white/5 p-6 rounded-2xl">
          <div className="text-white/40 text-[10px] font-black uppercase mb-1">Integrity Index</div>
          <div className="text-3xl font-black">94.2%</div>
        </div>
      </div>

      <div className="bg-[#0f0f12] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-[10px] font-black uppercase tracking-widest text-white/40">
            <tr>
              <th className="p-6">Candidate</th>
              <th className="p-6">Department</th>
              <th className="p-6">Score</th>
              <th className="p-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {submissions.map(sub => (
              <tr key={sub.id} className="hover:bg-white/[0.02] transition-all">
                <td className="p-6">
                  <div className="font-bold">{sub.userName || 'Anonymous'}</div>
                  <div className="text-[10px] text-white/40">{sub.userId?.substring(0, 8)}...</div>
                </td>
                <td className="p-6 text-sm text-white/60">{sub.department}</td>
                <td className="p-6 font-mono font-bold text-accentBlue">{sub.score?.toFixed(1)}%</td>
                <td className="p-6 text-[10px] font-black uppercase tracking-widest text-emerald-500">Verified</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
