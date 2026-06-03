/**
 * Veraxon Brand Configuration
 * ============================
 * Single source of truth for logos, brand name, theme config.
 * Two logos:
 *   /Logo-white.png  — used on dark backgrounds (default in this dark-theme app)
 *   /Logo-black.png  — used on light backgrounds
 *
 * NOTE: No 'use client' here — this file is imported by server components
 * (layout.js for metadata) AND client components. Keep it directive-free.
 */

export const BRAND = {
  NAME: 'Veraxon',
  TAGLINE: 'AI-Powered Assessment & Proctoring Platform',
  VERSION: 'v4.1.0',
  REGION: 'Tamil Nadu Region',
  PRIMARY: '#0052cc',
  ACCENT: '#7c3aed',
  LOGO_DARK: '/Logo-white.png',   // logo for dark backgrounds
  LOGO_LIGHT: '/Logo-black.png',  // logo for light backgrounds
  /** Convenience: main logo (dark theme default) */
  LOGO_PATH: '/Logo-white.png',
  SIZE: {
    XS: 'h-5',
    SM: 'h-7',
    MD: 'h-9',
    LG: 'h-12',
    XL: 'h-18',
  },
};

/**
 * VeraxonLogo
 * Renders the correct logo based on `theme` prop.
 * theme: 'dark' (default) → white logo | 'light' → black logo
 */
export function VeraxonLogo({ size = 'MD', theme = 'dark', className = '', style = {} }) {
  const sizeClass = BRAND.SIZE[size] || BRAND.SIZE.MD;
  const src = theme === 'light' ? BRAND.LOGO_LIGHT : BRAND.LOGO_DARK;
  return (
    <img
      src={src}
      alt={BRAND.NAME}
      className={`${sizeClass} w-auto object-contain select-none ${className}`}
      style={style}
      draggable={false}
    />
  );
}

/**
 * VeraxonWordmark — Logo + wordmark side by side
 */
export function VeraxonWordmark({ logoSize = 'SM', theme = 'dark', className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <VeraxonLogo size={logoSize} theme={theme} />
      <span className="font-black text-lg tracking-tight uppercase italic text-white/90">
        {BRAND.NAME}
      </span>
    </div>
  );
}

/**
 * VeraxonFooter — Standardised footer brand block
 */
export function VeraxonFooter({ className = '' }) {
  return (
    <footer className={`flex flex-col items-center gap-3 py-10 w-full ${className}`}>
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <VeraxonLogo size="SM" className="opacity-30 hover:opacity-90 transition-opacity duration-500" />
      <p className="text-[9px] font-bold text-white/20 uppercase tracking-[0.4em]">
        {BRAND.TAGLINE}
      </p>
      <div className="flex gap-6 flex-wrap justify-center">
        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">Trusted Node</span>
        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">{BRAND.REGION}</span>
        <span className="text-[8px] font-bold text-white/10 uppercase tracking-widest">© {new Date().getFullYear()} {BRAND.NAME}</span>
      </div>
    </footer>
  );
}
