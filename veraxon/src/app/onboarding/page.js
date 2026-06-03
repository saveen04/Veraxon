"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { LogOut, GraduationCap, BookOpen, User, Phone, Building2, Layers } from "lucide-react";
import { VeraxonLogo, VeraxonFooter } from "@/lib/brand";

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
  "Vivekananda College of Engineering for Women",
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
  "Fashion Technology",
];

const STAFF_PROFESSIONS = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Lecturer",
  "Head of Department (HoD)",
  "Dean",
  "Lab Instructor",
  "Technical Staff",
  "Visiting Faculty",
  "Research Scholar",
];

const ACADEMIC_YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [formData, setFormData] = useState({
    username: "",
    mobileNumber: "",
    collegeName: "",
    department: "",
    // Student-specific
    registerNumber: "",
    academicYear: "",
    // Staff-specific
    staffId: "",
    profession: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showCollegeSuggestions, setShowCollegeSuggestions] = useState(false);
  const [showDeptSuggestions, setShowDeptSuggestions] = useState(false);

  const collegeRef = useRef(null);
  const deptRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (
          userData.profileCompleted ||
          (userData.collegeName && userData.department)
        ) {
          if (!userData.profileCompleted) {
            await updateDoc(doc(db, "users", currentUser.uid), {
              profileCompleted: true,
            });
            document.cookie = `profileCompleted=true; path=/; max-age=3600; SameSite=Strict`;
            document.cookie = `userRole=${userData.role}; path=/; max-age=3600; SameSite=Strict`;
          }
          router.push(
            userData.role === "staff" ? "/staff/dashboard" : "/student/dashboard"
          );
        } else {
          setUserRole(userData.role);
          setFormData((prev) => ({
            ...prev,
            username: userData.username || currentUser.displayName || "",
            collegeName: userData.collegeName || "",
            department: userData.department || "",
          }));
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (collegeRef.current && !collegeRef.current.contains(event.target))
        setShowCollegeSuggestions(false);
      if (deptRef.current && !deptRef.current.contains(event.target))
        setShowDeptSuggestions(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "collegeName") setShowCollegeSuggestions(true);
    if (e.target.name === "department") setShowDeptSuggestions(true);
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
    setError("");

    try {
      const updateData = {
        username: formData.username,
        mobileNumber: formData.mobileNumber,
        collegeName: formData.collegeName,
        department: formData.department,
        // Store Google profile photo if available and not already stored
        photoURL: user.photoURL || null,
        profileCompleted: true,
      };

      if (userRole === "student") {
        updateData.registerNumber = formData.registerNumber;
        updateData.academicYear = formData.academicYear;
      } else {
        // Staff: staffId + profession
        updateData.staffId = formData.staffId;
        updateData.profession = formData.profession;
        updateData.designation = formData.profession; // keep designation field in sync
      }

      await updateDoc(doc(db, "users", user.uid), updateData);

      const minimalData = {
        uid: user.uid,
        email: user.email,
        role: userRole,
        username: formData.username,
        photoURL: user.photoURL || null,
        collegeName: formData.collegeName,
        department: formData.department,
        profileCompleted: true,
      };

      document.cookie = `profileCompleted=true; path=/; max-age=3600; SameSite=Strict`;
      document.cookie = `userRole=${userRole}; path=/; max-age=3600; SameSite=Strict`;

      try {
        localStorage.setItem("veraxon_user", JSON.stringify(minimalData));
        localStorage.setItem("onboardingCompleted", "true");
      } catch (storageErr) {
        localStorage.clear();
        localStorage.setItem("veraxon_user", JSON.stringify(minimalData));
      }

      router.push(userRole === "staff" ? "/staff/dashboard" : "/student/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (!user || (!userRole && !error))
    return (
      <div className="min-h-screen bg-black flex items-center justify-center font-inter">
        <div className="ambient-matrix-bg" />
        <div className="w-8 h-8 border-4 border-[#0052cc]/20 border-t-[#0052cc] rounded-full animate-spin" />
      </div>
    );

  const filteredColleges = TN_COLLEGES.filter((c) =>
    c.toLowerCase().includes(formData.collegeName.toLowerCase())
  );
  const filteredDepts = DEPARTMENTS.filter((d) =>
    d.toLowerCase().includes(formData.department.toLowerCase())
  );

  const isStudent = userRole === "student";

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

      <div className="mb-8 relative z-10">
        <VeraxonLogo size="XL" theme="dark" className="drop-shadow-[0_0_30px_rgba(0,82,204,0.4)] hover:scale-105 transition-transform duration-700" />
      </div>

      {/* Google Profile Preview */}
      {user?.photoURL && (
        <div className="relative z-10 mb-6 flex flex-col items-center gap-2">
          <img
            src={user.photoURL}
            alt={user.displayName || "Profile"}
            className="w-16 h-16 rounded-2xl border-2 border-[#0052cc]/40 object-cover shadow-[0_0_20px_rgba(0,82,204,0.3)]"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
            {user.displayName || user.email}
          </span>
        </div>
      )}

      <div className="w-full max-w-xl relative z-10">
        <div className="jira-premium-card !p-8">
          <div className="text-center mb-8">
            {/* Role badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-5 text-[9px] font-black uppercase tracking-widest ${
              isStudent
                ? "bg-[#0052cc]/10 border-[#0052cc]/30 text-[#0052cc]"
                : "bg-purple-500/10 border-purple-500/30 text-purple-400"
            }`}>
              {isStudent ? <GraduationCap size={12} /> : <BookOpen size={12} />}
              {isStudent ? "Student" : "Staff"} Profile Setup
            </div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-[0.2em] mb-3">
              Initialize {isStudent ? "Candidate" : "Examiner"} Node
            </h2>
            <div className="w-12 h-0.5 bg-[#0052cc] mx-auto mb-4" />
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em]">
              {isStudent
                ? "Enter your academic details to activate your portal"
                : "Enter your institutional details to access the examiner dashboard"}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Row 1: Name + Mobile */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                  <User size={9} /> Full Name
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="jira-input !py-3"
                />
              </div>
              <div>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                  <Phone size={9} /> Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobileNumber"
                  required
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  placeholder="10-digit number"
                  className="jira-input !py-3"
                />
              </div>
            </div>

            {/* Row 2: College + Department */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative" ref={collegeRef}>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                  <Building2 size={9} /> College / Institution
                </label>
                <input
                  type="text"
                  name="collegeName"
                  required
                  autoComplete="off"
                  value={formData.collegeName}
                  onChange={handleChange}
                  placeholder="Start typing..."
                  className="jira-input !py-3"
                />
                {showCollegeSuggestions && filteredColleges.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#0d1117] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                    {filteredColleges.map((college, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectCollege(college)}
                        className="w-full text-left px-5 py-3 text-[9px] font-bold text-white/60 hover:text-white hover:bg-[#0052cc]/20 transition-all uppercase tracking-widest border-b border-white/5 last:border-0"
                      >
                        {college}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={deptRef}>
                <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1 flex items-center gap-1.5">
                  <Layers size={9} /> Department
                </label>
                <input
                  type="text"
                  name="department"
                  required
                  autoComplete="off"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Start typing..."
                  className="jira-input !py-3"
                />
                {showDeptSuggestions && filteredDepts.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-[#0d1117] border border-white/10 rounded-xl max-h-48 overflow-y-auto shadow-2xl">
                    {filteredDepts.map((dept, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectDept(dept)}
                        className="w-full text-left px-5 py-3 text-[9px] font-bold text-white/60 hover:text-white hover:bg-[#0052cc]/20 transition-all uppercase tracking-widest border-b border-white/5 last:border-0"
                      >
                        {dept}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Role-specific section */}
            <div className={`p-5 rounded-xl border shadow-inner ${
              isStudent
                ? "bg-[#0052cc]/5 border-[#0052cc]/20"
                : "bg-purple-500/5 border-purple-500/20"
            }`}>
              <span className={`block text-[8px] font-black uppercase tracking-widest mb-4 ${
                isStudent ? "text-[#0052cc]" : "text-purple-400"
              }`}>
                {isStudent ? "🎓 Student Credentials" : "🏫 Staff Credentials"}
              </span>

              {isStudent ? (
                /* STUDENT: Register Number + Academic Year */
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">
                      Student / Register Number
                    </label>
                    <input
                      type="text"
                      name="registerNumber"
                      required
                      value={formData.registerNumber}
                      onChange={handleChange}
                      placeholder="e.g. 21CSE0042"
                      className="jira-input !py-3 uppercase !tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">
                      Academic Year
                    </label>
                    <select
                      name="academicYear"
                      required
                      value={formData.academicYear}
                      onChange={handleChange}
                      className="jira-input !py-3 appearance-none cursor-pointer"
                    >
                      <option value="">Select Year</option>
                      {ACADEMIC_YEARS.map((y) => (
                        <option key={y} value={y} className="bg-black text-white">
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                /* STAFF: Staff ID + Profession */
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">
                      Staff ID
                    </label>
                    <input
                      type="text"
                      name="staffId"
                      required
                      value={formData.staffId}
                      onChange={handleChange}
                      placeholder="e.g. STF-2024-001"
                      className="jira-input !py-3 uppercase !tracking-widest"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-white/30 mb-2 uppercase tracking-[0.3em] ml-1">
                      Profession / Designation
                    </label>
                    <select
                      name="profession"
                      required
                      value={formData.profession}
                      onChange={handleChange}
                      className="jira-input !py-3 appearance-none cursor-pointer"
                    >
                      <option value="">Select Designation</option>
                      {STAFF_PROFESSIONS.map((p) => (
                        <option key={p} value={p} className="bg-black text-white">
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="jira-btn-primary w-full !py-4 mt-2 text-[11px]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
              ) : (
                `Activate ${isStudent ? "Candidate" : "Examiner"} Portal →`
              )}
            </button>
          </form>
        </div>
      </div>

      <VeraxonFooter />
    </div>
  );
}
