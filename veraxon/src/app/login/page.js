"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { VeraxonLogo, VeraxonFooter } from "@/lib/brand";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  ChevronRight,
  ShieldCheck,
  Zap,
  Fingerprint,
} from "lucide-react";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { googleSignIn } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "signup") {
      setIsLogin(false);
    } else {
      setIsLogin(true);
    }
  }, [searchParams]);

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("student");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const redirectUser = async (userRole, isNewUser, userObj) => {
    try {
      // Set cookies immediately before redirect
      if (userObj) {
        const token = await userObj.getIdToken();
        document.cookie = `firebaseAuthToken=${token}; path=/; max-age=3600; SameSite=Strict`;
        document.cookie = `userRole=${userRole}; path=/; max-age=3600; SameSite=Strict`;
        document.cookie = `profileCompleted=${!isNewUser}; path=/; max-age=3600; SameSite=Strict`;
      }

      localStorage.setItem("onboardingCompleted", "true");

      if (isNewUser) {
        router.push("/onboarding");
      } else if (userRole === "admin" || userRole === "staff") {
        router.push("/staff/dashboard");
      } else {
        router.push("/student/dashboard");
      }
    } catch (error) {
      console.error("Error in redirectUser:", error);
      setError("Redirect failed. Please try again.");
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await googleSignIn(role);
      const userCredential = auth.currentUser;
      // For existing Google accounts, never redirect to onboarding
      // isNewUser=true only when brand new account created
      await redirectUser(result.role, result.isNew, userCredential);
    } catch (err) {
      setError(err.message || "Authentication via Google failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Login Flow
        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.role !== role) setRole(userData.role);
          // Existing user logging in — always go straight to their dashboard
          await redirectUser(
            userData.role,
            false, // isNewUser = false for existing accounts
            userCredential.user,
          );
        } else {
          throw new Error(
            "Institutional profile not found. Attempting manual recovery...",
          );
        }
      } else {
        // Registration Flow
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match terminal requirements.");
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password,
        );
        await updateProfile(userCredential.user, {
          displayName: formData.username,
        });

        const userData = {
          uid: userCredential.user.uid,
          email: formData.email,
          username: formData.username,
          role: role,
          profileCompleted: false,
          createdAt: serverTimestamp(),
          photoURL: null,
        };

        await setDoc(doc(db, "users", userCredential.user.uid), userData);
        // Brand new email/password account — send to onboarding
        await redirectUser(role, true, userCredential.user);
      }
    } catch (err) {
      setError(err.message || "Identity verification failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex selection:bg-[#0052cc] selection:text-white font-inter bg-black overflow-hidden">
      {/* Left Side: Neural Aesthetic (Visible only on LG+) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center overflow-hidden bg-black">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        >
          <source src="/space.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/60 z-0" />

        <div className="relative z-10 text-center px-12">
          {/* Dark bg → white logo */}
          <VeraxonLogo size="XL" theme="dark" className="mb-10 mx-auto drop-shadow-[0_0_50px_rgba(0,82,204,0.6)]" />
          <h1 className="text-8xl font-black tracking-tighter text-white uppercase italic leading-none">
            Veraxon
          </h1>
          <p className="text-[11px] font-black text-[#0052cc] uppercase tracking-[0.6em] mt-4">
            Securing the Academic Perimeter
          </p>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="w-full lg:w-1/2 min-h-screen relative flex flex-col justify-center items-center bg-black p-8">
        <div className="w-full max-w-md relative z-10">
          <div className="mb-10">
            <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
              {isLogin ? "Protocol Sync" : "Initialize Node"}
            </h2>
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">
              {isLogin
                ? "Authorize access to institutional terminal"
                : "Create new verified identity record"}
            </p>
          </div>

          {/* Role Switcher */}
          <div className="flex gap-2 p-1 bg-[#0a0a0a] border border-white/5 rounded-2xl mb-8">
            {["student", "staff"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  role === r
                    ? "bg-white text-black"
                    : "text-white/30 hover:bg-white/5"
                }`}
              >
                {r === "student" ? "Student" : "Examiner"}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-[9px] font-black uppercase tracking-[0.2em] text-red-500 border-l-4 border-l-red-500">
              {error}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">
                  Identity Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                  <input
                    type="text"
                    name="username"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Full Legal Name"
                    className="jira-input !pl-12 uppercase"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">
                Access Key (Email)
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Institutional ID"
                  className="jira-input !pl-12 uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">
                Secure Sequence
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="jira-input !pl-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em] ml-1">
                  Confirm Sequence
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className="jira-input"
                />
              </div>
            )}

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="hidden"
                />
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    rememberMe
                      ? "bg-[#0052cc] border-[#0052cc]"
                      : "border-white/10 group-hover:border-white/30"
                  }`}
                >
                  {rememberMe && (
                    <ShieldCheck size={12} className="text-white" />
                  )}
                </div>
                <span className="text-[9px] font-bold text-white/30 uppercase">
                  Persistent Link
                </span>
              </label>
              {isLogin && (
                <button
                  type="button"
                  className="text-[9px] font-bold text-[#0052cc] uppercase hover:text-white transition-colors"
                >
                  Lost Credentials?
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="jira-btn-primary w-full py-4 mt-4 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Fingerprint size={18} />
                  <span>
                    {isLogin ? "Establish Uplink" : "Activate Identity"}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="my-10 flex items-center gap-4 opacity-5">
            <div className="h-px flex-1 bg-white" />
            <span className="text-[8px] font-black text-white uppercase">
              Secondary Auth
            </span>
            <div className="h-px flex-1 bg-white" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-4 rounded-2xl border border-white/5 bg-[#0a0a0a] hover:bg-white/[0.05] text-white font-black text-[10px] tracking-[0.3em] uppercase transition-all flex items-center justify-center gap-4"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Identity Sync
          </button>

          <div className="text-center mt-12">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] hover:text-[#0052cc] transition-colors"
            >
              {isLogin ? (
                <>
                  New institutional node?{" "}
                  <span className="text-[#0052cc]">Register Unit</span>
                </>
              ) : (
                <>
                  Existing identity?{" "}
                  <span className="text-[#0052cc]">Sync Portal</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Standardized Footer */}
        <footer className="absolute bottom-8 w-full text-center">
          <div className="flex flex-col items-center gap-2 opacity-30">
            <VeraxonLogo size="XS" theme="dark" />
            <p className="text-[8px] font-black uppercase tracking-[0.4em] text-white">
              Veraxon Assessment Platform
            </p>
            <p className="text-[7px] font-bold text-white/50 uppercase tracking-widest">
              © {new Date().getFullYear()} v4.1.0 • All Rights Reserved
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white/30 text-xs tracking-widest uppercase">
          Syncing Uplink...
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
