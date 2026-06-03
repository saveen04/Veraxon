'use client';

/* ─── Primitive skeleton block ───────────────────────────────── */
export function Skel({ className = '' }) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}

/* ─── Stat card skeleton ─────────────────────────────────────── */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`jira-premium-card ${className}`} aria-hidden="true">
      <div className="flex items-center gap-4 mb-4">
        <Skel className="w-11 h-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skel className="h-2.5 w-1/3" />
          <Skel className="h-2 w-1/2" />
        </div>
      </div>
      <Skel className="h-9 w-1/4 rounded-lg" />
    </div>
  );
}

/* ─── Table row skeleton ─────────────────────────────────────── */
export function SkeletonRow({ cols = 5 }) {
  return (
    <div
      className="grid gap-4 px-6 py-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      aria-hidden="true"
    >
      {Array.from({ length: cols }).map((_, i) => (
        <Skel key={i} className={`h-4 ${i === 0 ? 'w-3/4' : 'w-1/2'}`} />
      ))}
    </div>
  );
}

/* ─── Full table skeleton ────────────────────────────────────── */
export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="bg-[#0a0a0f] border border-white/[0.05] rounded-2xl overflow-hidden" aria-hidden="true">
      {/* Header */}
      <div
        className="grid gap-4 px-6 py-3 border-b border-white/[0.05] bg-white/[0.01]"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <Skel key={i} className="h-2.5 w-2/3" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-white/[0.03]">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} cols={cols} />
        ))}
      </div>
    </div>
  );
}

/* ─── Full page loading spinner ─────────────────────────────── */
export function SkeletonPage() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );
}

/* ─── Dashboard skeleton (header + stats + table) ────────────── */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {/* Page header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
        <div className="space-y-2.5">
          <Skel className="h-2.5 w-24 rounded" />
          <Skel className="h-7 w-52 rounded-lg" />
          <Skel className="h-2 w-36 rounded" />
        </div>
        <Skel className="h-10 w-36 rounded-xl" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* Content table */}
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}

/* ─── Assessment list item skeleton ─────────────────────────── */
export function SkeletonListItem() {
  return (
    <div
      className="flex items-center gap-4 p-5 rounded-xl border border-white/[0.05] bg-white/[0.02]"
      aria-hidden="true"
    >
      <Skel className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skel className="h-3.5 w-1/2 rounded" />
        <Skel className="h-2.5 w-1/3 rounded" />
      </div>
      <Skel className="h-8 w-20 rounded-xl shrink-0" />
    </div>
  );
}
