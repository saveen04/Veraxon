"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NotificationDropdown from "@/components/NotificationDropdown";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Play, ShieldCheck, History, Activity,
  ClipboardList, CheckCircle2, Clock, ChevronRight, Layers
} from "lucide-react";

function Skel({ className = "" }) {
  return <div className={`skeleton rounded-xl ${className}`} aria-hidden="true" />;
}

function PageSpinner({ label = "Loading portal…" }) {
  return (
    <div className="min-h-screen bg-[#030303] flex flex-col items-center justify-center gap-3">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">{label}</p>
    </div>
  );
}

export default function StudentDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [stats,       setStats]       = useState({ assigned: 0, completed: 0, integrity: 98 });
  const [recentTests, setRecentTests] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  /* ── Guard: runs once loading=false (user+userData resolved atomically) ─ */
  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      router.replace("/login");
      return;
    }

    if (userData.role === "staff" || userData.role === "admin") {
      router.replace("/staff/dashboard");
      return;
    }

    if (!userData.profileCompleted && !(userData.collegeName && userData.department)) {
      router.replace("/onboarding");
    }
  }, [loading, user, userData, router]);

  /* ── Load data only when we know the user is a student ──────────── */
  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role !== "student" && userData.role !== "admin") return;

    let cancelled = false;

    (async () => {
      try {
        const [assignSnap, subSnap, pubSnap] = await Promise.all([
          // Single-field query only — filter isRetake client-side
          getDocs(query(
            collection(db, "assignments"),
            where("assignedTo", "array-contains", user.uid)
          )),
          getDocs(query(
            collection(db, "submissions"),
            where("userId", "==", user.uid)
          )),
          getDocs(query(
            collection(db, "tests"),
            where("status", "==", "published")
          )),
        ]);

        if (cancelled) return;

        // Filter active assignments client-side to avoid composite index
        const allAssigned = assignSnap.docs
          .map(d => d.data())
          .filter(a => a.status === "active");
        const subs = subSnap.docs.map(d => d.data());

        setStats({
          assigned:  allAssigned.filter(a => !a.isRetake).length,
          completed: subs.filter(s => s.status === "completed" || s.status === "disqualified").length,
          integrity: 98,
        });
        setRecentTests(pubSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 4));
      } catch (e) {
        console.error("[StudentDashboard] data load error:", e.code, e.message);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [loading, user, userData]);

  /* ── While auth resolves show spinner ───────────────────────────── */
  if (loading) return <PageSpinner />;

  /* ── After auth: wrong state → spinner while redirect navigates ── */
  if (!user || !userData) return <PageSpinner />;
  if (userData.role === "staff" || userData.role === "admin") return <PageSpinner label="Redirecting to staff portal…" />;

  /* ── Render dashboard ───────────────────────────────────────────── */
  const statItems = [
    { label: "Assigned",  value: stats.assigned,        icon: <ClipboardList size={18} />, color: "text-[#0052cc]",   bg: "bg-[#0052cc]/10",   href: "/student/assessments" },
    { label: "Completed", value: stats.completed,       icon: <CheckCircle2 size={18} />,  color: "text-emerald-400", bg: "bg-emerald-400/10", href: "/results" },
    { label: "Results",   value: "View",                icon: <History size={18} />,        color: "text-amber-400",   bg: "bg-amber-400/10",   href: "/results" },
    { label: "Integrity", value: `${stats.integrity}%`, icon: <ShieldCheck size={18} />,   color: "text-violet-400",  bg: "bg-violet-400/10",  href: "/student/stats" },
  ];

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden">
      <div className="ambient-matrix-bg opacity-20" />
      <Sidebar role="student" />
      <div className="flex flex-1 overflow-hidden">
        {/* Spacer reserves the 256px fixed sidebar slot in flex layout */}
        <div className="sidebar-spacer" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 xl:p-10 custom-scrollbar">

          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Activity size={10} className="text-[#0052cc]" />
                <span className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.3em]">Terminal Online</span>
              </div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                Welcome, {userData.username?.split(" ")[0] || "Candidate"}
              </h1>
              <p className="text-[10px] text-white/35 uppercase tracking-widest mt-1.5 font-medium">
                {userData.collegeName || "—"} · {userData.department || "—"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/student/assessments" className="jira-btn-primary !py-2.5 !px-5 flex items-center gap-2 text-[11px]">
                <Play size={12} className="fill-current" /> Join Session
              </Link>
              <NotificationDropdown />
            </div>
          </header>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {dataLoading
              ? [...Array(4)].map((_, i) => (
                <div key={i} className="jira-premium-card !p-6">
                  <div className="flex items-center gap-4 mb-4"><Skel className="w-11 h-11" /><div className="flex-1 space-y-2"><Skel className="h-2.5 w-1/3" /><Skel className="h-2 w-1/2" /></div></div>
                  <Skel className="h-8 w-1/3" />
                </div>
              ))
              : statItems.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <Link href={s.href} className="jira-premium-card !p-5 flex items-center gap-4 hover:scale-[1.02] transition-transform block">
                    <div className={`p-2.5 rounded-xl ${s.bg} ${s.color} shrink-0`}>{s.icon}</div>
                    <div>
                      <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">{s.label}</p>
                      <p className={`text-2xl font-black italic ${s.color}`}>{s.value}</p>
                    </div>
                  </Link>
                </motion.div>
              ))
            }
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
              <div className="space-y-3">{[...Array(3)].map((_, i) => <Skel key={i} className="h-16" />)}</div>
            ) : recentTests.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-white/[0.06] rounded-2xl">
                <ClipboardList size={32} className="text-white/10 mx-auto mb-3" />
                <p className="text-[11px] text-white/20 uppercase tracking-widest">No assessments available yet.</p>
                <p className="text-[10px] text-white/10 mt-1.5">Ask your instructor to publish assessments or join via session token.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTests.map((test, i) => (
                  <motion.div key={test.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    className="glass-card !p-4 rounded-xl border border-white/[0.06] flex items-center justify-between gap-4 hover:border-[#0052cc]/30 transition-all">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#0052cc]/10 flex items-center justify-center shrink-0"><Layers size={14} className="text-[#0052cc]" /></div>
                      <div className="min-w-0">
                        <p className="font-black text-sm text-white truncate">{test.title}</p>
                        <p className="text-[9px] text-white/30 flex items-center gap-2 mt-0.5">
                          <Clock size={8} /> {test.duration || 0} min · {test.questions?.length || test.questionCount || 0} Qs
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
          <section className="grid grid-cols-2 gap-4 pb-6">
            <Link href="/results" className="jira-premium-card !p-5 flex items-center gap-4 hover:border-[#0052cc]/30 transition-all group">
              <div className="p-3 rounded-xl bg-[#0052cc]/10 text-[#0052cc] group-hover:scale-110 transition-transform"><ClipboardList size={18} /></div>
              <div>
                <p className="font-black text-sm text-white">My Results</p>
                <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">{stats.completed} completed</p>
              </div>
              <ChevronRight size={14} className="text-white/20 ml-auto" />
            </Link>
            <Link href="/student/history" className="jira-premium-card !p-5 flex items-center gap-4 hover:border-emerald-400/30 transition-all group">
              <div className="p-3 rounded-xl bg-emerald-400/10 text-emerald-400 group-hover:scale-110 transition-transform"><History size={18} /></div>
              <div>
                <p className="font-black text-sm text-white">Exam History</p>
                <p className="text-[9px] text-white/30 uppercase tracking-widest mt-0.5">Full attempt log</p>
              </div>
              <ChevronRight size={14} className="text-white/20 ml-auto" />
            </Link>
          </section>

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
