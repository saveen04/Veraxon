'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Type, 
  ListTodo, 
  Image as ImageIcon,
  CircleCode, 
  Plus, 
  Save, 
  Trash2, 
  Clock, 
  Layout, 
  X,
  Target,
  MinusCircle,
  Search,
  Filter,
  Eye,
  Copy,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Link as LinkIcon,
  QrCode,
  Calendar,
  Layers,
  Zap,
  Terminal,
  FileText,
  ShieldCheck,
  Grid
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AssessmentBuilder() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  
  const [assessment, setAssessment] = useState({
    title: '',
    duration: 60,
    difficulty: 'Medium',
    negativeMarking: 0,
    allowRetake: false,
    nodes: [
      { 
        id: 1, 
        type: 'mcq', 
        text: '', 
        options: ['', '', '', ''], 
        correct: [0], 
        multiSelect: false,
        difficulty: 'Easy',
        points: 1
      }
    ]
  });

  const [activeTab, setActiveTab] = useState('builder');
  const [searchTerm, setSearchTerm] = useState('');

  const addNode = (type) => {
    const newNode = {
      id: Date.now(),
      type,
      text: '',
      difficulty: 'Medium',
      points: type === 'coding' ? 10 : 1,
      options: (type === 'mcq' || type === 'matrix') ? ['', '', '', ''] : undefined,
      correct: (type === 'mcq' || type === 'matrix') ? [0] : undefined,
      keywords: type === 'text' ? [] : undefined,
      language: type === 'coding' ? 'javascript' : undefined,
      testCases: type === 'coding' ? [{ input: '', output: '', hidden: false }] : undefined,
      imageUrl: type === 'image' ? '' : undefined
    };
    setAssessment({ ...assessment, nodes: [...assessment.nodes, newNode] });
  };

  const removeNode = (id) => {
    setAssessment({
      ...assessment,
      nodes: assessment.nodes.filter(node => node.id !== id)
    });
  };

  const updateNode = (id, updates) => {
    setAssessment({
      ...assessment,
      nodes: assessment.nodes.map(node => node.id === id ? { ...node, ...updates } : node)
    });
  };

  const handlePublish = () => {
    if (!assessment.title) {
      alert("PLEASE ENTER ASSESSMENT TITLE TO INITIALIZE SYNC");
      return;
    }
    alert("ASSESSMENT PUBLISHED TO INSTITUTIONAL REGISTRY");
    router.push('/staff/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#030303] flex font-inter text-white selection:bg-[#0052cc]">
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-50" />
      
      {/* Builder Side Panel */}
      <aside className="w-80 border-r border-white/5 bg-[#0a0a0a] flex flex-col fixed left-0 top-0 h-screen z-40">
        <div className="p-8 border-b border-white/5 flex items-center gap-3">
            <div className="w-8 h-8 bg-[#0052cc] rounded flex items-center justify-center text-white">
                <Layout size={18} />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter italic">Builder</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-10">
          {/* Metadata Section */}
          <div>
            <h3 className="text-[9px] font-black uppercase text-white/40 tracking-[0.3em] mb-4">Assessment Metadata</h3>
            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="Title" 
                value={assessment.title}
                onChange={e => setAssessment({...assessment, title: e.target.value})}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-[11px] font-bold text-white focus:border-[#0052cc] outline-none"
              />
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
                <input 
                  type="number" 
                  value={assessment.duration}
                  onChange={e => setAssessment({...assessment, duration: parseInt(e.target.value) || 0})}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-[11px] font-bold text-white focus:border-[#0052cc] outline-none"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Element Addition Section */}
          <div>
            <h3 className="text-[9px] font-black uppercase text-white/40 tracking-[0.3em] mb-4">Add Elements</h3>
            <div className="space-y-2">
              <SidebarElement icon={<ListTodo size={14} />} label="MCQ Node" onClick={() => addNode('mcq')} />
              <SidebarElement icon={<Type size={14} />} label="Open Text" onClick={() => addNode('text')} />
              <SidebarElement icon={<Grid size={14} />} label="Image Matrix" onClick={() => addNode('matrix')} />
            </div>
          </div>
        </div>

        <div className="p-6">
           <button 
             onClick={handlePublish}
             className="w-full bg-[#0052cc] text-white py-4 rounded-xl text-[11px] font-black uppercase tracking-widest flex items-center justify-between px-6 hover:bg-[#0042a3] transition-all"
           >
             <span>Publish Session</span>
             <Save size={16} />
           </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 ml-80 p-20 bg-black min-h-screen">
        <div className="max-w-4xl mx-auto space-y-12">
          <AnimatePresence>
            {assessment.nodes.map((node, index) => (
              <motion.div 
                key={node.id} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="jira-card bg-[#0a0a0a] border border-white/5 !p-8 relative group"
              >
                <div className="flex items-center justify-between mb-8">
                   <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-lg bg-white/5 text-white/40 flex items-center justify-center text-[10px] font-black uppercase italic">
                         {index + 1}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">
                        {node.type === 'mcq' ? 'MCQ NODE' : node.type === 'text' ? 'TEXT NODE' : 'IMAGE MATRIX NODE'}
                      </span>
                   </div>
                   <button onClick={() => removeNode(node.id)} className="text-white/10 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                   </button>
                </div>

                <div className="space-y-8">
                  <textarea 
                    placeholder="ENTER NEURAL QUERY / QUESTION TEXT"
                    value={node.text}
                    onChange={(e) => updateNode(node.id, { text: e.target.value })}
                    className="w-full bg-transparent border-none text-2xl font-black uppercase tracking-tighter text-white placeholder:text-white/5 focus:outline-none resize-none min-h-[100px] leading-tight"
                  />

                  {(node.type === 'mcq' || node.type === 'matrix') && (
                    <div className="grid grid-cols-2 gap-x-12 gap-y-8 mt-12">
                       {node.options.map((opt, optIndex) => (
                         <div key={optIndex} className="flex items-center gap-4">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-black ${optIndex === node.correct[0] ? 'bg-[#0052cc] text-white' : 'bg-white/5 text-white/20'}`}>
                               {String.fromCharCode(65 + optIndex)}
                            </div>
                            <input 
                              type="text" 
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...node.options];
                                newOpts[optIndex] = e.target.value;
                                updateNode(node.id, { options: newOpts });
                              }}
                              placeholder={`Option ${optIndex + 1}`}
                              className="flex-1 bg-transparent border-b border-white/5 py-2 text-sm font-bold text-white/60 focus:border-white/20 outline-none transition-all"
                            />
                         </div>
                       ))}
                    </div>
                  )}

                  {node.type === 'text' && (
                    <div className="p-6 rounded-2xl border border-dashed border-white/5 bg-white/[0.01] text-center">
                       <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Candidate Text Entry Field</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Persistent Status Bar */}
      <div className="fixed bottom-8 right-8 flex items-center gap-6 px-6 py-3 rounded-2xl bg-[#0a0a0a] border border-white/5 z-50">
          <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
            <ShieldCheck size={12} className="text-[#0052cc]" /> Encryption: Active
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      </div>
    </div>
  );
}

function SidebarElement({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all text-left group"
    >
      <div className="text-white/20 group-hover:text-[#0052cc] transition-colors">{icon}</div>
      <span className="text-[10px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
