'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { db } from '@/lib/firebase';
import {
  collection, query, where, getDocs, doc, addDoc, updateDoc,
  serverTimestamp, getDoc, onSnapshot, orderBy
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Users, ClipboardList, Search, CheckCircle2, XCircle,
  Plus, ChevronRight, AlertCircle, RefreshCw, QrCode, Link as LinkIcon,
  Copy, Calendar, Clock, Layers, Filter, Eye, BarChart2, UserCheck
} from 'lucide-react';
import { SkeletonTable } from '@/components/SkeletonLoader';

function generateSessionCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VRX-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function StaffAssignPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [testsLoading, setTestsLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  // Assignment form state
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isRetake, setIsRetake] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');
  const [assignError, setAssignError] = useState('');

  const [studentSearch, setStudentSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [activeTab, setActiveTab] = useState('assign'); // assign | history

  useEffect(() => {
    if (!authLoading && (!user || (userData?.role !== 'staff' && userData?.role !== 'admin'))) {
      router.push('/login');
    }
  }, [user, userData, authLoading, router]);

  // Load published tests
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'tests'), where('createdBy', '==', user.uid));
    const unsub = onSnapshot(q, snap => {
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTestsLoading(false);
    });
    return () => unsub();
  }, [user]);

  // Load students in department
  useEffect(() => {
    if (!userData) return;
    const fetchStudents = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'student'),
          where('collegeName', '==', userData.collegeName || '')
        );
        const snap = await getDocs(q);
        setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error('Students fetch error:', e);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [userData]);

  // Load assignment history
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'assignments'),
      where('assignedBy', '==', user.uid),
      orderBy('assignedAt', 'desc')
    );
    const unsub = onSnapshot(q, snap => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAssignmentsLoading(false);
    }, err => {
      console.error('Assignments listener:', err);
      setAssignmentsLoading(false);
    });
    return () => unsub();
  }, [user]);

  const handleAssign = async () => {
    if (!selectedTest) { setAssignError('Select an assessment first.'); return; }
    if (selectedStudents.length === 0) { setAssignError('Select at least one student.'); return; }
    setAssignLoading(true);
    setAssignError('');
    setAssignSuccess('');

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const sessionCode = generateSessionCode();
      const sessionLink = `${appUrl}/exam/${selectedTest.id}`;
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(sessionLink)}`;

      // Create one assignment doc that references all selected students
      await addDoc(collection(db, 'assignments'), {
        testId: selectedTest.id,
        testTitle: selectedTest.title,
        assignedBy: user.uid,
        assignedByName: userData?.username || '',
        assignedTo: selectedStudents,
        isRetake,
        dueDate: dueDate || null,
        sessionCode,
        sessionLink,
        qrUrl,
        status: 'active',
        collegeName: userData?.collegeName || '',
        department: userData?.department || '',
        assignedAt: serverTimestamp(),
      });

      // Notify each student
      for (const studentId of selectedStudents) {
        await addDoc(collection(db, 'notifications'), {
          recipientId: studentId,
          type: isRetake ? 'retake_assigned' : 'assessment_assigned',
          title: isRetake ? 'Retake Assessment Assigned' : 'New Assessment Assigned',
          message: `"${selectedTest.title}" has been assigned to you${dueDate ? ` — due ${new Date(dueDate).toLocaleDateString()}` : ''}.`,
          link: sessionLink,
          sessionCode,
          testId: selectedTest.id,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      }

      setAssignSuccess(`Successfully assigned to ${selectedStudents.length} student(s). Session code: ${sessionCode}`);
      setSelectedStudents([]);
      setSelectedTest(null);
      setIsRetake(false);
      setDueDate('');
    } catch (err) {
      console.error('Assign error:', err);
      setAssignError('Failed to assign. Please try again.');
    } finally {
      setAssignLoading(false);
    }
  };

  const copyLink = (link, id) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(id);
      setTimeout(() => setCopySuccess(''), 2000);
    });
  };

  const filteredStudents = students.filter(s =>
    !studentSearch || s.username?.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const filteredTests = tests.filter(t =>
    !testSearch || t.title?.toLowerCase().includes(testSearch.toLowerCase())
  );

  const toggleStudent = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>;
  }

  return (
    <div className="min-h-screen bg-black flex flex-col font-inter text-white selection:bg-[#0052cc]">
      <div className="ambient-matrix-bg opacity-20" />
      <div className="flex flex-1">
        <Sidebar role="staff" />
        <main className="flex-1 ml-64 p-8 overflow-y-auto">
          {/* Header */}
          <header className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em]">Assignment Module</span>
              </div>
              <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
                <Share2 className="w-7 h-7 text-purple-400" /> Assign Assessments
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('assign')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'assign' ? 'bg-[#0052cc] text-white' : 'bg-white/[0.03] border border-white/10 text-white/50 hover:text-white'}`}
              >
                New Assignment
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-[#0052cc] text-white' : 'bg-white/[0.03] border border-white/10 text-white/50 hover:text-white'}`}
              >
                History ({assignments.length})
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'assign' ? (
              <motion.div key="assign" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="grid grid-cols-2 gap-8">
                  {/* LEFT: Test Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <ClipboardList size={13} /> Select Assessment
                      </h2>
                      {selectedTest && (
                        <span className="text-[9px] font-black text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 size={11} /> Selected
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Search assessments..."
                        value={testSearch}
                        onChange={e => setTestSearch(e.target.value)}
                        className="jira-input !pl-9 !py-2.5 !text-[11px]"
                      />
                    </div>

                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {testsLoading ? (
                        [...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white/[0.02] rounded-xl animate-pulse" />)
                      ) : filteredTests.length === 0 ? (
                        <div className="py-8 text-center text-[10px] text-white/20 uppercase tracking-widest">
                          No assessments found. <Link href="/staff/builder" className="text-[#0052cc] hover:underline">Create one</Link>
                        </div>
                      ) : filteredTests.map(test => (
                        <button
                          key={test.id}
                          onClick={() => setSelectedTest(test)}
                          className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                            selectedTest?.id === test.id
                              ? 'border-[#0052cc]/50 bg-[#0052cc]/10'
                              : 'border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selectedTest?.id === test.id ? 'bg-[#0052cc]/20 text-[#0052cc]' : 'bg-white/[0.03] text-white/30'}`}>
                            <Layers size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-black text-sm text-white truncate">{test.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[9px] text-white/30 uppercase flex items-center gap-0.5"><Clock size={8} /> {test.duration}m</span>
                              <span className="text-[9px] text-white/30">{test.questions?.length || 0} Qs</span>
                              <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase ${
                                test.status === 'published' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                              }`}>{test.status}</span>
                            </div>
                          </div>
                          {selectedTest?.id === test.id && <CheckCircle2 size={14} className="text-[#0052cc] shrink-0" />}
                        </button>
                      ))}
                    </div>

                    {/* Options */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div
                            onClick={() => setIsRetake(!isRetake)}
                            className={`w-9 h-5 rounded-full transition-all relative cursor-pointer ${isRetake ? 'bg-[#0052cc]' : 'bg-white/10'}`}
                          >
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${isRetake ? 'left-4' : 'left-0.5'}`} />
                          </div>
                          <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest">Retake Assessment</span>
                        </label>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black text-white/30 uppercase tracking-widest mb-1.5">Due Date (optional)</label>
                        <input
                          type="datetime-local"
                          value={dueDate}
                          onChange={e => setDueDate(e.target.value)}
                          className="jira-input !py-2.5 !text-[11px]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Student Selection */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
                        <Users size={13} /> Select Students
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-white/30">
                          {selectedStudents.length} selected
                        </span>
                        {selectedStudents.length > 0 && (
                          <button
                            onClick={() => setSelectedStudents([])}
                            className="text-[9px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                          >
                            Clear
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedStudents(filteredStudents.map(s => s.id))}
                          className="text-[9px] font-black text-[#0052cc] hover:text-blue-400 uppercase tracking-widest"
                        >
                          Select All
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={studentSearch}
                        onChange={e => setStudentSearch(e.target.value)}
                        className="jira-input !pl-9 !py-2.5 !text-[11px]"
                      />
                    </div>

                    <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                      {studentsLoading ? (
                        [...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/[0.02] rounded-xl animate-pulse" />)
                      ) : filteredStudents.length === 0 ? (
                        <div className="py-8 text-center text-[10px] text-white/20 uppercase tracking-widest">
                          No students in your department.
                        </div>
                      ) : filteredStudents.map(student => {
                        const isSelected = selectedStudents.includes(student.id);
                        return (
                          <button
                            key={student.id}
                            onClick={() => toggleStudent(student.id)}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                              isSelected ? 'border-[#0052cc]/40 bg-[#0052cc]/8' : 'border-white/[0.04] bg-white/[0.01] hover:border-white/10'
                            }`}
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${isSelected ? 'bg-[#0052cc] text-white' : 'bg-white/[0.05] text-white/40'}`}>
                              {student.username?.charAt(0).toUpperCase() || 'S'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black text-white truncate">{student.username || student.email?.split('@')[0]}</p>
                              <p className="text-[9px] text-white/30 truncate">{student.department || student.collegeName}</p>
                            </div>
                            {isSelected && <CheckCircle2 size={13} className="text-[#0052cc] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Assign Button */}
                <div className="mt-8 space-y-3">
                  <AnimatePresence>
                    {assignError && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-black uppercase tracking-wider">
                        <AlertCircle size={14} /> {assignError}
                      </motion.div>
                    )}
                    {assignSuccess && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-black uppercase tracking-wider">
                        <CheckCircle2 size={14} /> {assignSuccess}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    onClick={handleAssign}
                    disabled={assignLoading || !selectedTest || selectedStudents.length === 0}
                    className="w-full jira-btn-primary !py-4 flex items-center justify-center gap-3 text-[11px] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {assignLoading ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : (
                      <Share2 size={16} />
                    )}
                    {assignLoading ? 'Assigning...' : isRetake
                      ? `Assign Retake to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
                      : `Assign Assessment to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
                    }
                    <ChevronRight size={14} />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">Assignment History</h2>
                {assignmentsLoading ? (
                  <SkeletonTable rows={4} cols={5} />
                ) : assignments.length === 0 ? (
                  <div className="py-24 flex flex-col items-center text-center border border-dashed border-white/5 rounded-2xl">
                    <Share2 className="w-12 h-12 text-white/10 mb-4" />
                    <p className="text-[11px] text-white/20 uppercase tracking-widest">No assignments created yet.</p>
                  </div>
                ) : (
                  <div className="bg-[#0a0a0f] border border-white/5 rounded-2xl overflow-hidden">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 px-6 py-3 border-b border-white/5 bg-white/[0.01]">
                      {['Assessment', 'Students', 'Type', 'Session Code', 'Actions'].map(h => (
                        <span key={h} className="text-[9px] font-black uppercase tracking-widest text-white/30">{h}</span>
                      ))}
                    </div>
                    <div className="divide-y divide-white/[0.03]">
                      {assignments.map(a => (
                        <div key={a.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_100px] gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center">
                          <div>
                            <p className="font-black text-sm text-white truncate">{a.testTitle}</p>
                            <p className="text-[9px] text-white/30 mt-0.5">
                              {a.assignedAt?.toDate ? a.assignedAt.toDate().toLocaleDateString() : 'Now'}
                              {a.dueDate && ` · Due ${new Date(a.dueDate).toLocaleDateString()}`}
                            </p>
                          </div>
                          <span className="text-sm font-black text-white">{a.assignedTo?.length || 0}</span>
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border w-fit ${
                            a.isRetake ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-[#0052cc]/10 text-[#0052cc] border-[#0052cc]/20'
                          }`}>
                            {a.isRetake ? 'Retake' : 'Standard'}
                          </span>
                          <div className="font-mono text-[10px] text-white/50">{a.sessionCode}</div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyLink(a.sessionLink, a.id)}
                              className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-all text-white/40 hover:text-white"
                              title="Copy link"
                            >
                              {copySuccess === a.id ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            </button>
                            <a
                              href={a.qrUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] transition-all text-white/40 hover:text-white"
                              title="View QR"
                            >
                              <QrCode size={12} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <Footer className="ml-64" />
    </div>
  );
}
