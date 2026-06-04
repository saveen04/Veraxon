'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import {
  collection, query, where, orderBy, onSnapshot, deleteDoc, doc, updateDoc, serverTimestamp
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, Filter, MoreVertical, Eye, Edit3, Trash2, Copy,
  CheckCircle2, Clock, XCircle, ClipboardList, Sparkles, GitBranch,
  Grid, Type, Image as ImageIcon, CheckSquare, ToggleLeft, ListTodo,
  Link as LinkIcon, QrCode, Download, Share2, AlertTriangle,
  ChevronDown, BarChart2, Users, Calendar, TrendingUp, Layers
} from 'lucide-react';

const QUESTION_TYPE_META = {
  mcq: { label: 'MCQ', icon: <ListTodo size={12} />, color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  'multiple-select': { label: 'Multi-Select', icon: <CheckSquare size={12} />, color: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
  text: { label: 'Subjective', icon: <Type size={12} />, color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  image: { label: 'Image-Based', icon: <ImageIcon size={12} />, color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
  matrix: { label: 'Matrix Match', icon: <Grid size={12} />, color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  'true-false': { label: 'True/False', icon: <ToggleLeft size={12} />, color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
  coding: { label: 'Coding', icon: <Sparkles size={12} />, color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
};

const STATUS_META = {
  published: { label: 'Published', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30', dot: 'bg-emerald-400' },
  draft: { label: 'Draft', color: 'text-amber-400 bg-amber-400/10 border-amber-400/30', dot: 'bg-amber-400' },
  archived: { label: 'Archived', color: 'text-white/30 bg-white/5 border-white/10', dot: 'bg-white/30' },
};

export default function StaffAssessmentsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [activeMenu, setActiveMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [copySuccess, setCopySuccess] = useState(null);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0, totalQuestions: 0 });

  useEffect(() => {
    if (!authLoading && (!user || (userData?.role !== 'staff' && userData?.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, userData, authLoading, router]);

  useEffect(() => {
    if (!userData) return;
    setLoading(true);

    // Listen to tests collection (where builder publishes)
    const q = query(
      collection(db, 'tests'),
      where('createdBy', '==', user?.uid),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAssessments(data);
      setStats({
        total: data.length,
        published: data.filter((a) => a.status === 'published').length,
        drafts: data.filter((a) => a.status === 'draft').length,
        totalQuestions: data.reduce((s, a) => s + (a.questions?.length || a.questionCount || 0), 0),
      });
      setLoading(false);
    }, (err) => {
      console.error('Assessments listener error:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [userData, user]);

  const filtered = assessments.filter((a) => {
    const matchSearch = !searchQuery || a.title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || a.status === filterStatus;
    const matchType = filterType === 'all' || a.questions?.some((q) => q.type === filterType);
    return matchSearch && matchStatus && matchType;
  });

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'tests', id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleToggleStatus = async (a) => {
    const newStatus = a.status === 'published' ? 'draft' : 'published';
    try {
      await updateDoc(doc(db, 'tests', a.id), { status: newStatus, updatedAt: serverTimestamp() });
    } catch (err) {
      console.error('Status update failed:', err);
    }
    setActiveMenu(null);
  };

  const handleCopyLink = (id) => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const link = `${appUrl}/exam/${id}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(null), 2000);
    });
    setActiveMenu(null);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-inter">
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-black flex overflow-hidden font-inter text-white selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />
      <Sidebar role="staff" />
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-[#0052cc] animate-pulse" />
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">
                  Assessment Management
                </span>
              </div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-[#0052cc]" /> Assessments
              </h1>
            </div>

            <Link
              href="/staff/builder"
              className="jira-btn-primary !py-3 !px-6 flex items-center gap-2 text-[10px] hover:shadow-[0_0_20px_rgba(0,82,204,0.4)]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assessment</span>
            </Link>
          </header>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total', value: stats.total, icon: <Layers size={16} className="text-[#0052cc]" />, color: 'text-[#0052cc]' },
              { label: 'Published', value: stats.published, icon: <CheckCircle2 size={16} className="text-emerald-400" />, color: 'text-emerald-400' },
              { label: 'Drafts', value: stats.drafts, icon: <Clock size={16} className="text-amber-400" />, color: 'text-amber-400' },
              { label: 'Total Questions', value: stats.totalQuestions, icon: <BarChart2 size={16} className="text-purple-400" />, color: 'text-purple-400' },
            ].map((s) => (
              <div key={s.label} className="jira-premium-card !p-5 flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5">{s.icon}</div>
                <div>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-0.5">{s.label}</p>
                  <p className={`text-2xl font-black italic ${s.color}`}>{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filters Bar */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="jira-input !pl-10 !py-2.5 !text-[11px]"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white outline-none"
            >
              <option value="all" className="bg-black">All Status</option>
              <option value="published" className="bg-black">Published</option>
              <option value="draft" className="bg-black">Draft</option>
              <option value="archived" className="bg-black">Archived</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-white/[0.02] border border-white/10 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white outline-none"
            >
              <option value="all" className="bg-black">All Types</option>
              {Object.entries(QUESTION_TYPE_META).map(([k, v]) => (
                <option key={k} value={k} className="bg-black">{v.label}</option>
              ))}
            </select>

            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-auto">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Assessments Table */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <ClipboardList className="w-16 h-16 text-white/10 mb-6" />
              <h3 className="text-xl font-black uppercase italic text-white/20 mb-2">No Assessments Found</h3>
              <p className="text-[11px] text-white/20 uppercase tracking-widest mb-8">
                {searchQuery ? 'Try a different search term.' : 'Create your first assessment to get started.'}
              </p>
              <Link href="/staff/builder" className="jira-btn-primary !py-3 !px-6 text-[10px]">
                <Plus className="w-4 h-4 inline mr-2" /> Create Assessment
              </Link>
            </div>
          ) : (
            <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden">
              {/* Table Head */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01]">
                {['Assessment', 'Questions', 'Difficulty', 'Status', 'Created', ''].map((h) => (
                  <span key={h} className="text-[9px] font-black uppercase tracking-widest text-white/30">{h}</span>
                ))}
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-white/[0.03]">
                <AnimatePresence>
                  {filtered.map((a) => {
                    const status = STATUS_META[a.status] || STATUS_META.draft;
                    const qCount = a.questions?.length || a.questionCount || 0;
                    const types = [...new Set((a.questions || []).map((q) => q.type).filter(Boolean))];
                    const createdAt = a.createdAt?.toDate ? a.createdAt.toDate() : new Date();

                    return (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center"
                      >
                        {/* Title */}
                        <div className="min-w-0">
                          <h4 className="font-black text-sm text-white truncate mb-1">{a.title || 'Untitled'}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {types.slice(0, 3).map((t) => {
                              const meta = QUESTION_TYPE_META[t] || { label: t, color: 'text-white/40 bg-white/5 border-white/10' };
                              return (
                                <span key={t} className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${meta.color} flex items-center gap-1`}>
                                  {meta.icon} {meta.label}
                                </span>
                              );
                            })}
                            {types.length > 3 && <span className="text-[8px] text-white/30">+{types.length - 3}</span>}
                          </div>
                        </div>

                        {/* Question count */}
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-black italic text-white">{qCount}</span>
                          <span className="text-[9px] font-black text-white/30 uppercase">Qs</span>
                        </div>

                        {/* Difficulty */}
                        <div>
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded ${
                            a.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400' :
                            a.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-amber-500/10 text-amber-400'
                          }`}>
                            {a.difficulty || 'Medium'}
                          </span>
                        </div>

                        {/* Status */}
                        <div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border flex items-center gap-1.5 w-fit ${status.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                            {status.label}
                          </span>
                        </div>

                        {/* Created */}
                        <div className="text-[10px] text-white/30 font-bold">
                          {createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                        </div>

                        {/* Actions */}
                        <div className="relative flex items-center gap-2">
                          {copySuccess === a.id && (
                            <span className="text-[9px] text-emerald-400 font-black uppercase absolute -top-5 left-0">Copied!</span>
                          )}
                          <Link
                            href={`/staff/builder?id=${a.id}`}
                            className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-white/40 hover:text-white"
                            title="Edit"
                          >
                            <Edit3 size={13} />
                          </Link>
                          <button
                            onClick={() => setActiveMenu(activeMenu === a.id ? null : a.id)}
                            className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all text-white/40 hover:text-white"
                          >
                            <MoreVertical size={13} />
                          </button>

                          <AnimatePresence>
                            {activeMenu === a.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                className="absolute right-0 top-10 w-48 bg-[#0d1117] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
                              >
                                {[
                                  { icon: <Eye size={12} />, label: 'Preview', action: () => { router.push(`/exam/${a.id}`); setActiveMenu(null); } },
                                  { icon: <LinkIcon size={12} />, label: 'Copy Link', action: () => handleCopyLink(a.id) },
                                  { icon: <CheckCircle2 size={12} />, label: a.status === 'published' ? 'Unpublish' : 'Publish', action: () => handleToggleStatus(a) },
                                  { icon: <Trash2 size={12} />, label: 'Delete', action: () => { setDeleteConfirm(a); setActiveMenu(null); }, danger: true },
                                ].map((item) => (
                                  <button
                                    key={item.label}
                                    onClick={item.action}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-[11px] font-bold transition-colors ${
                                      item.danger
                                        ? 'text-red-400/70 hover:text-red-400 hover:bg-red-500/5'
                                        : 'text-white/60 hover:text-white hover:bg-white/[0.03]'
                                    }`}
                                  >
                                    {item.icon} {item.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </main>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {deleteConfirm && (
            <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card max-w-md w-full p-8 border-red-500/20 rounded-2xl text-center"
              >
                <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <h2 className="text-xl font-black uppercase italic tracking-tight text-white mb-2">Delete Assessment?</h2>
                <p className="text-xs text-white/40 uppercase tracking-widest mb-8">
                  &ldquo;{deleteConfirm.title}&rdquo; will be permanently deleted. This cannot be undone.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="flex-1 jira-btn-secondary !py-3 text-[10px] uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm.id)}
                    className="flex-1 jira-btn-danger !py-3 text-[10px] uppercase tracking-widest"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Click outside to close menus */}
        {activeMenu && (
          <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
        )}
      </div>
    </div>
  );
}
