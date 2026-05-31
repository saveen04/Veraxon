'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState({ name: 'Staff Member', role: 'admin', email: 'staff@veraxon.com' });
  const [stats, setStats] = useState({ candidates: 0, assessments: 0, integrity: 99.9, gateway: 'Online' });
  const [activities, setActivities] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sidebar state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Search and filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExamFilter, setSelectedExamFilter] = useState('All');

  // Create exam modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [examForm, setExamForm] = useState({
    title: '',
    duration: 30,
    questions: [
      { text: '', options: ['', ''], correctAnswer: 0, marks: 1 }
    ]
  });

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (user?.department) params.append('department', user.department);
      if (user?.collegeName) params.append('collegeName', user.collegeName);

      const res = await fetch(`/api/stats?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setStats({
          candidates: data.candidatesCount || 0,
          assessments: data.examsCount || 0,
          integrity: data.integrityScore || 99.9,
          gateway: 'Online'
        });
        setActivities(data.recentActivity || []);
        setAttempts(data.attempts || []);
      }
    } catch (e) {
      console.error('Failed to load admin stats:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Get user details from localStorage
    try {
      const storedUser = localStorage.getItem('veraxon_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Load statistics
    loadAdminData();
  }, []);

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('veraxon_user');
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Add question to builder
  const handleAddQuestion = () => {
    setExamForm({
      ...examForm,
      questions: [
        ...examForm.questions,
        { text: '', options: ['', ''], correctAnswer: 0, marks: 1 }
      ]
    });
  };

  // Remove question from builder
  const handleRemoveQuestion = (idx) => {
    if (examForm.questions.length === 1) return;
    const updated = examForm.questions.filter((_, qIdx) => qIdx !== idx);
    setExamForm({ ...examForm, questions: updated });
  };

  // Update question field
  const handleQuestionChange = (qIdx, field, value) => {
    const updatedQuestions = [...examForm.questions];
    updatedQuestions[qIdx][field] = value;
    setExamForm({ ...examForm, questions: updatedQuestions });
  };

  // Update option string
  const handleOptionChange = (qIdx, optIdx, value) => {
    const updatedQuestions = [...examForm.questions];
    updatedQuestions[qIdx].options[optIdx] = value;
    setExamForm({ ...examForm, questions: updatedQuestions });
  };

  // Add option field to a question
  const handleAddOption = (qIdx) => {
    const updatedQuestions = [...examForm.questions];
    if (updatedQuestions[qIdx].options.length >= 4) return; // cap at 4 choices
    updatedQuestions[qIdx].options.push('');
    setExamForm({ ...examForm, questions: updatedQuestions });
  };

  // Remove option from a question
  const handleRemoveOption = (qIdx, optIdx) => {
    const updatedQuestions = [...examForm.questions];
    if (updatedQuestions[qIdx].options.length <= 2) return; // minimum 2 choices
    updatedQuestions[qIdx].options = updatedQuestions[qIdx].options.filter((_, idx) => idx !== optIdx);
    // Adjust correct answer if out of bounds
    if (updatedQuestions[qIdx].correctAnswer >= updatedQuestions[qIdx].options.length) {
      updatedQuestions[qIdx].correctAnswer = 0;
    }
    setExamForm({ ...examForm, questions: updatedQuestions });
  };

  // Submit new Exam
  const handleCreateExamSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/exam/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examForm.title,
          duration: examForm.duration,
          questions: examForm.questions,
          createdBy: user.id || user._id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowCreateModal(false);
        // Reset form
        setExamForm({
          title: '',
          duration: 30,
          questions: [{ text: '', options: ['', ''], correctAnswer: 0, marks: 1 }]
        });
        // Reload dashboard aggregates
        loadAdminData();
      } else {
        alert(data.error || 'Failed to create exam assessment.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred during exam creation.');
    }
  };

  // Dynamic search/filter
  const filteredAttempts = attempts.filter(att => {
    const matchesSearch = att.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.studentEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      att.examTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedExamFilter === 'All' || att.examTitle === selectedExamFilter;
    return matchesSearch && matchesFilter;
  });

  // Extract unique exams for filtering dropdown
  const uniqueExams = Array.from(new Set(attempts.map(a => a.examTitle)));

  // Kanban columns data segregation
  const activeCandidates = filteredAttempts.filter(a => a.status === 'started' && a.violationCount === 0);
  const flaggedCandidates = filteredAttempts.filter(a => a.violationCount > 0);
  const completedCandidates = filteredAttempts.filter(a => a.status === 'submitted' && a.violationCount === 0);

  return (
    <div className="relative min-h-screen bg-[#0d1117] text-[#c9d1d9] flex font-sans selection:bg-[#0052cc] selection:text-white">

      {/* 1. Left Sidebar (Matches classic collapsible JIRA style) */}
      <aside className={`${sidebarCollapsed ? 'w-20' : 'w-64'} border-r border-[#21262d] bg-[#161a22] flex flex-col justify-between p-4 shrink-0 transition-all duration-300 relative z-20`}>
        <div className="space-y-6">

          {/* Logo Header & Brand Name */}
          <div className="flex items-center justify-between px-2 py-1">
            <Link href="/" className="flex items-center gap-2 group">
              <img
                src="/logov-removebg-preview.png"
                alt="Veraxon Brand"
                className="w-8 h-8 object-contain transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              />
              {!sidebarCollapsed && (
                <span className="text-lg font-bold tracking-tight text-white font-sans transition-all duration-300">
                  Veraxon
                </span>
              )}
            </Link>

            {/* Sidebar toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="w-6 h-6 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-white/70 hover:text-white hover:bg-[#30363d] transition-all ml-1"
            >
              <svg
                className={`w-3.5 h-3.5 transform transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Project Navigation block */}
          <div className="pt-2">
            {!sidebarCollapsed && (
              <p className="text-[10px] font-bold text-white/30 tracking-widest uppercase mb-3 px-2 font-mono">
                JIRA Workspace
              </p>
            )}
            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium bg-[#21262d] text-white border border-[#30363d] transition-all text-left">
                <svg className="w-4.5 h-4.5 text-[#0052cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
                </svg>
                {!sidebarCollapsed && <span>Board Overview</span>}
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium text-white/60 hover:text-white hover:bg-[#21262d]/50 transition-all text-left"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {!sidebarCollapsed && <span>Deploy Exam</span>}
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium text-white/60 hover:text-white hover:bg-[#21262d]/50 transition-all text-left">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {!sidebarCollapsed && <span>Candidates</span>}
              </button>

              <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium text-white/60 hover:text-white hover:bg-[#21262d]/50 transition-all text-left">
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {!sidebarCollapsed && <span>AI Telemetry</span>}
              </button>
            </nav>
          </div>

        </div>

        {/* Sidebar Profile footer block */}
        <div className="space-y-4 pt-4 border-t border-[#21262d]">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded bg-[#0052cc] text-white flex items-center justify-center font-bold text-sm">
              {user.name.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="text-xs font-semibold truncate text-white leading-tight">{user.name}</p>
                <p className="text-[9px] text-[#8b949e] font-medium uppercase mt-0.5">Admin Workspace</p>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors uppercase pt-1 px-2"
          >
            <span className="font-extrabold text-[10px] tracking-tighter w-4 h-4 rounded-full border border-red-500/20 flex items-center justify-center mr-1">↪</span>
            {!sidebarCollapsed && "Log Out"}
          </button>
        </div>
      </aside>

      {/* 2. Main content container */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto relative">

        {/* Glow behind main content */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-[#0052cc]/5 rounded-full blur-[120px] pointer-events-none z-0" />

        {/* JIRA Global Search Header Toolbar */}
        <header className="px-8 py-4 border-b border-[#21262d] bg-[#161a22]/80 backdrop-blur-md flex flex-wrap gap-4 items-center justify-between z-10 shrink-0">

          {/* Active project header info */}
          <div className="flex items-center gap-3">
            <span className="text-white/40 text-sm">Projects</span>
            <span className="text-white/20">/</span>
            <span className="text-white font-semibold text-sm flex items-center gap-1.5">
              <span>Veraxon AI Assessment Control</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold uppercase">PROCTORING ACTIVE</span>
            </span>
          </div>

          {/* JIRA search & filters */}
          <div className="flex items-center gap-3">

            {/* Search Input */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search candidates, exams, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="jira-input w-full pl-9 text-xs"
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-white/30">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Exam filter dropdown */}
            <select
              value={selectedExamFilter}
              onChange={(e) => setSelectedExamFilter(e.target.value)}
              className="jira-input text-xs cursor-pointer py-1.5"
            >
              <option value="All" className="bg-[#161a22]">All Assessments</option>
              {uniqueExams.map((exam, idx) => (
                <option key={idx} value={exam} className="bg-[#161a22]">{exam}</option>
              ))}
            </select>

            {/* Action buttons */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="jira-btn-primary flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
              Deploy Exam
            </button>

            {/* Sync button */}
            <button
              onClick={loadAdminData}
              className="w-8 h-8 rounded-[3px] border border-[#30363d] bg-[#21262d] flex items-center justify-center text-white/70 hover:text-white hover:bg-[#30363d] transition-all"
              title="Reload Telemetry"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.2" />
              </svg>
            </button>
          </div>
        </header>

        {/* Admin Dashboard Area */}
        <main className="flex-grow p-8 space-y-8 z-10">

          {/* Main Title & Breadcrumb */}
          <div className="flex flex-wrap justify-between items-end gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-widest text-[#58a6ff] uppercase font-mono">
                🛡️ REAL-TIME AI TELEMETRY CONSOLE
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">
                Overview Board
              </h1>
              <p className="text-xs text-[#8b949e] mt-1">Monitor candidate behaviors, active browser focus integrity, and phone infractions.</p>
            </div>

            <div className="flex gap-2">
              <span className="px-3 py-1 rounded bg-[#161a22] border border-[#21262d] text-xs font-medium text-white/80">
                AI Server: <span className="text-emerald-400 font-bold">ONLINE</span>
              </span>
              <span className="px-3 py-1 rounded bg-[#161a22] border border-[#21262d] text-xs font-medium text-white/80">
                Random Forest classifier: <span className="text-[#0052cc] font-bold">READY</span>
              </span>
            </div>
          </div>

          {/* 3. Stat Cards Row (Formed as JIRA premium panels) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Card 1: TOTAL CANDIDATES */}
            <div className="jira-card flex flex-col gap-3 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0052cc]" />
              <div className="flex items-center justify-between text-[#8b949e]">
                <span className="text-[10px] font-bold tracking-widest uppercase">Verified Candidates</span>
                <svg className="w-4.5 h-4.5 text-[#0052cc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-3xl font-extrabold text-white leading-none">
                {stats.candidates}
              </span>
              <p className="text-[9px] text-[#8b949e]">Total registered student profiles</p>
            </div>

            {/* Card 2: ASSESSMENTS DEPLOYED */}
            <div className="jira-card flex flex-col gap-3 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#8c40f5]" />
              <div className="flex items-center justify-between text-[#8b949e]">
                <span className="text-[10px] font-bold tracking-widest uppercase">Active Assessments</span>
                <svg className="w-4.5 h-4.5 text-[#8c40f5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-3xl font-extrabold text-white leading-none">
                {stats.assessments}
              </span>
              <p className="text-[9px] text-[#8b949e]">Exams available for execution</p>
            </div>

            {/* Card 3: CORE INTEGRITY SCORE */}
            <div className="jira-card flex flex-col gap-3 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <div className="flex items-center justify-between text-[#8b949e]">
                <span className="text-[10px] font-bold tracking-widest uppercase">Telemetry Integrity</span>
                <svg className="w-4.5 h-4.5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <span className="text-3xl font-extrabold text-white leading-none">
                {stats.integrity}%
              </span>
              <p className="text-[9px] text-[#8b949e]">Overall secure assessment sessions</p>
            </div>

            {/* Card 4: ACTIVE ATTEMPTS */}
            <div className="jira-card flex flex-col gap-3 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <div className="flex items-center justify-between text-[#8b949e]">
                <span className="text-[10px] font-bold tracking-widest uppercase">Attempt Sessions</span>
                <svg className="w-4.5 h-4.5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-3xl font-extrabold text-white leading-none">
                {attempts.length}
              </span>
              <p className="text-[9px] text-[#8b949e]">Registered exam sessions</p>
            </div>

          </div>

          {/* JIRA KANBAN BOARD SYSTEM FOR SUPERVISION */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-md font-bold text-white flex items-center gap-2">
                <span>Supervision Kanban Board</span>
                <span className="px-2 py-0.5 rounded-full bg-[#21262d] text-white/60 text-xs border border-[#30363d]">
                  {filteredAttempts.length} Total
                </span>
              </h2>
              <span className="text-xs text-[#8b949e] font-mono">Dynamic AI Decision Trees Proxy: Enabled</span>
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <svg className="animate-spin h-8 w-8 text-[#0052cc] mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs text-[#8b949e] mt-4 font-mono">Querying examination status...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

                {/* COLUMN 1: ACTIVE CANDIDATES (Secure Started attempts) */}
                <div className="jira-kanban-col flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <span className="text-xs font-bold text-[#58a6ff] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Active Users ({activeCandidates.length})
                    </span>
                    <span className="text-[10px] text-white/30 font-mono">SECURE</span>
                  </div>

                  <div className="flex-grow space-y-3 overflow-y-auto max-h-[500px] pr-1">
                    {activeCandidates.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#8b949e]/40 select-none">
                        No active secure candidates.
                      </div>
                    ) : (
                      activeCandidates.map((att) => (
                        <div key={att._id} className="p-4 rounded-[4px] bg-[#161a22] border border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 space-y-2 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-white leading-tight">{att.studentName}</h4>
                            <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[8px] font-bold uppercase">LIVE</span>
                          </div>
                          <p className="text-[10px] text-white/40 font-semibold truncate">{att.studentEmail}</p>
                          <p className="text-[10px] text-white/50 bg-[#0d1117] p-1.5 rounded-[3px] border border-[#21262d] font-mono mt-2">{att.examTitle}</p>

                          <div className="flex justify-between items-center pt-1 border-t border-[#21262d] mt-2">
                            <span className="text-[8px] text-[#8b949e] font-mono">Started: {new Date(att.startTime).toLocaleTimeString()}</span>
                            <span className="text-[8px] bg-[#21262d] px-1.5 py-0.5 rounded text-white/60 font-semibold">0 Flags</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 2: FLAGGED USERS (Attempts with infractions) */}
                <div className="jira-kanban-col flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <span className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      Flagged Users ({flaggedCandidates.length})
                    </span>
                    <span className="text-[10px] text-red-500/80 font-bold font-mono">SUSPICIOUS</span>
                  </div>

                  <div className="flex-grow space-y-3 overflow-y-auto max-h-[500px] pr-1">
                    {flaggedCandidates.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#8b949e]/40 select-none">
                        No flagged infractions reported.
                      </div>
                    ) : (
                      flaggedCandidates.map((att) => (
                        <div key={att._id} className="p-4 rounded-[4px] bg-[#161a22] border border-red-500/30 hover:border-red-500/70 hover:shadow-red-500/5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 space-y-2 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-white leading-tight">{att.studentName}</h4>
                            <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[8px] font-bold uppercase">FLAGGED</span>
                          </div>
                          <p className="text-[10px] text-white/40 font-semibold truncate">{att.studentEmail}</p>
                          <p className="text-[10px] text-white/50 bg-[#0d1117] p-1.5 rounded-[3px] border border-[#21262d] font-mono mt-2">{att.examTitle}</p>

                          <div className="flex justify-between items-center pt-1 border-t border-[#21262d] mt-2">
                            <span className="text-[8px] text-[#8b949e] font-mono">Status: <span className={att.status === 'started' ? 'text-amber-400' : 'text-[#8b949e]'}>{att.status}</span></span>
                            <span className="text-[9px] bg-red-500/20 text-red-400 border border-red-500/30 px-1.5 py-0.5 rounded font-bold uppercase">
                              {att.violationCount} Violations
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* COLUMN 3: COMPLETED ATTEMPTS (Submitted secure attempts) */}
                <div className="jira-kanban-col flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-[#21262d] pb-2">
                    <span className="text-xs font-bold text-[#8b949e] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-white/40" />
                      Completed Attempts ({completedCandidates.length})
                    </span>
                    <span className="text-[10px] text-white/30 font-mono">COMPLETED</span>
                  </div>

                  <div className="flex-grow space-y-3 overflow-y-auto max-h-[500px] pr-1">
                    {completedCandidates.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#8b949e]/40 select-none">
                        No secure attempts completed.
                      </div>
                    ) : (
                      completedCandidates.map((att) => (
                        <div key={att._id} className="p-4 rounded-[4px] bg-[#161a22] border border-[#30363d] hover:border-white/20 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 space-y-2 cursor-pointer">
                          <div className="flex justify-between items-start">
                            <h4 className="text-xs font-bold text-white leading-tight">{att.studentName}</h4>
                            <span className="px-1.5 py-0.5 rounded-full bg-white/10 text-white/60 text-[8px] font-bold uppercase">FINISHED</span>
                          </div>
                          <p className="text-[10px] text-white/40 font-semibold truncate">{att.studentEmail}</p>
                          <p className="text-[10px] text-white/50 bg-[#0d1117] p-1.5 rounded-[3px] border border-[#21262d] font-mono mt-2">{att.examTitle}</p>

                          <div className="flex justify-between items-center pt-1 border-t border-[#21262d] mt-2">
                            <span className="text-[8px] text-[#8b949e] font-mono">Submitted Secure</span>
                            <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase">
                              PASSED AI CHECKS
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* 4. Recent Activity Monitor Panel */}
          <div className="jira-card flex flex-col gap-6 relative">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-widest uppercase text-[#8b949e]">Recent Activity Violations Tracker</span>
              <button
                onClick={loadAdminData}
                className="text-[10px] font-bold text-[#0052cc] hover:underline uppercase tracking-wider"
              >
                Reload Feed
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex justify-center items-center">
                <svg className="animate-spin h-6 w-6 text-[#0052cc]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8b949e]/40 select-none">
                No recent activity flags.
              </div>
            ) : (
              <div className="divide-y divide-[#21262d] max-h-[350px] overflow-y-auto pr-2">
                {activities.map((act) => (
                  <div key={act._id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white">{act.studentName}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase ${act.type === 'tab_switch' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                          ⚠️ {act.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-[10px] text-[#8b949e]">Triggered in {act.examTitle}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-[#8b949e] font-mono">
                        {new Date(act.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </main>

      </div>

      {/* 5. Create Exam Sheet Overlay (Assessment Builder) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-[6px] border border-[#21262d] bg-[#161a22] p-8 shadow-2xl relative max-h-[85vh] flex flex-col transition-all duration-300">

            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
              </svg>
            </button>

            <div className="mb-6 shrink-0 border-b border-[#21262d] pb-4">
              <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                <span>Deploy New Assessment</span>
                <span className="px-1.5 py-0.5 rounded bg-[#0052cc]/20 text-[#58a6ff] text-[9px] font-bold uppercase">JIRA Form</span>
              </h3>
              <p className="text-xs text-[#8b949e] mt-1">Configure questions, MCQ choices, duration parameters and publish directly.</p>
            </div>

            {/* Form Workspace Scrollable */}
            <form onSubmit={handleCreateExamSubmit} className="flex-grow overflow-y-auto space-y-6 pr-2">

              {/* Exam Title & Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Exam Title</label>
                  <input
                    type="text"
                    required
                    value={examForm.title}
                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                    placeholder="e.g. Data Structures and Algorithms Midterm"
                    className="jira-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Duration (Minutes)</label>
                  <input
                    type="number"
                    required
                    min={5}
                    value={examForm.duration}
                    onChange={(e) => setExamForm({ ...examForm, duration: parseInt(e.target.value) })}
                    className="jira-input w-full"
                  />
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-6 pt-4 border-t border-[#21262d]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Question List:</h4>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="jira-btn-secondary text-[10px] uppercase font-bold py-1.5"
                  >
                    + Add Question
                  </button>
                </div>

                {examForm.questions.map((question, qIdx) => (
                  <div key={qIdx} className="p-5 rounded-[4px] border border-[#21262d] bg-[#0d1117] space-y-4 relative">

                    {/* Remove question index */}
                    <button
                      type="button"
                      disabled={examForm.questions.length === 1}
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="absolute top-4 right-4 text-xs font-semibold text-red-400 hover:text-red-300 disabled:opacity-20 disabled:cursor-not-allowed uppercase"
                    >
                      Remove
                    </button>

                    {/* Question Text & Marks */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-3">
                        <label className="block text-[9px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Question {qIdx + 1}</label>
                        <input
                          type="text"
                          required
                          value={question.text}
                          onChange={(e) => handleQuestionChange(qIdx, 'text', e.target.value)}
                          placeholder="Type question description..."
                          className="jira-input w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Marks weightage</label>
                        <input
                          type="number"
                          required
                          min={1}
                          value={question.marks}
                          onChange={(e) => handleQuestionChange(qIdx, 'marks', parseInt(e.target.value))}
                          className="jira-input w-full"
                        />
                      </div>
                    </div>

                    {/* MCQ Options List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[9px] font-semibold text-[#8b949e] uppercase tracking-wider">MCQ Options (Choices):</label>
                        {question.options.length < 4 && (
                          <button
                            type="button"
                            onClick={() => handleAddOption(qIdx)}
                            className="text-[9px] font-bold text-[#0052cc] hover:underline uppercase"
                          >
                            + Add Option
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {question.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex gap-2 items-center">
                            <span className="text-[10px] font-bold text-white/40">{String.fromCharCode(65 + optIdx)}</span>
                            <input
                              type="text"
                              required
                              value={opt}
                              onChange={(e) => handleOptionChange(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                              className="jira-input w-full py-1.5"
                            />
                            {question.options.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(qIdx, optIdx)}
                                className="text-white/30 hover:text-red-400"
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l18 18" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Correct Option select */}
                    <div>
                      <label className="block text-[9px] font-semibold text-[#8b949e] mb-1.5 uppercase tracking-wider">Correct Choice:</label>
                      <div className="relative w-48">
                        <select
                          value={question.correctAnswer}
                          onChange={(e) => handleQuestionChange(qIdx, 'correctAnswer', parseInt(e.target.value))}
                          className="jira-input w-full appearance-none pr-8 cursor-pointer py-1.5"
                        >
                          {question.options.map((_, idx) => (
                            <option key={idx} value={idx} className="bg-[#161a22] text-[#c9d1d9]">
                              Choice {String.fromCharCode(65 + idx)}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-white/45">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center gap-4 pt-4 border-t border-[#21262d] shrink-0">
                <button
                  type="submit"
                  className="jira-btn-primary py-2.5 px-6"
                >
                  Publish Assessment
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="jira-btn-secondary py-2.5 px-6"
                >
                  Cancel
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
