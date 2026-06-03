"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NotificationDropdown from "@/components/NotificationDropdown";
import { motion } from "framer-motion";
import { collection, query, where, getDocs, getCountFromServer, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Users, ShieldCheck, Zap, Plus, Activity, QrCode, Copy,
  ClipboardList, BarChart2, MonitorPlay, ChevronRight, Share2,
  AlertTriangle, CheckCircle2, Eye
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const mockTrend = [
  { name: "Mon", active: 40, completed: 24 }, { name: "Tue", active: 30, completed: 18 },
  { name: "Wed", active: 55, completed: 42 }, { name: "Thu", active: 48, completed: 35 },
  { name: "Fri", active: 62, completed: 58 }, { name: "Sat", active: 35, completed: 30 },
  { name: "Sun", active: 28, completed: 22 },
];
const mockViolations = [
  { name: "No Face", count: 45 }, { name: "Multi Face", count: 12 },
  { name: "Phone", count: 8 }, { name: "Tab Switch", count: 124 },
];

function StatCard({ icon, label, value, color, href }) {
  const colorMap = { blue: "bg-[#0052cc]/10 text-[#0052cc]", emerald: "bg-emerald-500/10 text-emerald-400", amber: "bg-amber-500/10 text-amber-400", violet: "bg-violet-500/10 text-violet-400" };
  const content = (
    <div className="jira-premium-card group transition-all hover:scale-[1.02]">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-3 rounded-xl ${colorMap[color]} group-hover:scale-110 transition-transform`}>
          {React.cloneElement(icon, { className: "w-5 h-5" })}
        </div>
        <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-3xl font-black tracking-tighter text-white italic">{value}</div>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

export default function StaffDashboard() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState({ candidates: 0, activeSessions: 0, integrityScore: "93.8%", assessments: 0 });
  const [recentViolations, setRecentViolations] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (userData) {
      if (userData.role !== "staff" && userData.role !== "admin") { router.push("/student/dashboard"); return; }
      if (!userData.profileCompleted && !(userData.collegeName && userData.department)) { router.push("/onboarding"); return; }
    }
  }, [loading, user, userData, router]);

  useEffect(() => {
    if (!userData) return;
    const fetchMetrics = async () => {
      try {
        const uQ = query(collection(db, "users"), where("role", "==", "student"), where("collegeName", "==", userData.collegeName || ""));
        const uSnap = await getCountFromServer(uQ);
        const tQ = query(collection(db, "tests"), where("createdBy", "==", user.uid));
        const tSnap = await getCountFromServer(tQ);
        setMetrics(p => ({ ...p, candidates: uSnap.data().count, assessments: tSnap.data().count }));
      } catch (e) { console.error(e); }
      finally { setDataLoading(false); }
    };
    fetchMetrics();

    // Live violations
    const vQ = query(collection(db, "infractions"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(vQ, snap => {
      setRecentViolations(snap.docs.slice(0, 8).map(d => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsub();
  }, [userData, user]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" /></div>;
  if (!user || (userData && userData.role !== "staff" && userData.role !== "admin")) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-black flex flex-col font-inter text-white">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1">
        <Sidebar role="staff" />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
            <div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white">Examiner Portal</h1>
              <p className="text-[9px] font-black text-[#0052cc] uppercase tracking-[0.3em] mt-1">
                {userData?.collegeName || "Institution"} · {userData?.department || "Department"}
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
            <StatCard icon={<Users />} label="Candidates" value={dataLoading ? "…" : metrics.candidates.toString()} color="blue" href="/staff/candidates" />
            <StatCard icon={<ClipboardList />} label="Assessments" value={dataLoading ? "…" : metrics.assessments.toString()} color="violet" href="/staff/assessments" />
            <StatCard icon={<ShieldCheck />} label="Integrity" value={metrics.integrityScore} color="emerald" />
            <StatCard icon={<Zap />} label="Active Sessions" value={metrics.activeSessions.toString()} color="amber" />
          </motion.div>

          {/* Quick actions */}
          <div className="grid grid-cols-4 gap-3 mb-8">
            {[
              { label: "Manage", icon: <ClipboardList size={14} />, href: "/staff/assessments", color: "hover:border-[#0052cc]/40" },
              { label: "Builder", icon: <Zap size={14} />, href: "/staff/builder", color: "hover:border-violet-400/40" },
              { label: "Assign", icon: <Share2 size={14} />, href: "/staff/assign", color: "hover:border-amber-400/40" },
              { label: "Monitor", icon: <MonitorPlay size={14} />, href: "/staff/proctor", color: "hover:border-emerald-400/40" },
            ].map(a => (
              <Link key={a.label} href={a.href}
                className={`jira-premium-card !p-4 flex items-center gap-3 border transition-all ${a.color} hover:scale-[1.02]`}>
                <div className="p-2 rounded-lg bg-white/[0.04] text-white/60">{a.icon}</div>
                <span className="text-[11px] font-black uppercase tracking-widest text-white/70">{a.label}</span>
                <ChevronRight size={12} className="text-white/20 ml-auto" />
              </Link>
            ))}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="col-span-2 jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-5">Assessment Activity — This Week</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={mockTrend}>
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0052cc" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#0052cc" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#161a22", border: "1px solid #30363d", borderRadius: "8px", fontSize: "11px" }} />
                    <Area type="monotone" dataKey="completed" stroke="#0052cc" strokeWidth={2.5} fillOpacity={1} fill="url(#grad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="jira-premium-card !p-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-5">Violation Types</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={mockViolations} layout="vertical" margin={{ left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                    <XAxis type="number" stroke="rgba(255,255,255,0.2)" fontSize={9} axisLine={false} tickLine={false} />
                    <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={9} axisLine={false} tickLine={false} width={72} />
                    <Tooltip contentStyle={{ backgroundColor: "#161a22", border: "1px solid #30363d", borderRadius: "8px", fontSize: "11px" }} />
                    <Bar dataKey="count" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Live violations feed */}
          <div className="jira-premium-card !p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                <Activity size={12} className="text-red-400 animate-pulse" /> Live Violations
              </h3>
              <Link href="/staff/proctor" className="text-[9px] font-black text-[#0052cc] hover:underline uppercase tracking-widest flex items-center gap-1">
                Full Monitor <ChevronRight size={11} />
              </Link>
            </div>
            {recentViolations.length === 0 ? (
              <div className="py-10 text-center text-[10px] text-white/20 uppercase tracking-widest">No violations detected · System secure</div>
            ) : (
              <div className="divide-y divide-white/[0.03]">
                {recentViolations.map(v => (
                  <div key={v.id} className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${v.severity === "breach" ? "bg-red-500 animate-pulse" : "bg-amber-400"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-white truncate">{v.studentName || "Candidate"}</p>
                      <p className="text-[9px] text-white/30 uppercase tracking-widest">{v.type}</p>
                    </div>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${v.severity === "breach" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                      {v.severity}
                    </span>
                    <span className="text-[9px] text-white/20">{v.timestamp?.toDate ? v.timestamp.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
      <Footer className="ml-64" />
    </div>
  );
}
