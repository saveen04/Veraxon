'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { LogOut } from 'lucide-react';

const TN_COLLEGES = [
  "Anna University, Chennai",
  "IIT Madras, Chennai",
  "NIT Trichy",
  "VIT University, Vellore",
  "SRM Institute of Science and Technology, Chennai",
  "Amrita Vishwa Vidyapeetham, Coimbatore",
  "PSG College of Technology, Coimbatore",
  "Sri Krishna College of Engineering and Technology (SKCET), Coimbatore",
  "Sri Krishna College of Technology (SKCT), Coimbatore",
  "Sri Eshwar College of Engineering (SECE), Coimbatore",
  "Coimbatore Institute of Technology (CIT)",
  "GCT Coimbatore",
  "Thiagarajar College of Engineering (TCE), Madurai",
  "SSN College of Engineering, Chennai",
  "Kumaraguru College of Technology (KCT), Coimbatore",
  "Bannari Amman Institute of Technology (BIT), Sathyamangalam",
  "Kongu Engineering College, Perundurai",
  "KPR Institute of Engineering and Technology, Coimbatore",
  "St. Joseph's College of Engineering, Chennai",
  "Panimalar Engineering College, Chennai",
  "Saveetha Engineering College, Chennai",
  "Rajalakshmi Engineering College, Chennai",
  "Easwari Engineering College, Chennai",
  "Velammal Engineering College, Chennai",
  "Sona College of Technology, Salem",
  "K.S. Rangasamy College of Technology, Tiruchengode",
  "Mepco Schlenk Engineering College, Sivakasi",
  "Sri Sairam Engineering College, Chennai",
  "Government College of Engineering, Salem",
  "Vels Institute of Science, Technology & Advanced Studies",
  "Loyola-ICAM College of Engineering and Technology",
  "RMK Engineering College, Chennai",
  "RMD Engineering College, Chennai",
  "Vel Tech Rangarajan Dr. Sagunthala R&D Institute",
  "Karunya Institute of Technology and Sciences",
  "Bharath Institute of Higher Education and Research",
  "Hindustan Institute of Technology and Science",
  "Dr. Mahalingam College of Engineering and Technology",
  "Erode Sengunthar Engineering College",
  "Karpagam College of Engineering",
  "Karpagam Institute of Technology",
  "Sri Ramakrishna Engineering College",
  "Sri Ramakrishna Institute of Technology",
  "M. Kumarasamy College of Engineering",
  "Knowledge Institute of Technology",
  "PPG Institute of Technology",
  "Hindusthan College of Engineering and Technology",
  "Hindusthan Institute of Technology",
  "SNS College of Technology",
  "SNS College of Engineering",
  "Kathir College of Engineering",
  "Akshaya College of Engineering and Technology",
  "Dhirajlal Gandhi College of Technology",
  "Nandha Engineering College",
  "Velalar College of Engineering and Technology",
  "Jct College of Engineering and Technology",
  "Nehru Institute of Engineering and Technology",
  "K.S.R. College of Engineering",
  "Excel Engineering College",
  "Mahendra Engineering College",
  "Paavai Engineering College",
  "Muthayammal Engineering College",
  "Selvam College of Technology",
  "Gnanamani College of Technology",
  "Vivekananda College of Engineering for Women"
];

