'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationDropdown() {
  const { userData } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!userData || !userData.uid) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userData.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(fetched);
    });

    return () => unsubscribe();
  }, [userData]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id, currentRead) => {
    if (currentRead) return;
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error("Error updating notification status", err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:text-white transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-black animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full right-0 mt-4 w-72 sm:w-80 bg-[#0d1117]/95 backdrop-blur-3xl border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white">Incoming Transmissions</h3>
            </div>
            
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center flex flex-col items-center">
                   <Mail className="w-6 h-6 text-white/20 mb-4" />
                   <div className="text-[10px] text-white/40 uppercase tracking-widest font-black">No Active Comms</div>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => markAsRead(notif.id, notif.read)}
                    className={`p-4 border-b border-white/5 cursor-pointer hover:bg-white/[0.03] transition-colors relative ${
                      !notif.read ? 'bg-[#0052cc]/5' : 'opacity-60 grayscale'
                    }`}
                  >
                    {!notif.read && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-full bg-[#0052cc]" />
                    )}
                    <h4 className="text-[10px] uppercase font-bold text-white mb-2 tracking-widest">
                       {notif.type || 'System Alert'}
                    </h4>
                    <p className="text-[11px] text-white/70 leading-relaxed font-medium">
                      {notif.message}
                    </p>
                    <span className="text-[8px] uppercase tracking-widest text-white/30 block mt-3 font-semibold">
                      {new Date(notif.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
