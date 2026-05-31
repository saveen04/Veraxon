'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Target, 
  Activity, 
  ShieldCheck, 
  ArrowLeft,
  Calendar,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';

export default function StudentStatsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    
    const fetchStats = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'submissions'),
          where('userId', '==', user.uid),
          orderBy('completedAt', 'desc')
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSubmissions(docs);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchStats();
  }, [user, authLoading, router]);

  if (authLoading || loading) return <div className="min-h-screen bg-black flex items-center justify-center text-accentBlue animate-pulse font-black uppercase tracking-[0.3em]">Processing Neural Metrics...</div>;

  const averageScore = submissions.length > 0 
    ? (submissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / submissions.length).toFixed(1) 
    : 0;

  return (
    <div className="min-h-screen bg-[#030303] text-white p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 flex items-center justify-between">
          <Link href="/student/dashboard" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/60">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="text-right">
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">Performance Cortex</h1>
            <p className="text-[10px] font-bold text-accentBlue uppercase tracking-widest mt-1">Institutional Analytics Vector</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <StatCard icon={<Trophy className="w-4 h-4" />} label="Average Quota" value={`${averageScore}%`} color="text-yellow-500" />
          <StatCard icon={<Target className="w-4 h-4" />} label="Validated Cycles" value={submissions.length} color="text-accentBlue" />
          <StatCard icon={<Activity className="w-4 h-4" />} label="Sync Integrity" value="98.2%" color="text-emerald-500" />
          <StatCard icon={<ShieldCheck className="w-4 h-4" />} label="Trust Rank" value="VEX-1" color="text-purple-500" />
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
             <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 flex items-center gap-2">
                <BarChart3 className="w-3 h-3 text-accentBlue" />
                Historical Telemetry
             </h2>
          </div>

          {submissions.length === 0 ? (
            <div className="py-24 text-center border border-white/5 border-dashed rounded-3xl">
               <p className="text-[10px] font-black uppercase tracking-widest text-white/20 italic">No validated assessment logs detected in neural core.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="p-6 rounded-2xl border border-white/5 bg-[#0f0f12] flex items-center justify-between hover:border-accentBlue/20 transition-all group">
                   <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs ${sub.score >= 50 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                         {sub.score}%
                      </div>
                      <div>
                         <h3 className="text-xs font-black uppercase tracking-widest text-white/80 group-hover:text-white transition-colors">{sub.examTitle || 'Validated Terminal'}</h3>
                         <div className="flex items-center gap-3 mt-1.5 opacity-40">
                            <Calendar className="w-3 h-3" />
                            <span className="text-[9px] font-bold uppercase">{sub.completedAt?.toDate().toLocaleDateString() || 'UNSYNCED'}</span>
                         </div>
                      </div>
                   </div>
                   <Link href={`/student/result/${sub.id}`} className="px-4 py-2 rounded-lg border border-white/10 hover:border-accentBlue/50 hover:bg-accentBlue/10 transition-all text-[9px] font-black uppercase tracking-widest">
                      Audit Log
                   </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div className="p-6 rounded-2xl border border-white/5 bg-[#0f0f12] relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
         {icon}
      </div>
      <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-2xl font-black italic tracking-tighter ${color}`}>{value}</p>
      <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
         <div className={`h-full bg-current ${color} opacity-20`} style={{ width: '60%' }}></div>
      </div>
    </div>
  );
}
