"use client";
import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ChevronRight, Zap, ShieldCheck, Activity, Users, Eye,
  Sparkles, GitBranch, Video, Database, Award, Terminal,
  CheckCircle, Star, ArrowRight, Lock, Cpu, Globe
} from "lucide-react";

// ── Animated particle background ────────────────────────────────────────────
function ParticleField() {
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 0.5,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 10,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[#0052cc]/30"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
          animate={{ y: [0, -40, 0], opacity: [0, 0.6, 0], x: [0, Math.random() * 20 - 10, 0] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

// ── Floating glassmorphism stat widget ──────────────────────────────────────
function FloatCard({ icon, label, value, style, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, 0.85, 0.6, 0.85], y: [20, 0, -8, 0] }}
      transition={{ opacity: { duration: 5, delay, repeat: Infinity }, y: { duration: 7, delay, repeat: Infinity, ease: "easeInOut" }, delay }}
      className="absolute hidden xl:flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white/[0.04] backdrop-blur-2xl border border-white/10 shadow-2xl"
      style={style}
    >
      <div className="p-2 rounded-xl bg-white/[0.06]">{React.cloneElement(icon, { size: 16 })}</div>
      <div>
        <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-black text-white italic">{value}</p>
      </div>
    </motion.div>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, color }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl group hover:border-[#0052cc]/40 hover:shadow-[0_0_30px_rgba(0,82,204,0.1)] transition-all duration-300"
    >
      <div className={`p-3 rounded-xl inline-flex mb-5 ${color} group-hover:scale-110 transition-transform`}>{icon}</div>
      <h4 className="text-base font-black uppercase italic tracking-tight text-white mb-2">{title}</h4>
      <p className="text-xs text-white/40 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

// ── Stat display ─────────────────────────────────────────────────────────────
function StatCard({ title, value, suffix, desc }) {
  const [count, setCount] = useState(0);
  const numVal = parseFloat(value.replace(/,/g, ""));
  useEffect(() => {
    let start = 0;
    const step = numVal / 60;
    const timer = setInterval(() => {
      start += step;
      if (start >= numVal) { setCount(numVal); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 25);
    return () => clearInterval(timer);
  }, [numVal]);
  const display = numVal >= 1000 ? count.toLocaleString() : count.toFixed(numVal % 1 !== 0 ? 2 : 0);
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="p-6 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-left relative overflow-hidden group hover:border-[#0052cc]/30 transition-all"
    >
      <div className="absolute top-0 right-0 w-16 h-16 bg-[#0052cc]/5 rounded-bl-3xl" />
      <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{title}</p>
      <p className="text-4xl font-black italic tracking-tighter text-white">{display}<span className="text-[#0052cc]">{suffix}</span></p>
      <p className="text-[9px] text-white/20 uppercase tracking-widest mt-2">{desc}</p>
    </motion.div>
  );
}

// ── Educator approval card ───────────────────────────────────────────────────
function EducatorCard({ name, title, dept, institution, initials, color }) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300 }}
      className="p-8 bg-white/[0.03] border border-white/[0.08] rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] transition-all"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[60px]" />
      <div className="flex items-start gap-5 mb-5">
        <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white font-black text-xl shrink-0 shadow-lg`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-base font-black text-white truncate">{name}</h4>
            <CheckCircle size={14} className="text-emerald-400 shrink-0" />
          </div>
          <p className="text-[11px] text-[#0052cc] font-black uppercase tracking-wider">{title}</p>
          <p className="text-[10px] text-white/40 mt-0.5">{dept}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
        <Globe size={12} className="text-emerald-400 shrink-0" />
        <p className="text-[10px] font-bold text-white/50">{institution}</p>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          Verified Educator
        </span>
        <span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-[#0052cc]/10 border border-[#0052cc]/20 text-[#0052cc]">
          CSE Faculty
        </span>
      </div>
    </motion.div>
  );
}

// ── Main landing page ────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -60]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user && userData) {
      router.push(userData.role === "admin" || userData.role === "staff" ? "/staff/dashboard" : "/student/dashboard");
    }
  }, [user, userData, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#030303] overflow-x-hidden flex flex-col font-inter selection:bg-[#0052cc] selection:text-white text-white">

      {/* ── Background layers ── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_30%,#000_50%,transparent_100%)]" />
        <motion.div animate={{ x:[0,60,-30,0],y:[0,-40,30,0],scale:[1,1.1,0.9,1] }} transition={{ duration:20,repeat:Infinity,ease:"linear" }}
          className="absolute top-1/4 left-1/5 w-[55vw] h-[55vw] bg-[#0052cc]/6 rounded-full blur-[140px]" />
        <motion.div animate={{ x:[0,-50,70,0],y:[0,30,-50,0],scale:[1,0.9,1.15,1] }} transition={{ duration:25,repeat:Infinity,ease:"linear" }}
          className="absolute bottom-1/4 right-1/5 w-[45vw] h-[45vw] bg-violet-600/4 rounded-full blur-[120px]" />
        <motion.div animate={{ x:[0,30,-20,0],y:[0,-20,40,0] }} transition={{ duration:18,repeat:Infinity,ease:"easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30vw] h-[30vw] bg-cyan-500/3 rounded-full blur-[100px]" />
        <ParticleField />
      </div>

      {/* ── Sticky header ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 px-6 sm:px-12 py-4 flex items-center justify-between transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl bg-black/70 border-b border-white/[0.06] shadow-2xl" : "bg-transparent"
      }`}>
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-gradient-to-br from-[#0052cc] to-[#003d99] text-white flex items-center justify-center rounded-xl font-black text-lg italic shadow-[0_0_20px_rgba(0,82,204,0.5)] group-hover:shadow-[0_0_30px_rgba(0,82,204,0.7)] transition-all">
            V
          </div>
          <span className="text-xl font-black tracking-tighter text-white uppercase italic">Veraxon</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Security", "Analytics"].map(label => (
            <a key={label} href={`#${label.toLowerCase()}`} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-5 py-2.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-[0.15em] text-white/60 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all">
            Access Terminal
          </Link>
          <Link href="/login?mode=signup" className="relative overflow-hidden px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#0052cc] to-[#0066ff] text-[10px] font-black uppercase tracking-[0.15em] text-white shadow-[0_0_25px_rgba(0,82,204,0.5)] hover:shadow-[0_0_40px_rgba(0,82,204,0.7)] hover:scale-105 transition-all group">
            <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 skew-x-12" />
            Get Access <ChevronRight size={12} className="inline ml-1" />
          </Link>
        </div>
      </header>

      {/* ── Hero section ── */}
      <main className="relative z-10 flex-1">
        <section className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-32 pb-20 text-center max-w-7xl mx-auto" ref={heroRef}>
          <FloatCard icon={<ShieldCheck className="text-emerald-400" />} label="PROCTORING HEALTH" value="99.9% SECURE" style={{ top: "20%", left: "8%" }} delay={0} />
          <FloatCard icon={<Users className="text-[#0052cc]" />} label="ACTIVE CANDIDATES" value="15K+ ONLINE" style={{ bottom: "35%", right: "8%" }} delay={1.5} />
          <FloatCard icon={<Cpu className="text-amber-400" />} label="AI DETECTION" value="99.98% ACCURATE" style={{ top: "55%", left: "10%" }} delay={3} />

          <motion.div style={{ opacity: heroOpacity, y: heroY }} className="flex flex-col items-center max-w-5xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#0052cc]/30 bg-[#0052cc]/10 backdrop-blur-xl mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black tracking-[0.3em] text-[#0052cc] uppercase">AI-Powered Academic Integrity Platform</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.8 }}
              className="text-6xl sm:text-8xl md:text-[9rem] font-black tracking-tighter text-white leading-[0.88] mb-6 uppercase italic">
              Future Proof
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0052cc] via-[#4d94ff] to-[#0052cc] bg-[size:200%] animate-[shimmer_3s_infinite_linear]">
                Assessments
              </span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="max-w-2xl text-sm text-white/50 leading-relaxed mb-10 tracking-wide">
              Equip your institution with next-gen AI behavioral analytics, biometric proctoring, dynamic assessment workflows, and real-time integrity monitoring.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/login?mode=signup"
                className="relative overflow-hidden px-10 py-4 rounded-xl bg-gradient-to-r from-[#0052cc] to-[#0066ff] text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_40px_rgba(0,82,204,0.4)] hover:shadow-[0_0_60px_rgba(0,82,204,0.6)] hover:scale-105 transition-all group flex items-center gap-3">
                <span className="absolute inset-0 bg-white/25 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 skew-x-12" />
                Get Access <ArrowRight size={16} />
              </Link>
              <Link href="/login"
                className="px-10 py-4 rounded-xl border border-white/10 text-[12px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/25 hover:bg-white/[0.04] backdrop-blur-xl transition-all flex items-center gap-3">
                Access Terminal <ChevronRight size={14} />
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* ── Stats section ── */}
        <section className="py-20 px-4 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0052cc] mb-3">Platform Performance</p>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Trusted Globally</h2>
            </motion.div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <StatCard title="TOTAL ASSESSMENTS" value="48,290" suffix="+" desc="Deployed worldwide" />
              <StatCard title="CANDIDATES SECURED" value="2,400,000" suffix="" desc="Biometric records verified" />
              <StatCard title="AI ACCURACY" value="99.98" suffix="%" desc="Decision precision" />
              <StatCard title="PLATFORM UPTIME" value="99.99" suffix="%" desc="Service availability" />
            </div>
          </div>
        </section>

        {/* ── Features section ── */}
        <section id="features" className="py-20 px-4 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0052cc] mb-3">Core Capabilities</p>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Engineered for Integrity</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: <Eye size={22} className="text-[#0052cc]" />, title: "AI Biometric Proctoring", desc: "Detects multiple faces, missing candidates, tab switching, and mobile devices using on-device vision models.", color: "bg-[#0052cc]/10" },
                { icon: <GitBranch size={22} className="text-violet-400" />, title: "Node Assessment Builder", desc: "Create visual branching assessments. Route students dynamically based on performance.", color: "bg-violet-400/10" },
                { icon: <Sparkles size={22} className="text-amber-400" />, title: "Gemini AI Generation", desc: "Instantly generate MCQs, coding problems, rubrics, and answer keys using Google Gemini.", color: "bg-amber-400/10" },
                { icon: <Terminal size={22} className="text-rose-400" />, title: "In-Browser Code Sandbox", desc: "Isolated IDE with Node.js, Python, C++ support. Automatic plagiarism detection.", color: "bg-rose-400/10" },
                { icon: <Database size={22} className="text-emerald-400" />, title: "Real-Time Telemetry", desc: "Instant violation alerts with webcam evidence. Complete audit trail for every session.", color: "bg-emerald-400/10" },
                { icon: <Award size={22} className="text-cyan-400" />, title: "Departmental Analytics", desc: "Filter metrics by department, college, and assessment. Export CSV, Excel, and PDF reports.", color: "bg-cyan-400/10" },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                  <FeatureCard {...f} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Platform preview section ── */}
        <section id="security" className="py-20 px-4 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#0052cc] mb-3">Platform Overview</p>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter">Complete Examination Suite</h2>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="p-8 bg-gradient-to-br from-[#0a0a14] to-[#050508] border border-white/[0.06] rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[360px] hover:border-[#0052cc]/30 transition-all group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-[#0052cc]/5 rounded-bl-[100px]" />
                <div>
                  <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded border border-emerald-400/20 uppercase tracking-widest">Student Assessment HUD</span>
                  <h4 className="text-2xl font-black uppercase italic text-white mt-4 mb-3">Secure Exam Terminal</h4>
                  <p className="text-sm text-white/40 leading-relaxed">Full-screen enforcement, AI eye tracking, question timer, offline backup, and real-time proctoring throughout the session.</p>
                </div>
                <div className="bg-black/60 p-4 border border-white/5 rounded-xl font-mono text-[10px] flex items-center justify-between mt-6">
                  <div className="flex items-center gap-3"><Video size={14} className="text-emerald-400 animate-pulse" /><span className="text-white/60">Webcam Active · 1 Face Detected</span></div>
                  <span className="text-emerald-400 font-black">SECURED</span>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                className="p-8 bg-gradient-to-br from-[#0e0e18] to-[#07070c] border border-white/[0.06] rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[360px] hover:border-violet-500/30 transition-all group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/5 rounded-bl-[100px]" />
                <div>
                  <span className="text-[9px] font-black text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded border border-violet-500/20 uppercase tracking-widest">Staff Command Center</span>
                  <h4 className="text-2xl font-black uppercase italic text-white mt-4 mb-3">Proctor Control Grid</h4>
                  <p className="text-sm text-white/40 leading-relaxed">Live candidate monitoring, instant violation alerts, session QR generation, analytics reporting, and complete assessment management.</p>
                </div>
                <div className="bg-black/60 p-4 border border-white/5 rounded-xl font-mono text-[10px] flex items-center justify-between mt-6">
                  <div className="flex items-center gap-3"><Activity size={14} className="text-violet-400" /><span className="text-white/60">48 Candidates Online · 3 Flagged</span></div>
                  <span className="text-violet-400 font-black">MONITORING</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Approved By Educators section ── */}
        <section className="py-20 px-4 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <CheckCircle size={12} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-emerald-400">Institutional Validation</span>
              </div>
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">Approved by Educators</h2>
              <p className="text-sm text-white/40 mt-3 max-w-xl mx-auto">Trusted and verified by leading faculty at Sri Eshwar College of Engineering</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <EducatorCard name="Dr. Niranjani" title="Associate Professor" dept="Department of Computer Science & Engineering" institution="Sri Eshwar College of Engineering, Coimbatore" initials="NJ" color="bg-gradient-to-br from-[#0052cc] to-[#003d99]" />
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <EducatorCard name="Dr. Praveen Kumar" title="Assistant Professor" dept="Department of Computer Science & Engineering" institution="Sri Eshwar College of Engineering, Coimbatore" initials="PK" color="bg-gradient-to-br from-violet-600 to-violet-800]" />
              </motion.div>
            </div>
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="mt-10 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] max-w-4xl mx-auto text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} className="text-amber-400 fill-amber-400" />)}
              </div>
              <p className="text-sm text-white/60 italic mb-3">"Veraxon has transformed how we conduct assessments at scale. The AI proctoring is exceptionally accurate and the interface is enterprise-grade."</p>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Sri Eshwar College of Engineering — CSE Department</p>
            </motion.div>
          </div>
        </section>

        {/* ── CTA section ── */}
        <section className="py-24 px-4 border-t border-white/[0.05]">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-5xl sm:text-6xl font-black uppercase italic tracking-tighter text-white mb-6">Ready to Deploy?</h2>
              <p className="text-sm text-white/40 mb-10 max-w-xl mx-auto leading-relaxed">Join thousands of institutions using Veraxon for secure, AI-powered online examinations.</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/login?mode=signup"
                  className="relative overflow-hidden px-12 py-5 rounded-xl bg-gradient-to-r from-[#0052cc] to-[#0066ff] text-[12px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_50px_rgba(0,82,204,0.4)] hover:shadow-[0_0_70px_rgba(0,82,204,0.6)] hover:scale-105 transition-all group flex items-center gap-3">
                  <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 skew-x-12" />
                  Get Access Now <ArrowRight size={16} />
                </Link>
                <Link href="/login"
                  className="px-12 py-5 rounded-xl border border-white/10 text-[12px] font-black uppercase tracking-[0.2em] text-white/60 hover:text-white hover:border-white/25 hover:bg-white/[0.04] transition-all flex items-center gap-3">
                  Access Terminal <ChevronRight size={14} />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] bg-black/50 backdrop-blur-sm py-8 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#0052cc] rounded-lg flex items-center justify-center text-white font-black text-sm italic">V</div>
            <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">© {new Date().getFullYear()} Veraxon Neural Systems — All protocols secured.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-[#0052cc] transition-colors">Privacy</Link>
            <Link href="#" className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-[#0052cc] transition-colors">Terms</Link>
            <Link href="/env-check" className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] hover:text-[#0052cc] transition-colors">System Check</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