const DEPARTMENTS = [
  "Computer Science and Engineering",
  "Information Technology",
  "Electronics and Communication Engineering",
  "Electrical and Electronics Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Artificial Intelligence and Data Science",
  "Artificial Intelligence and Machine Learning",
  "Cyber Security",
  "Biotechnology",
  "Biomedical Engineering",
  "Automobile Engineering",
  "Mechatronics Engineering",
  "Chemical Engineering",
  "Food Technology",
  "Textile Technology",
  "Fashion Technology"
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    mobileNumber: '',
    collegeName: '',
    department: '',
    registerNumber: '',
    academicYear: '',
    staffId: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);

  const collegeRef = useRef(null);
  const deptRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.profileCompleted) {
          router.push(userData.role === 'staff' ? '/staff/dashboard' : '/student/dashboard');
        } else {
          setUserRole(userData.role);
          setFormData(prev => ({
            ...prev,
            username: userData.username || currentUser.displayName || '',
            collegeName: userData.collegeName || '',
            department: userData.department || ''
          }));
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (collegeRef.current && !collegeRef.current.contains(event.target)) setShowCollegeSuggestions(false);
      if (deptRef.current && !deptRef.current.contains(event.target)) setShowDeptSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'collegeName') setShowCollegeSuggestions(true);
    if (e.target.name === 'department') setShowDeptSuggestions(true);
  };

  const selectCollege = (college) => {
    setFormData({ ...formData, collegeName: college });
    setShowCollegeSuggestions(false);
  };

  const selectDept = (dept) => {
    setFormData({ ...formData, department: dept });
    setShowDeptSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const updateData = {
        username: formData.username,
        mobileNumber: formData.mobileNumber,
        collegeName: formData.collegeName,
        department: formData.department,
        profileCompleted: true
      };

      if (userRole === 'student') {
        updateData.registerNumber = formData.registerNumber;
        updateData.academicYear = formData.academicYear;
      } else {
        updateData.staffId = formData.staffId;
        updateData.designation = formData.designation;
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);

      // Build minimal local data first, then persist
      const minimalData = {
        uid: user.uid,
        email: user.email,
        role: userRole,
        username: formData.username,
        collegeName: formData.collegeName,
        department: formData.department,
        profileCompleted: true
      };

      // Update cookies for immediate middleware recognition
      document.cookie = `profileCompleted=true; path=/; max-age=3600; SameSite=Strict`;
      document.cookie = `userRole=${userRole}; path=/; max-age=3600; SameSite=Strict`;

      // Persist to localStorage
      try {
        localStorage.setItem('veraxon_user', JSON.stringify(minimalData));
        localStorage.setItem('onboardingCompleted', 'true');
      } catch (storageErr) {
        localStorage.clear();
        localStorage.setItem('veraxon_user', JSON.stringify(minimalData));
      }

      router.push(userRole === 'staff' ? '/staff/dashboard' : '/student/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (!user || (!userRole && !error)) return (
    <div className="min-h-screen bg-black flex items-center justify-center font-inter">
      <div className="ambient-matrix-bg" />
      <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
    </div>
  );

  const filteredColleges = TN_COLLEGES.filter(c =>
    c.toLowerCase().includes(formData.collegeName.toLowerCase())
  );
  const filteredDepts = DEPARTMENTS.filter(d =>
    d.toLowerCase().includes(formData.department.toLowerCase())
  );

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center p-6 selection:bg-[#0052cc] selection:text-white font-inter overflow-hidden py-12">
      <div className="ambient-matrix-bg" />

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="fixed top-6 right-8 z-50 flex items-center gap-2 text-[9px] font-black text-white/20 hover:text-red-500 uppercase tracking-widest transition-colors"
      >
        <LogOut size={14} />
        Sign Out
      </button>

      <div className="mb-8 relative z-10 animate-fade-in-down">
        <img src="/logov-removebg-preview.png" alt="Veraxon" className="h-20 w-auto drop-shadow-[0_0_30px_rgba(0,82,204,0.4)] hover:scale-105 transition-transform duration-700" />
      </div>

      <div className="w-full max-w-xl relative z-10">
        <div className="jira-card !p-8 border-white/5 bg-[#0a0a0a]/80 backdrop-blur-3xl shadow-2xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-white italic uppercase tracking-[0.2em] mb-3">Initialize {userRole} Node</h2>
            <div className="w-12 h-0.5 bg-[#0052cc] mx-auto mb-4" />
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">Finalize institutional parameters for SSO</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 text-center animate-pulse">
              System Breach: {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Full Name</label>
                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="jira-input !py-3 uppercase !tracking-widest" />
              </div>
              <div>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Mobile Vector</label>
                <input type="tel" name="mobileNumber" required value={formData.mobileNumber} onChange={handleChange} className="jira-input !py-3 uppercase !tracking-widest" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={collegeRef}>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Foundation (College)</label>
                <input type="text" name="collegeName" required autoComplete="off" value={formData.collegeName} onChange={handleChange} className="jira-input !py-3 uppercase !tracking-widest" />
                {showCollegeSuggestions && filteredColleges.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#0d1117] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl custom-scrollbar animate-fade-in">
                    {filteredColleges.map((college, idx) => (
                      <button key={idx} type="button" onClick={() => selectCollege(college)} className="w-full text-left px-5 py-3 text-[9px] font-bold text-white/60 hover:text-white hover:bg-[#0052cc]/20 transition-all uppercase tracking-widest border-b border-white/5 last:border-0">{college}</button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={deptRef}>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Division (Dept)</label>
                <input type="text" name="department" required autoComplete="off" value={formData.department} onChange={handleChange} className="jira-input !py-3 uppercase !tracking-widest" />
                {showDeptSuggestions && filteredDepts.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#0d1117] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl custom-scrollbar animate-fade-in">
                    {filteredDepts.map((dept, idx) => (
                      <button key={idx} type="button" onClick={() => selectDept(dept)} className="w-full text-left px-5 py-3 text-[9px] font-bold text-white/60 hover:text-white hover:bg-[#0052cc]/20 transition-all uppercase tracking-widest border-b border-white/5 last:border-0">{dept}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 shadow-inner">
              <span className="block text-[8px] font-black text-[#0052cc] uppercase tracking-widest mb-4">{userRole} Specifics</span>
              {userRole === 'student' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Register Number</label>
                    <input type="text" name="registerNumber" required value={formData.registerNumber} onChange={handleChange} className="jira-input !py-3 !tracking-widest" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Academic Year</label>
                    <input type="text" name="academicYear" required value={formData.academicYear} onChange={handleChange} placeholder="e.g. 3rd Year" className="jira-input !py-3 !tracking-widest" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Staff ID</label>
                    <input type="text" name="staffId" required value={formData.staffId} onChange={handleChange} className="jira-input !py-3 !tracking-widest" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">Designation</label>
                    <input type="text" name="designation" required value={formData.designation} onChange={handleChange} placeholder="e.g. Professor" className="jira-input !py-3 !tracking-widest" />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" disabled={loading} className="jira-btn-primary w-full !py-4 mt-2 text-[11px]">
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" /> : 'Finalize Node Sync'}
            </button>
          </form>
        </div>
      </div>

      <footer className="mt-auto py-12 flex flex-col items-center gap-6 relative z-10 w-full">
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="flex flex-col items-center gap-4">
          <img
            src="/logov-removebg-preview.png"
            alt="Veraxon"
            className="h-10 opacity-30 hover:opacity-100 transition-all duration-700"
          />
          <div className="flex gap-8 text-center">
            <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">TRUSTED NODE</span>
            <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em]">TAMIL NADU REGION</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
