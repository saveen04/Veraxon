'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Zap } from 'lucide-react';

export default function VirtualAssistant() {
  const { userData } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize role-based context once user data loads
  useEffect(() => {
    if (userData && messages.length === 0) {
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: `Neural Agent initialized for ${userData.role === 'staff' ? 'Staff Command' : 'Candidate Node'}. How may I assist you today, ${userData.username || 'User'}?`
        }
      ]);
    }
  }, [userData]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const queryText = inputValue.trim();

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: queryText
    };

    const currentHistory = [...messages]; // snapshot of history before pushing new user msg
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentHistory.filter(m => m.id !== 1),
          userMessage: queryText,
          userData: {
             username: userData?.username,
             role: userData?.role
          }
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const aiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: data.success ? data.text : (data.fallback ? data.text : "Unable to reach the AI backend. Please try again.")
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      console.error('V.E.R.A fetch error:', err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        text: "Neural uplink temporarily unavailable. Please retry in a moment."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const staffPrompts = ["How to create assessment?", "Monitor active violations", "Generate analytics report"];
  const studentPrompts = ["Check my schedule", "Troubleshoot camera", "When are results published?"];
  const activePrompts = userData?.role === 'staff' || userData?.role === 'admin' ? staffPrompts : studentPrompts;

  if (!userData) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans">
      
      {/* Assisant Chat Window */}
      {isOpen && (
        <div className="mb-4 w-80 sm:w-96 h-[500px] flex flex-col bg-[#0d1117]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                   <Zap className="w-6 h-6" />
                </div>
                <div className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-[#0d1117] rounded-full flex items-center justify-center border border-white/5">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                </div>
              </div>
              <div>
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-white italic">V.E.R.A</h3>
                <p className="text-[8px] font-bold text-[#0052cc] uppercase tracking-[0.4em] mt-0.5">Neural Response Unit</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[11px] leading-relaxed shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-[#0052cc] text-white rounded-br-sm' 
                    : 'bg-white/5 border border-white/5 text-white/80 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1.5 items-center">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          {messages.length < 3 && !isTyping && (
            <div className="px-4 pb-2 flex gap-2 overflow-x-auto custom-scrollbar no-scrollbar scroll-smooth">
               {activePrompts.map((prompt, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => setInputValue(prompt)}
                    className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[9px] text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    {prompt}
                  </button>
               ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 border-t border-white/10 bg-[#0a0d12]">
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Initialize query query..."
                className="w-full bg-[#161b22] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#0052cc] transition-colors"
              />
              <button 
                type="submit" 
                disabled={!inputValue.trim() || isTyping}
                className="absolute right-2 p-1.5 rounded-lg bg-[#0052cc]/10 text-[#0052cc] hover:bg-[#0052cc] hover:text-white transition-all disabled:opacity-50 disabled:hover:bg-[#0052cc]/10 disabled:hover:text-[#0052cc]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#0052cc] to-[#003d99] text-white shadow-[0_0_20px_rgba(0,82,204,0.4)] hover:shadow-[0_0_30px_rgba(0,82,204,0.6)] hover:scale-105 transition-all duration-300 flex items-center justify-center relative group"
      >
        <div className="absolute inset-0 bg-white/20 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 rounded-full" />
        {isOpen ? (
          <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
        ) : (
          <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        )}
      </button>
    </div>
  );
}
