'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  ShieldAlert, 
  KeyRound, 
  Smartphone, 
  History, 
  Building2,
  BellRing,
  Globe2,
  Save,
  Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SettingsPage() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const role = userData?.role || 'student';
  
  const [activeTab, setActiveTab] = useState('security');
  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
    if (userData) {
      setFormData(userData);
    }
  }, [user, userData, authLoading, router]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, formData);
      setMessage('Identity Vector Updated Successfully.');
      // Refresh local storage if needed
      localStorage.setItem('veraxon_user', JSON.stringify({ ...formData, uid: user.uid }));
    } catch (err) {
      console.error(err);
      setMessage('Error updating identity: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'security', label: 'Security & Access', icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'identity', label: 'Core Identity', icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'sessions', label: 'Session Management', icon: <History className="w-4 h-4" /> },
    { id: 'notifications', label: 'Alert Preferences', icon: <BellRing className="w-4 h-4" /> }
  ];

  if (role === 'staff' || role === 'admin') {
    tabs.push({ id: 'organization', label: 'Organization Data', icon: <Building2 className="w-4 h-4" /> });
  }

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center text-accentBlue animate-pulse font-black uppercase tracking-widest leading-none">Syncing Neural Core...</div>;

  return (
    <div className="min-h-screen bg-black flex font-inter text-white">
      <div className="ambient-matrix-bg" />
      <Sidebar role={role} />

      <main className="flex-1 ml-64 p-12">
         <div className="max-w-5xl mx-auto space-y-12">
            <header>
               <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white flex items-center gap-4">
                 Global Settings
                 <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
               </h1>
               <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-3">
                 System Configurations & Access Control
               </p>
            </header>

            {message && (
              <div className={`p-4 rounded-xl border ${message.includes('Error') ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'} text-[10px] font-black uppercase tracking-widest animate-fade-in`}>
                {message}
              </div>
            )}

            <div className="flex gap-12">
               {/* Left Navigation */}
               <aside className="w-64 space-y-2">
                 {tabs.map((tab) => (
                   <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id)}
                     className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all ${
                       activeTab === tab.id 
                         ? 'bg-white/5 border border-white/10 text-[#0052cc] shadow-lg'
                         : 'text-white/40 hover:text-white/80 hover:bg-white/[0.02]'
                     }`}
                   >
                     <div className={activeTab === tab.id ? 'text-[#0052cc]' : ''}>
                       {tab.icon}
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-white' : ''}`}>{tab.label}</span>
                   </button>
                 ))}
               </aside>

               {/* Configuration Area */}
               <div className="flex-1">
                 <AnimatePresence mode="wait">
                    
                    {activeTab === 'security' && (
                      <motion.div 
                        key="security"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                         {/* Password Section */}
                         <div className="glass-card rounded-2xl p-8 border border-white/5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                              <KeyRound className="w-32 h-32" />
                            </div>
                            <h2 className="text-xl font-black uppercase italic tracking-tight mb-2">Authentication Credentials</h2>
                            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-8">Change password encrypted via Argon2 hashes.</p>
                            
                            <div className="space-y-4 max-w-sm relative z-10">
                              <input type="password" placeholder="Current Password" className="jira-input !bg-black/50" />
                              <input type="password" placeholder="New Password" className="jira-input !bg-black/50" />
                              <button className="jira-btn-primary w-full mt-4">Update Cipher</button>
                            </div>
                         </div>

                         {/* 2FA Section */}
                         <div className="glass-card rounded-2xl p-8 border border-white/5 relative overflow-hidden">
                            <h2 className="text-xl font-black uppercase italic tracking-tight mb-2 flex items-center gap-3">
                              Two-Factor Authentication
                              <span className="px-2 py-1 rounded bg-red-500/10 text-red-500 text-[10px] tracking-widest font-bold border border-red-500/20">DISABLED</span>
                            </h2>
                            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-8">Secure your account with an OTP generator app.</p>
                            
                            <div className="flex items-center gap-6 z-10 relative">
                              <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center">
                                 <Smartphone className="w-10 h-10 text-white/20" />
                              </div>
                              <div>
                                 <button className="jira-btn-primary !px-8">Enable 2FA Wrapper</button>
                                 <p className="text-[9px] text-white/30 uppercase mt-4 tracking-widest max-w-xs leading-relaxed">
                                   Enabling Two-Factor limits the risk of breach by requiring physical confirmation logic during sign-on.
                                 </p>
                              </div>
                            </div>
                         </div>
                      </motion.div>
                    )}

                    {activeTab === 'identity' && (
                       <motion.div 
                        key="identity"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                         <div className="glass-card rounded-2xl p-8 border border-white/5">
                            <h2 className="text-xl font-black uppercase italic tracking-tight mb-2 text-[#0052cc]">Identity Vector</h2>
                            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-8">Update core metrics.</p>

                            <form onSubmit={handleSave} className="space-y-6">
                               <div className="grid grid-cols-2 gap-8">
                                 <div>
                                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Name</label>
                                   <input type="text" name="name" value={formData.name || ''} onChange={handleChange} className="jira-input !bg-black/50" />
                                 </div>
                                 <div>
                                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Email (Immutable)</label>
                                   <input type="email" name="email" value={formData.email || ''} disabled className="jira-input !bg-black/50 opacity-50 cursor-not-allowed" />
                                 </div>
                                 
                                 {role === 'staff' ? (
                                   <>
                                     <div>
                                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Staff ID</label>
                                       <input type="text" name="staffId" value={formData.staffId || ''} onChange={handleChange} className="jira-input !bg-black/50" />
                                     </div>
                                     <div>
                                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Subject Core</label>
                                       <input type="text" name="subjectHandling" value={formData.subjectHandling || ''} onChange={handleChange} className="jira-input !bg-black/50" />
                                     </div>
                                   </>
                                 ) : (
                                   <>
                                     <div>
                                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Register Number</label>
                                       <input type="text" name="registerNumber" value={formData.registerNumber || ''} onChange={handleChange} className="jira-input !bg-black/50" />
                                     </div>
                                     <div>
                                       <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Current Year</label>
                                       <input type="text" name="year" value={formData.year || ''} onChange={handleChange} className="jira-input !bg-black/50" />
                                     </div>
                                   </>
                                 )}
                               </div>
                               
                               <button 
                                 type="submit" 
                                 disabled={saving}
                                 className="jira-btn-primary flex items-center gap-2 mt-4"
                               >
                                 <Save className="w-4 h-4" />
                                 {saving ? 'UPDATING...' : 'APPLY CONFIGURATION'}
                               </button>
                            </form>
                         </div>
                       </motion.div>
                    )}

                    {activeTab === 'sessions' && (
                      <motion.div 
                        key="sessions"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                         <h2 className="text-xl font-black uppercase italic tracking-tight mb-6">Active Sessions</h2>
                         
                         <div className="space-y-4">
                           <div className="glass-card rounded-xl p-6 border border-white/5 flex items-center justify-between border-l-4 border-l-emerald-500">
                              <div className="flex items-center gap-6">
                                <Globe2 className="w-8 h-8 text-emerald-500" />
                                <div>
                                  <h4 className="text-sm font-black uppercase text-white/90">Windows (Current Session)</h4>
                                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">IP: 192.168.1.45 • Last active: Just now</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-black tracking-widest uppercase text-emerald-500 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">Primary Node</span>
                           </div>

                           <div className="glass-card rounded-xl p-6 border border-white/5 flex items-center justify-between opacity-70">
                              <div className="flex items-center gap-6">
                                <Smartphone className="w-8 h-8 text-white/40" />
                                <div>
                                  <h4 className="text-sm font-black uppercase text-white/90">Safari • iOS</h4>
                                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">IP: 172.16.0.2 • Last active: 2 hours ago</p>
                                </div>
                              </div>
                              <button className="text-[10px] font-black tracking-widest uppercase text-red-500 hover:bg-red-500/10 px-4 py-2 rounded transition-colors border border-transparent hover:border-red-500/20">
                                Terminate
                              </button>
                           </div>
                         </div>
                      </motion.div>
                    )}

                    {activeTab === 'organization' && (role === 'staff' || role === 'admin') && (
                      <motion.div 
                        key="organization"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-8"
                      >
                         <div className="glass-card rounded-2xl p-8 border border-white/5 border-t-[3px] border-t-purple-500">
                            <h2 className="text-xl font-black uppercase italic tracking-tight mb-2 text-purple-400">Institutional Configurations</h2>
                            <p className="text-[11px] text-white/40 uppercase tracking-widest mb-8">Modify college details, academic years, and global permissions.</p>

                            <form onSubmit={handleSave}>
                              <div className="grid grid-cols-2 gap-8">
                                 <div>
                                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Institution Name</label>
                                   <input type="text" name="collegeName" value={formData.collegeName || 'Veraxon Engineering Hub'} onChange={handleChange} className="jira-input !bg-black/50" />
                                 </div>
                                 <div>
                                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Department</label>
                                   <input type="text" name="department" value={formData.department || 'Computer Science'} onChange={handleChange} className="jira-input !bg-black/50" />
                                 </div>
                                 <div>
                                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">Default Minimum Passing Threshold (%)</label>
                                   <input type="number" defaultValue={40} className="jira-input !bg-black/50" />
                                 </div>
                                 <div>
                                   <label className="text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-2 block">AI Strictness Policy</label>
                                   <select className="jira-input !bg-black/50 appearance-none cursor-pointer">
                                     <option className="bg-black text-white">High Strictness (Zero Tolerance)</option>
                                     <option className="bg-black text-white" defaultValue>Moderate (2 Warnings)</option>
                                     <option className="bg-black text-white">Low (Audit Only)</option>
                                   </select>
                                 </div>
                              </div>

                              <button type="submit" className="jira-btn-primary mt-8 flex items-center gap-2">
                                <Save className="w-4 h-4" /> 
                                Apply Organizational Changes
                              </button>
                            </form>
                         </div>
                      </motion.div>
                    )}
                 </AnimatePresence>
               </div>
            </div>
         </div>
      </main>
    </div>
  );
}
