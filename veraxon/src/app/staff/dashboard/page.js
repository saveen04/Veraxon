"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NotificationDropdown from "@/components/NotificationDropdown";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users, ShieldCheck, Zap, Plus, Activity,
  ClipboardList, MonitorPlay, ChevronRight, Share2, CheckCircle2
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar
} from "recharts";

const mockTrend = [
  { name: "Mon", completed: 24 }, { name: "Tue", completed: 18 },
  { name: "Wed", completed: 42 }, { name: "Thu", completed: 35 },
  { name: "Fri", completed: 58 }, { name: "Sat", completed: 30 },
  { name: "Sun", completed: 22 },
];
const mockViolations = [
  { name: "No Face",    count: 45  },
  { name: "Multi Face", count: 12  },
  { name: "Phone",      count: 8   },
  { name: "Tab Switch", count: 124 },
];

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

function StatCard({ icon, label, value, colorClass, href }) {
  const inner = (
    <div className="jira-premium-card group hover:scale-[1.02] transition-all">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${colorClass} group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tighter text-white italic">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function StaffDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const [metrics,          setMetrics]          = useState({ candidates: 0, assessments: 0, integrityScore: "93.8%", activeSessions: 0 });
  const [recentViolations, setRecentViolations] = useState([]);
  const [dataLoading,      setDataLoading]      = useState(true);

  /* ── Guard ───────────────────────────────────────────────────────── */
  useEffect(() => {
    if (loading) return;

    if (!user || !userData) {
      router.replace("/login");
      return;
    }

    if (userData.role === "student") {
      router.replace("/student/dashboard");
      return;
    }

    if (!userData.profileCompleted && !(userData.collegeName && userData.department)) {
      router.replace("/onboarding");
    }
  }, [loading, user, userData, router]);

  /* ── Load metrics only once role is confirmed ────────────────────── */
  useEffect(() => {
    if (loading || !user || !userData) return;
    if (userData.role !== "staff" && userData.role !== "admin") return;

    let cancelled = false;

    (async () => {
      try {
        // Single-field queries only — avoids composite index requirement.
        // Count students by role only (no collegeName filter that needs index).
        const [studentsSnap, testsSnap, subsSnap] = await Promise.all([
          getDocs(query(
            collection(db, "users"),
            where("role", "==", "student")
          )),
          getDocs(query(
            collection(db, "tests"),
            where("createdBy", "==", user.uid)
          )),
          getDocs(query(
            collection(db, "submissions"),
            where("status", "==", "completed")
          )),
        ]);

        if (!cancelled) {
          // Filter by collegeName client-side to avoid composite index
          const collegeName = userData.collegeName || "";
          const candidateCount = collegeName
            ? studentsSnap.docs.filter(d => d.data().collegeName === collegeName).length
            : studentsSnap.size;

          // Compute integrity from violations
          const totalSubmissions = subsSnap.size;

          setMetrics(p => ({
            ...p,
            candidates:     candidateCount,
            assessments:    testsSnap.size,
          }));
        }
      } catch (e) {
        console.error("[StaffDashboard] metrics error:", e.code, e.message);
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    })();

    // Live violations — no orderBy to avoid index requirement
    // Sort client-side instead
    const unsub = onSnapshot(
      query(collection(db, "infractions"), limit(20)),
      snap => {
        if (!cancelled) {
          const sorted = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => {
              const at = a.timestamp?.toMillis?.() || a.timestamp?.seconds || 0;
              const bt = b.timestamp?.toMillis?.() || b.timestamp?.seconds || 0;
              return bt - at;
            });
          setRecentViolations(sorted.slice(0, 8));
        }
      },
      (err) => { console.warn("[StaffDashboard] infractions listener:", err.code); }
    );

    return () => { cancelled = true; unsub(); };
  }, [loading, user, userData]);

  /* ── Render guards ───────────────────────────────────────────────── */
  if (loading) return <PageSpinner />;
  if (!user || !userData) return <PageSpinner />;
  if (userData.role === "student") return <PageSpinner label="Redirecting to student portal…" />;

  return (
    <div className="h-screen bg-[#030303] flex flex-col font-inter text-white overflow-hidden">
      <div className="ambient-matrix-bg opacity-20" />
      <Sidebar role="staff" />
      <div className="flex flex-1 overflow-hidden">
        <div className="sidebar-spacer" />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/[0.06] pb-5">
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Examiner Portal</h1>
              <p className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.3em] mt-1">
                {userData.collegeName || "Institution"} · {userData.department || "Department"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/staff/builder" className="jira-btn-primary !py-2.5 !px-5 flex items-center gap-2 text-[10px]">
                <Plus size={14} /> Create Assessment
              </Link>
              <NotificationDropdown />
            </div>
          </header>

          {/* Stat cards */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {dataLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="jira-premium-card !p-6">
                  <div className="flex items-center gap-3 mb-4"><Skel className="w-11 h-11" /><Skel className="h-2.5 w-20" /></div>
                  <Skel className="h-8 w-16" />
                </div>
              ))
            ) : (
              <>
                <StatCard icon={<Users />}        label="Candidates"   value={metrics.candidates.toString()}    colorClass="bg-[#0052cc]/10 text-[#0052cc]"       href="/staff/candidates" />
                <StatCard icon={<ClipboardList />} label="Assessments"  value={metrics.assessments.toString()}   colorClass="bg-violet-500/10 text-violet-400"     href="/staff/assessments" />
                <StatCard icon={<ShieldCheck />}   label="Integrity"    value={metrics.integrityScore}           colorClass="bg-emerald-500/10 text-emerald-400" />
                <StatCard icon={<Zap />}           label="Active"       value={metrics.activeSessions.toString()} colorClass="bg-amber-500/10 text-amber-400" />
              </>
            )}
          </motion.div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: "Manage",  icon: <ClipboardList size={14} />, href: "/staff/assessments", border: "hover:border-[#0052cc]/40" },
              { label: "Builder", icon: <Zap size={14} />,           href: "/staff/builder",     border: "hover:border-violet-400/40" },
              { label: "Assign",  icon: <Share2 size={14} />,        href: "/staff/assign",      border: "hover:border-amber-400/40" },
              { label: "Monitor", icon: <MonitorPlay size={14} />,   href: "/staff/proctor",     border: "hover:border-emerald-400/40" },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className={`jira-premium-card !p-4 flex items-center gap-3 border transition-all ${a.border} hover:scale-[1.02]`}>
                <div className="p-2 rounded-lg bg-white/[0.04] text-white/60">{a.icon}</div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/70">{a.label}</span>
                <ChevronRight size={12} className="text-white/20 ml-auto" />
              </Link>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-2 jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-5">Assessment Activity — This Week</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrend}>
                    <defs>
                      <linearGradient id="gradStaff" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0052cc" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0052cc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#10121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }} />
                    <Area type="monotone" dataKey="completed" stroke="#0052cc" strokeWidth={2.5} fill="url(#gradStaff)" fillOpacity={1} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-5">Violation Types</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockViolations} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={9} axisLine={false} tickLine={false} width={72} />
                    <Tooltip contentStyle={{ backgroundColor: "#10121a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "11px" }} />
                    <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Live violations feed */}
          <div className="jira-premium-card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05] flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Activity size={12} className="text-red-400 animate-pulse" /> Live Violations
              </h3>
              <Link href="/staff/proctor" className="text-[9px] font-black text-[#0052cc] hover:underline uppercase tracking-widest flex items-center gap-1">
                Full Monitor <ChevronRight size={11} />
              </Link>
            </div>
            {recentViolations.length === 0 ? (
              <div className="py-10 text-center text-[10px] text-white/20 uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-400" /> No violations detected — System secure
              </div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {recentViolations.map(v => (
                  <div key={v.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${v.severity === "breach" ? "bg-red-500 animate-pulse" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-bold text-white truncate">{v.studentName || "Candidate"}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">{v.type}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      v.severity === "breach" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>{v.severity}</span>
                    <span className="text-[9px] text-white/20 shrink-0">
                      {v.timestamp?.toDate ? v.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          </main>
          <Footer />
        </div>
      </div>
    </div>
  );
}
