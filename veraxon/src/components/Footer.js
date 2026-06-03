'use client';

import Link from 'next/link';
import { VeraxonLogo } from '@/lib/brand';
import { ShieldIcon } from '@/components/icons';

const QUICK_LINKS = [
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Use',   href: '#' },
  { label: 'System Check',   href: '/env-check' },
  { label: 'Support',        href: '#' },
];

export default function Footer({ className = '' }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`w-full border-t border-white/[0.05] bg-[#07080a]/80 backdrop-blur-md ${className}`}>
      <div className="max-w-screen-2xl mx-auto px-8 py-5">

        {/* ── Three-column layout ─────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <VeraxonLogo
              size="XS"
              theme="dark"
              className="opacity-50 hover:opacity-100 transition-opacity duration-300"
            />
            <div>
              <p className="text-[11px] font-black text-white/45 uppercase tracking-[0.3em] leading-tight">
                Veraxon Platform
              </p>
              <p className="text-[9px] font-medium text-white/20 tracking-wide mt-0.5">
                AI-Powered Assessment &amp; Proctoring
              </p>
            </div>
          </div>

          {/* Quick links — centred */}
          <nav className="flex items-center gap-5 flex-wrap justify-center" aria-label="Footer links">
            {QUICK_LINKS.map(l => (
              <Link
                key={l.label}
                href={l.href}
                className="text-[10px] font-semibold text-white/30 uppercase tracking-[0.18em] hover:text-[#0052cc] transition-colors duration-200"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Version + copyright */}
          <div className="flex flex-col items-center sm:items-end gap-1">
            <div className="flex items-center gap-1.5">
              <ShieldIcon size={11} className="text-[#0052cc]" />
              <span className="text-[9px] font-black text-white/25 uppercase tracking-widest">
                v4.1.0 · Secured
              </span>
            </div>
            <p className="text-[9px] text-white/18 tracking-wide">
              © {year} Veraxon Neural Systems · All rights reserved
            </p>
          </div>
        </div>

        {/* ── Tagline rule ────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-[8px] font-black text-white/14 uppercase tracking-[0.38em]">
            Securing the Academic Perimeter
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-white/10" />
        </div>
      </div>
    </footer>
  );
}
