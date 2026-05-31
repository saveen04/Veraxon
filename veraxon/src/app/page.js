'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, ShieldCheck, Activity, Users } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.push('/dashboard');
      return;
    }
    const onboardingDone = localStorage.getItem('onboardingCompleted') === 'true';
    if (onboardingDone) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="relative min-h-screen w-full bg-[#030303] overflow-hidden flex flex-col font-inter selection:bg-[#0052cc] selection:text-white">
      
      {/* Advanced Background Engine */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
        
        {/* Floating Glowing Orbs */}
        <motion.div 
          animate={{ 
            x: [0, 50, -30, 0], 
            y: [0, -50, 20, 0],
            scale: [1, 1.2, 0.9, 1] 
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-[#0052cc]/10 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            x: [0, -40, 60, 0], 
            y: [0, 30, -50, 0],
            scale: [1, 0.8, 1.3, 1] 
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 right-1/4 w-[30vw] h-[30vw] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" 
        />
      </div>

      <header className="fixed top-0 left-0 right-0 z-50 px-12 py-6 flex items-center justify-between backdrop-blur-md bg-black/20 border-b border-white/5">
         <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0052cc] text-white flex items-center justify-center rounded-lg font-black italic shadow-[0_0_15px_rgba(0,82,204,0.4)]">V</div>
            <span className="text-xl font-black tracking-tighter text-white uppercase italic">Veraxon</span>
         </div>
         <nav className="flex items-center gap-10">
            <Link href="/login" className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-colors">Login</Link>
            <Link href="/login?mode=signup" className="bg-[#0052cc] text-white px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#0042a3] transition-all shadow-[0_0_20px_rgba(0,82,204,0.3)]">Get Started</Link>
         </nav>
      </header>

      <main className="relative flex-1 flex flex-col items-center justify-center px-4 pt-32 text-center z-10">
        {/* Floating Value Widgets */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
           <FloatingWidget 
             icon={<ShieldCheck className="text-emerald-500" />} 
             label="Integrity Health" 
             value="98.4%" 
             style={{ top: '25%', left: '15%' }}
             delay={0}
             mousePos={mousePos}
           />
           <FloatingWidget 
             icon={<Users className="text-[#0052cc]" />} 
             label="Active Nodes" 
             value="1.2K+" 
             style={{ bottom: '30%', right: '15%' }}
             delay={1}
             mousePos={mousePos}
           />
           <FloatingWidget 
             icon={<Zap className="text-amber-500" />} 
             label="Response Time" 
             value="120ms" 
             style={{ top: '65%', left: '20%' }}
             delay={2}
             mousePos={mousePos}
           />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center relative"
          style={{ x: mousePos.x * 0.5, y: mousePos.y * 0.5 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/5 bg-[#0d1117]/80 backdrop-blur-xl mb-12 shadow-2xl">
             <div className="w-4 h-4 rounded bg-[#0052cc]/20 flex items-center justify-center">
                <div className="w-2 h-2 bg-[#0052cc] rounded-[2px]" />
             </div>
             <span className="text-[9px] font-black tracking-[0.3em] text-[#0052cc] uppercase">AI-Driven Academic Integrity</span>
          </div>

          <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-white leading-[0.85] mb-12 select-none uppercase italic">
            The Gold <br /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/20">Standard</span>
          </h1>

          <p className="max-w-xl text-[10px] sm:text-[12px] text-white/40 leading-relaxed font-bold mb-16 tracking-[0.3em] uppercase italic">
            Empower your institution with real-time AI surveillance, behavior <br /> analysis, and robust anti-cheating protocols designed for the modern <br /> era.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/login?mode=signup"
              className="bg-[#0052cc] text-white px-12 py-5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_40px_rgba(0,82,204,0.4)] relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              Get Started Now <ChevronRight size={14} />
            </Link>
            <button
               className="bg-[#161b22]/50 backdrop-blur-xl text-white px-12 py-5 rounded-xl text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border border-white/5 hover:bg-[#1c2128] transition-all"
            >
              View Live Demo
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="px-12 py-8 flex items-center justify-between border-t border-white/5 relative z-10 bg-black/40 backdrop-blur-sm">
         <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em]">© 2026 Veraxon Neural Systems. All protocols secured.</div>
         <div className="flex items-center gap-8">
            <Link href="#" className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-[#0052cc] transition-colors">Privacy</Link>
            <Link href="#" className="text-[9px] font-black text-white/20 uppercase tracking-[0.4em] hover:text-[#0052cc] transition-colors">Terms</Link>
         </div>
      </footer>

      {/* Floating Theme Toggle (Visual Only) */}
      <div className="fixed bottom-8 right-8 z-50">
         <div className="w-12 h-12 rounded-2xl bg-[#0d1117] border border-white/5 flex items-center justify-center text-white/20 shadow-2xl">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/></svg>
         </div>
      </div>
    </div>
  );
}

function FloatingWidget({ icon, label, value, style, delay, mousePos }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ 
        opacity: [0.4, 0.7, 0.4],
        y: [0, -15, 0],
        x: mousePos.x * 1.2,
        scale: 1
      }}
      transition={{ 
        opacity: { duration: 4, repeat: Infinity, delay },
        y: { duration: 6, repeat: Infinity, delay, ease: "easeInOut" },
        scale: { duration: 0.5, delay: delay * 0.2 }
      }}
      className="absolute p-5 rounded-2xl bg-[#0d1117]/40 backdrop-blur-xl border border-white/5 shadow-2xl z-0 hidden lg:flex items-center gap-4 group"
      style={style}
    >
      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 group-hover:scale-110 transition-transform">
        {React.cloneElement(icon, { size: 18 })}
      </div>
      <div className="text-left">
        <div className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">{label}</div>
        <div className="text-sm font-black text-white italic tracking-tighter">{value}</div>
      </div>
    </motion.div>
  );
}
