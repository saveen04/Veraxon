"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NotificationDropdown from "@/components/NotificationDropdown";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Play, ShieldCheck, History, Zap, Trophy, Activity,
  ClipboardList, RefreshCw, CheckCircle2, Clock, ChevronRight, Layers
} from "lucide-react";

function SkeletonCard() {
  return <div className="jira-premium-card !p-6 animate-pulse"><div className="h-4 bg-white/[0.05] rounded w-1/2 mb-3" /><div className="h-7 bg-white/[0.07] rounded w-1/3" /></div>;
}

export default function StudentDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ assigned: 0, completed: 0, retakes: 0, integrity: 98 });
  const [recentTests, setRecentTests] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    // Wait for userData before making role-based decisions
    if (!userData) return;
    if (userData.role !== "student" && userData.role !== "admin") { router.push("/staff/dashboard"); return; }
    if (!userData.profileCompleted && !(userData.collegeName && userData.department)) { router.push("/onboarding"); return; }
  }, [loading, user, userData, router]);

  useEffect(() => {
    if (!user) return;
    const loadData = async () => {
      try {
        // Assigned assessments
        const assignQ = query(collection(db, "assignments"), where("assignedTo", "array-contains", user.uid), where("status", "==", "active"));
        const assignSnap = await getDocs(assignQ);
        const allAssigned = assignSnap.docs.map(d => d.data());
        const regular = allAssigned.filter(a => !a.isRetake);
        const retakes = allAssigned.filter(a => a.isRetake);

        // Completed submissions
        const subQ = query(collection(db, "submissions"), where("userId", "==", user.uid));
        const subSnap = await getDocs(subQ);
        const subs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const completed = subs.filter(s => s.status === "completed" || s.status === "disqualified");

        // Recent published tests
        const pubQ = query(collection(db, "tests"), where("status", "==", "published"));
        const pubSnap = await getDocs(pubQ);
        const pub = pubSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 4);

        setStats({ assigned: regular.length, completed: completed.length, retakes: retakes.length, integrity: 98 });
        setRecentTests(pub);
      } catch (e) { console.error(e); }
      finally { setDataLoading(false); }
    };
    loadData();
  }, [user]);

  // Still resolving auth — don't render or redirect yet
  if (loading || (user && !userData)) return null;

  // Auth resolved but no session — go to login
  if (!user) return null; // redirect handled in useEffect

  // Wrong role — redirect handled in useEffect
  if (userData && userData.role !== "student" && userData.role !== "admin") return null;

  const statItems = [
    { label: "Assigned", value: stats.assigned, icon: <ClipboardList size={18} />, color: "text-[#0052cc]", bg: "bg-[#0052cc]/10", href: "/student/assessments" },
    { label: "Completed", value: stats.completed, icon: <CheckCircle2 size={18} />, color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/student/history" },
    { label: "Retakes", value: stats.retakes, icon: <RefreshCw size={18} />, color: "text-amber-400", bg: "bg-amber-400/10", href: "/student/retakes" },
    { label: "Integrity", value: `${stats.integrity}%`, icon: <ShieldCheck size={18} />, color: "text-violet-400", bg: "bg-violet-400/10", href: "/student/stats" },
  ];

  return (
    <div className="min-h-screen bg-black flex flex-col font-inter text-white">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1">
        <Sidebar role="student" />
        <main className="flex-1 ml-64 p-10 overflow-y-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Activity size={10} className="text-[#0052cc]" />
                <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.3em]">Terminal Online</span>
              </div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                Welcome, {userData?.username?.split(" ")[0] || "Candidate"}
              </h1>
              <p className="text-[10px] text-white/35 uppercase tracking-widest mt-1.5 font-medium">{userData?.collegeName} · {userData?.department}</p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/student/assessments" className="jira-btn-primary !py-2.5 !px-5 flex items-center gap-2 text-[11px]">
                <Play size={12} className="fill-current" /> Join Session
              </Link>
              <NotificationDropdown />
            </div>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {dataLoading ? [...Array(4)].map((_, i) => <SkeletonCard key={i} />) : statItems.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link href={s.href} className="jira-premium-card !p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform block">
                  <div className={`p-2.5 rounded-xl ${s.bg} ${s.color} shrink-0`}>{s.icon}</div>
                  <div>
                    <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{s.label}</p>
                    <p className={`text-2xl font-black italic ${s.color}`}>{s.value}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Available assessments */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Layers size={12} /> Available Assessments
              </h2>
              <Link href="/student/assessments" className="text-[9px] font-black text-[#0052cc] hover:underline uppercase tracking-widest flex items-center gap-1">
                View All <ChevronRight size={11} />
              </Link>
            </div>
            {dataLoading ? (
              <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/[0.02] rounded-xl animate-pulse" />)}</div>
            ) : recentTests.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
                <ClipboardList size={32} className="text-white/10 mx-auto mb-3" />
                <p className="text-[11px] text-white/20 uppercase tracking-widest">No assessments available yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTests.map((test, i) => (
                  <motion.div key={test.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-card !p-4 rounded-xl border border-white/5 flex items-center justify-between gap-4 hover:border-[#0052cc]/30 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#0052cc]/10 flex items-center justify-center shrink-0"><Layers size={14} className="text-[#0052cc]" /></div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-white truncate">{test.title}</p>
                        <p className="text-[9px] text-white/30 flex items-center gap-2 mt-0.5">
                          <Clock size={8} /> {test.duration} min · {test.questions?.length || 0} Questions
                        </p>
                      </div>
                    </div>
                    <Link href={`/env-check?examId=${test.id}`} className="jira-btn-primary !py-2 !px-4 text-[9px] flex items-center gap-1.5 shrink-0">
                      <Play size={10} className="fill-current" /> Start
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Quick links */}
          <section className="grid grid-cols-2 gap-4">
            <Link href="/student/retakes" className="jira-premium-card !p-5 flex items-center gap-4 hover:border-amber-400/30 transition-all group">
              <div className="p-3 rounded-xl bg-amber-400/10 text-amber-400 group-hover:scale-110 transition-transform"><RefreshCw size={18} /></div>
              <div>
                <p className="font-black text-sm text-white">Retake Assessments</p>
                <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{stats.retakes} pending</p>
              </div>
              <ChevronRight size={14} className="text-white/20 ml-auto" />
            </Link>
            <Link href="/student/history" className="jira-premium-card !p-5 flex items-center gap-4 hover:border-emerald-400/30 transition-all group">
              <div className="p-3 rounded-xl bg-emerald-400/10 text-emerald-400 group-hover:scale-110 transition-transform"><History size={18} /></div>
              <div>
                <p className="font-black text-sm text-white">Exam History</p>
                <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{stats.completed} completed</p>
              </div>
              <ChevronRight size={14} className="text-white/20 ml-auto" />
            </Link>
          </section>
        </main>
      </div>
      <Footer className="ml-64" />
    </div>
  );
}
