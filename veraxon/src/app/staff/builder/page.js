"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
  Type,
  ListTodo,
  Image as ImageIcon,
  Code2,
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
  Grid,
  CheckSquare,
  UploadCloud,
  Video,
  Mic,
  ArrowRight,
  GitBranch,
  Wand2,
  Sparkles,
  RefreshCw,
  Award,
  Settings2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AssessmentBuilder() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  // Full assessment config state
  const [config, setConfig] = useState({
    startTime: "",
    endTime: "",
    passingPercent: 40,
    maxMarks: 100,
    negativeMarkingEnabled: true,
    shuffleQuestions: false,
    shuffleOptions: false,
    randomPool: false,
    randomPoolSize: 20,
    retestEnabled: false,
    retestLimit: 1,
    cooldownDays: 7,
    certificateEnabled: true,
    resultVisibility: "immediate",
    sections: [
      { id: "sec-a", name: "Section A", timer: 30, marks: 40, instructions: "Attempt all questions.", passingCriteria: 14 },
    ],
  });

  const updateConfig = (key, value) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const addSection = () =>
    setConfig((prev) => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `sec-${Date.now()}`,
          name: `Section ${String.fromCharCode(65 + prev.sections.length)}`,
          timer: 20,
          marks: 20,
          instructions: "",
          passingCriteria: 7,
        },
      ],
    }));

  const updateSection = (id, field, value) =>
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.map((s) =>
        s.id === id ? { ...s, [field]: value } : s
      ),
    }));

  const removeSection = (id) =>
    setConfig((prev) => ({
      ...prev,
      sections: prev.sections.filter((s) => s.id !== id),
    }));

  // Advanced Assessment State
  const [assessment, setAssessment] = useState({
    title: "Advanced AI and Core Systems Assessment",
    duration: 90,
    difficulty: "Hard",
    negativeMarking: 0.25,
    allowRetake: false,
    nodes: [
      {
        id: "node-1",
        type: "mcq",
        title: "Initial Screening",
        text: "What is the standard time complexity of querying a node in a balanced AVL tree?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        correct: [1],
        difficulty: "Medium",
        points: 2,
        timer: 60,
        section: "Section A",
        x: 100,
        y: 150,
        nextNodes: { default: "node-2", onCorrect: "node-2", onIncorrect: "node-3" },
      },
      {
        id: "node-2",
        type: "coding",
        title: "Algorithmic Optimization",
        text: "Implement a function to find the longest palindromic substring.",
        language: "javascript",
        starterCode: 'function longestPalindrome(s) {\n  // Write optimal logic here\n  return "";\n}',
        testCases: [
          { input: '"babad"', output: '"bab"', hidden: false },
          { input: '"cbbd"', output: '"bb"', hidden: true },
        ],
        solution: "Manachers Algorithm or expand-around-center.",
        rubric: "Correctness: 60%, Complexity: 25%, Code Cleanliness: 15%",
        difficulty: "Hard",
        points: 10,
        timer: 600,
        section: "Section A",
        x: 450,
        y: 80,
        nextNodes: { default: "node-completed" },
      },
      {
        id: "node-3",
        type: "text",
        title: "Conceptual Alignment",
        text: "Differentiate between optimistic and pessimistic locking in distributed systems.",
        suggestedKeywords: ["versioning", "concurrency", "collision", "deadlock"],
        rubric: "Excellent: Covers version checks, deadlock avoidance. Passing: Identifies locking overhead.",
        difficulty: "Medium",
        points: 5,
        timer: 180,
        section: "Section A",
        x: 450,
        y: 400,
        nextNodes: { default: "node-completed" },
      },
    ],
  });

  // Selected state for editing
  const [selectedNodeId, setSelectedId] = useState("node-1");
  const [activeTab, setActiveTab] = useState("builder"); // builder | flow | preview
  const [draggedNode, setDraggedNode] = useState(null);

  // AI Panel States
  const [aiTopic, setAiTopic] = useState("Dynamic Programming");
  const [aiNodeType, setAiNodeType] = useState("mcq");
  const [aiDifficulty, setAiDifficulty] = useState("Hard");
  const [aiLanguage, setAiLanguage] = useState("javascript");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  // New Node Form Type
  const [newNodeType, setNewNodeType] = useState("mcq");

  const selectedNode =
    assessment.nodes.find((n) => n.id === selectedNodeId) ||
    assessment.nodes[0];

  const addNode = (type) => {
    const id = `node-${Date.now()}`;
    const defaultNodeConfig = {
      id,
      type,
      title: `${type.toUpperCase()} Node`,
      text: `Enter problem statement for the new ${type} question.`,
      difficulty: "Medium",
      points: type === "coding" ? 10 : 2,
      timer: type === "coding" ? 300 : 60,
      section: "General Section",
      x: 200 + Math.random() * 100,
      y: 200 + Math.random() * 100,
      nextNodes: { default: "node-completed" },
    };

    // Populate type-specific properties
    if (type === "mcq" || type === "multiple-select") {
      defaultNodeConfig.options = [
        "Option A",
        "Option B",
        "Option C",
        "Option D",
      ];
      defaultNodeConfig.correct = [0];
    } else if (type === "coding") {
      defaultNodeConfig.language = "javascript";
      defaultNodeConfig.starterCode = "function solve() {\n  // your code\n}";
      defaultNodeConfig.testCases = [
        { input: "1", output: "2", hidden: false },
      ];
      defaultNodeConfig.rubric = "Correctness: 70%, Complexity: 30%";
      defaultNodeConfig.solution = "Correct functional logic";
    } else if (type === "text") {
      defaultNodeConfig.suggestedKeywords = ["important", "concept"];
      defaultNodeConfig.rubric = "Points allocated on description accuracy.";
    } else if (type === "matrix") {
      defaultNodeConfig.matrixLeft = ["Node A", "Node B", "Node C", "Node D"];
      defaultNodeConfig.matrixRight = [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4",
      ];
      defaultNodeConfig.matrixCorrect = { 0: 1, 1: 0, 2: 3, 3: 2 }; // Left Index -> Right Index
    } else if (type === "image") {
      defaultNodeConfig.imageUrl = "https://picsum.photos/400/200";
      defaultNodeConfig.options = [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4",
      ];
      defaultNodeConfig.correct = [0];
    } else if (type === "file-upload") {
      defaultNodeConfig.allowedTypes = [".zip", ".pdf", ".png"];
      defaultNodeConfig.maxSize = 25; // MB
      defaultNodeConfig.rubric = "Verify files structure and contents.";
    } else if (type === "video-response") {
      defaultNodeConfig.maxDuration = 120; // seconds
      defaultNodeConfig.rubric =
        "Subject clarity, posture, vocabulary, response completeness.";
    } else if (type === "audio-response") {
      defaultNodeConfig.maxDuration = 60; // seconds
      defaultNodeConfig.rubric =
        "Acoustic clarity, core definitions provided, explanation structure.";
    }

    setAssessment((prev) => ({
      ...prev,
      nodes: [...prev.nodes, defaultNodeConfig],
    }));
    setSelectedId(id);
  };

  const removeNode = (id) => {
    if (assessment.nodes.length <= 1) {
      alert(
        "At least one Question Node must remain in the assessment template.",
      );
      return;
    }
    setAssessment((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => node.id !== id),
    }));
    if (selectedNodeId === id) {
      setSelectedId(assessment.nodes.find((n) => n.id !== id).id);
    }
  };

  const updateNode = (id, updates) => {
    setAssessment((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node,
      ),
    }));
  };

  // AI Generation Trigger
  const handleAIGenerate = async () => {
    setAiLoading(true);
    setAiFeedback(null);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-question",
          type: aiNodeType,
          topic: aiTopic,
          difficulty: aiDifficulty,
          codeLanguage: aiLanguage,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const generated = resData.data;
        const id = `node-ai-${Date.now()}`;

        const aiNode = {
          id,
          type: aiNodeType,
          title: `AI: ${aiTopic} (${aiDifficulty})`,
          text: generated.text,
          difficulty: generated.difficulty || aiDifficulty,
          points: generated.points || (aiNodeType === "coding" ? 10 : 2),
          timer: aiNodeType === "coding" ? 600 : 90,
          section: "AI Generated",
          x: 200 + Math.random() * 80,
          y: 200 + Math.random() * 80,
          nextNodes: { default: "node-completed" },
        };

        if (aiNodeType === "mcq") {
          aiNode.options = generated.options;
          aiNode.correct = [generated.correctAnswer || 0];
        } else if (aiNodeType === "coding") {
          aiNode.language = aiLanguage;
          aiNode.starterCode = generated.starterCode || "";
          aiNode.testCases = generated.testCases || [];
          aiNode.rubric = generated.rubric || "";
          aiNode.solution = generated.solution || "";
        } else if (aiNodeType === "text") {
          aiNode.suggestedKeywords = generated.suggestedKeywords || [];
          aiNode.rubric =
            typeof generated.rubric === "string"
              ? generated.rubric
              : JSON.stringify(generated.rubric);
        }

        setAssessment((prev) => ({
          ...prev,
          nodes: [...prev.nodes, aiNode],
        }));
        setSelectedId(id);
        setAiFeedback(`AI generated question successfully linked and loaded.`);
      } else {
        alert("Failed to sync neural generator. Please retry.");
      }
    } catch (err) {
      console.error(err);
      alert("Error in network handshake with AI agent.");
    } finally {
      setAiLoading(false);
    }
  };

  // AI Difficulty & Rubric Analysis trigger
  const handleAIAnalyze = async (actionType) => {
    if (!selectedNode) return;
    setAiLoading(true);
    setAiFeedback(null);
    try {
      const response = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action:
            actionType === "difficulty"
              ? "analyze-difficulty"
              : "generate-rubric",
          questionText: selectedNode.text,
          difficulty: selectedNode.difficulty,
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.data) {
        const payload = resData.data;
        if (actionType === "difficulty") {
          updateNode(selectedNode.id, {
            difficulty: payload.difficulty,
            points: payload.recommendedPoints,
          });
          setAiFeedback(
            `DIFFICULTY ANALYSIS COMPLETE:\nCognitive Level: ${payload.cognitiveLevel}\nReasoning: ${payload.reasoning}`,
          );
        } else {
          updateNode(selectedNode.id, {
            rubric: payload.rubric,
            solution: payload.idealAnswer,
          });
          setAiFeedback(
            `RUBRIC CREATED:\nAnswer Key: ${payload.idealAnswer}\n\nPoints Allocation:\n${payload.pointsAllocation?.map((p) => `- ${p.criteria}: ${p.points}pts`).join("\n") || payload.rubric}`,
          );
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!assessment.title.trim()) {
      alert("Please enter an assessment title before publishing.");
      return;
    }
    if (assessment.nodes.length === 0) {
      alert("Add at least one question node before publishing.");
      return;
    }
    setPublishLoading(true);
    setPublishSuccess(null);
    try {
      const totalPoints = assessment.nodes.reduce((s, n) => s + (n.points || 0), 0);
      const docRef = await addDoc(collection(db, "tests"), {
        // Core metadata
        title: assessment.title,
        duration: assessment.duration,
        difficulty: assessment.difficulty,
        negativeMarking: assessment.negativeMarking,
        totalPoints,
        questionCount: assessment.nodes.length,
        // Questions / Nodes
        questions: assessment.nodes.map((n, i) => ({
          id: n.id,
          order: i + 1,
          type: n.type,
          title: n.title,
          text: n.text,
          section: n.section,
          difficulty: n.difficulty,
          points: n.points,
          timer: n.timer,
          // MCQ
          ...(n.options && { options: n.options, correct: n.correct }),
          // Coding
          ...(n.language && { language: n.language, starterCode: n.starterCode, testCases: n.testCases, solution: n.solution }),
          // Text
          ...(n.suggestedKeywords && { suggestedKeywords: n.suggestedKeywords }),
          rubric: n.rubric || "",
          // Matrix
          ...(n.matrixLeft && { matrixLeft: n.matrixLeft, matrixRight: n.matrixRight, matrixCorrect: n.matrixCorrect }),
          // Image
          ...(n.imageUrl && { imageUrl: n.imageUrl }),
        })),
        // Assessment Configuration
        config: {
          startTime: config.startTime || null,
          endTime: config.endTime || null,
          passingPercent: config.passingPercent,
          maxMarks: config.maxMarks,
          negativeMarkingEnabled: config.negativeMarkingEnabled,
          shuffleQuestions: config.shuffleQuestions,
          shuffleOptions: config.shuffleOptions,
          randomPool: config.randomPool,
          randomPoolSize: config.randomPoolSize,
          retestEnabled: config.retestEnabled,
          retestLimit: config.retestLimit,
          cooldownDays: config.cooldownDays,
          certificateEnabled: config.certificateEnabled,
          resultVisibility: config.resultVisibility,
        },
        sections: config.sections,
        // Creator metadata
        createdBy: user?.uid || null,
        createdByName: userData?.username || null,
        collegeName: userData?.collegeName || null,
        department: userData?.department || null,
        status: "published",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setPublishSuccess(docRef.id);
      setTimeout(() => router.push("/staff/assessments"), 2000);
    } catch (err) {
      console.error("Publish error:", err);
      alert("Failed to publish: " + err.message);
    } finally {
      setPublishLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] flex font-inter text-white selection:bg-[#0052cc]">
      <Sidebar role="staff" />

      {/* Main Builder Pane */}
      <main className="flex-1 ml-64 p-8 flex flex-col h-screen overflow-hidden">
        {/* Header HUD */}
        <header className="flex items-center justify-between shrink-0 mb-8 border-b border-white/5 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#0052cc] animate-pulse" />
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.3em]">
                Institutional Node Architect
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-white flex items-center gap-3">
              <GitBranch className="w-8 h-8 text-[#0052cc]" /> Flow Builder
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Tab selector */}
            <div className="flex p-1 bg-white/[0.02] border border-white/5 rounded-xl">
              <button
                onClick={() => setActiveTab("builder")}
                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "builder" ? "bg-[#0052cc] text-white" : "text-white/40 hover:bg-white/5"}`}
              >
                Grid Node Config
              </button>
              <button
                onClick={() => setActiveTab("flow")}
                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "flow" ? "bg-[#0052cc] text-white" : "text-white/40 hover:bg-white/5"}`}
              >
                Visual flow canvas
              </button>
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === "preview" ? "bg-[#0052cc] text-white" : "text-white/40 hover:bg-white/5"}`}
              >
                Preview HUD
              </button>
            </div>

            <button
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/20 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Configure</span>
            </button>

            <button
              onClick={handlePublish}
              disabled={publishLoading}
              className="jira-btn-primary !py-2.5 !px-6 flex items-center gap-2 text-[10px] hover:shadow-[0_0_20px_rgba(0,82,204,0.4)] disabled:opacity-60"
            >
              {publishLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{publishLoading ? "Saving..." : "Save & Publish"}</span>
            </button>
          </div>
        </header>

        {/* Publish Success Banner */}
        <AnimatePresence>
          {publishSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-400 shrink-0"
            >
              <CheckCircle2 className="w-5 h-5" />
              <div>
                <p className="text-[11px] font-black uppercase tracking-widest">Assessment Published Successfully!</p>
                <p className="text-[9px] font-bold text-emerald-400/60 mt-0.5">ID: {publishSuccess} — Redirecting to assessments...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Builder Interface */}
        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          {/* LEFT: Quick node selection & Metadata */}
          <aside className="w-80 flex flex-col shrink-0 gap-6 overflow-y-auto max-h-[calc(100vh-160px)] pr-2">
            {/* Metadata Card */}
            <div className="glass-card p-6 border-white/5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[#0052cc]/5 rounded-bl-[50px]" />
              <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-4 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5" /> Assessment Profile
              </h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                    Title
                  </label>
                  <input
                    type="text"
                    value={assessment.title}
                    onChange={(e) =>
                      setAssessment({ ...assessment, title: e.target.value })
                    }
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white focus:border-[#0052cc] outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Duration (Min)
                    </label>
                    <input
                      type="number"
                      value={assessment.duration}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          duration: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white focus:border-[#0052cc] outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Negative Marks
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      value={assessment.negativeMarking}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          negativeMarking: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-[11px] font-bold text-white focus:border-[#0052cc] outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI Generator Panel */}
            <div className="glass-card p-6 border-white/5 rounded-2xl relative overflow-hidden bg-gradient-to-b from-[#0e0e15] to-[#0a0a0f] border-b-[3px] border-b-purple-500/40">
              <h3 className="text-[10px] font-black uppercase text-purple-400 tracking-[0.3em] mb-4 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI
                Generator Uplink
              </h3>
              <div className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                    Topic Area
                  </label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Dynamic Programming, Redux"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2 text-[11px] font-bold text-white focus:border-purple-500 outline-none uppercase tracking-wider"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Node Type
                    </label>
                    <select
                      value={aiNodeType}
                      onChange={(e) => setAiNodeType(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold text-white outline-none"
                    >
                      <option value="mcq" className="bg-black">
                        MCQ
                      </option>
                      <option value="coding" className="bg-black">
                        Coding
                      </option>
                      <option value="text" className="bg-black">
                        Open Essay
                      </option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Difficulty
                    </label>
                    <select
                      value={aiDifficulty}
                      onChange={(e) => setAiDifficulty(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-2 py-2 text-[10px] font-bold text-white outline-none"
                    >
                      <option value="Easy" className="bg-black">
                        Easy
                      </option>
                      <option value="Medium" className="bg-black">
                        Medium
                      </option>
                      <option value="Hard" className="bg-black">
                        Hard
                      </option>
                    </select>
                  </div>
                </div>

                {aiNodeType === "coding" && (
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-white/20 uppercase tracking-widest">
                      Language
                    </label>
                    <select
                      value={aiLanguage}
                      onChange={(e) => setAiLanguage(e.target.value)}
                      className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white outline-none"
                    >
                      <option value="javascript" className="bg-black">
                        JavaScript
                      </option>
                      <option value="python" className="bg-black">
                        Python
                      </option>
                      <option value="cpp" className="bg-black">
                        C++
                      </option>
                    </select>
                  </div>
                )}

                <button
                  onClick={handleAIGenerate}
                  disabled={aiLoading}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition-all font-black text-[9px] uppercase tracking-widest text-white flex items-center justify-center gap-2"
                >
                  {aiLoading ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  <span>Generate via AI</span>
                </button>
              </div>
            </div>

            {/* Quick Node Creator */}
            <div className="glass-card p-6 border-white/5 rounded-2xl">
              <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-4">
                Manual Node Palette
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <NodeCreatorBtn
                  icon={<ListTodo size={12} />}
                  label="MCQ"
                  onClick={() => addNode("mcq")}
                />
                <NodeCreatorBtn
                  icon={<CheckSquare size={12} />}
                  label="Multi Select"
                  onClick={() => addNode("multiple-select")}
                />
                <NodeCreatorBtn
                  icon={<Code2 size={12} />}
                  label="Coding"
                  onClick={() => addNode("coding")}
                />
                <NodeCreatorBtn
                  icon={<Type size={12} />}
                  label="Conceptual"
                  onClick={() => addNode("text")}
                />
                <NodeCreatorBtn
                  icon={<Grid size={12} />}
                  label="Matrix"
                  onClick={() => addNode("matrix")}
                />
                <NodeCreatorBtn
                  icon={<ImageIcon size={12} />}
                  label="Image"
                  onClick={() => addNode("image")}
                />
                <NodeCreatorBtn
                  icon={<UploadCloud size={12} />}
                  label="File Upload"
                  onClick={() => addNode("file-upload")}
                />
                <NodeCreatorBtn
                  icon={<Video size={12} />}
                  label="Video Response"
                  onClick={() => addNode("video-response")}
                />
                <NodeCreatorBtn
                  icon={<Mic size={12} />}
                  label="Audio Response"
                  onClick={() => addNode("audio-response")}
                />
              </div>
            </div>
          </aside>

          {/* MAIN WORKSPACE CANVAS OR TABS */}
          <div className="flex-1 flex gap-6 overflow-hidden bg-black/40 rounded-3xl border border-white/5 p-6 min-h-0 relative">
            {activeTab === "builder" && (
              <>
                {/* NODE NAVIGATION AND STRUCTURE */}
                <div className="w-80 flex flex-col shrink-0 border-r border-white/5 pr-6 overflow-y-auto max-h-[calc(100vh-210px)]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">
                      Systems Checklist ({assessment.nodes.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {assessment.nodes.map((node, index) => {
                      const isSelected = node.id === selectedNodeId;
                      return (
                        <div
                          key={node.id}
                          onClick={() => setSelectedId(node.id)}
                          className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between ${
                            isSelected
                              ? "bg-[#0052cc]/10 border-[#0052cc] text-white shadow-[0_0_15px_rgba(0,82,204,0.15)]"
                              : "bg-white/[0.01] border-white/5 text-white/60 hover:bg-white/[0.03]"
                          }`}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-[8px] font-black text-[#0052cc] uppercase bg-[#0052cc]/10 px-1.5 py-0.5 rounded">
                                NODE {index + 1}
                              </span>
                              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest truncate">
                                {node.type}
                              </span>
                            </div>
                            <h4 className="text-xs font-black uppercase tracking-tight truncate">
                              {node.title || "Untitled Node"}
                            </h4>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNode(node.id);
                            }}
                            className="text-white/20 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* CORE SELECTED NODE EDITOR */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-210px)] px-4">
                  {selectedNode ? (
                    <div className="space-y-8 text-left">
                      {/* Node Header Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-white">
                            {selectedNode.type.toUpperCase()} NODE EDITOR
                          </span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#0052cc]">
                            {selectedNode.difficulty}
                          </span>
                        </div>

                        {/* AI Support trigger */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAIAnalyze("difficulty")}
                            disabled={aiLoading}
                            className="px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 text-[9px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1"
                          >
                            <Zap size={11} /> Analyze Difficulty
                          </button>
                          <button
                            onClick={() => handleAIAnalyze("rubric")}
                            disabled={aiLoading}
                            className="px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 text-[9px] font-black uppercase tracking-widest text-purple-300 flex items-center gap-1"
                          >
                            <Sparkles size={11} /> Optimize Rubric
                          </button>
                        </div>
                      </div>

                      {aiFeedback && (
                        <div className="p-4 rounded-xl border border-purple-500/20 bg-purple-500/5 text-[10px] font-bold text-purple-300 font-mono whitespace-pre-wrap relative">
                          <button
                            onClick={() => setAiFeedback(null)}
                            className="absolute top-2 right-2 text-purple-300/50 hover:text-purple-300"
                          >
                            <X size={14} />
                          </button>
                          {aiFeedback}
                        </div>
                      )}

                      {/* Base Configuration */}
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">
                            Node Title
                          </label>
                          <input
                            type="text"
                            value={selectedNode.title || ""}
                            onChange={(e) =>
                              updateNode(selectedNode.id, {
                                title: e.target.value,
                              })
                            }
                            className="jira-input !py-2.5 uppercase text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">
                            Section Group
                          </label>
                          <input
                            type="text"
                            value={selectedNode.section || ""}
                            onChange={(e) =>
                              updateNode(selectedNode.id, {
                                section: e.target.value,
                              })
                            }
                            className="jira-input !py-2.5 uppercase text-xs"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">
                              Timer (Sec)
                            </label>
                            <input
                              type="number"
                              value={selectedNode.timer || 0}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  timer: parseInt(e.target.value) || 0,
                                })
                              }
                              className="jira-input !py-2.5 text-xs"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">
                              Points
                            </label>
                            <input
                              type="number"
                              value={selectedNode.points || 0}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  points: parseInt(e.target.value) || 0,
                                })
                              }
                              className="jira-input !py-2.5 text-xs"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Branching Logic Configuration */}
                      <div className="p-4 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                        <div className="flex items-center gap-2">
                          <GitBranch size={14} className="text-[#0052cc]" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#0052cc]">
                            Uplink & Conditional Routing Flow
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                              Route on Success/Correct
                            </label>
                            <select
                              value={
                                selectedNode.nextNodes?.onCorrect ||
                                "node-completed"
                              }
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  nextNodes: {
                                    ...selectedNode.nextNodes,
                                    onCorrect: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-[10px] text-white"
                            >
                              <option
                                value="node-completed"
                                className="bg-black text-white"
                              >
                                END ASSESSMENT
                              </option>
                              {assessment.nodes
                                .filter((n) => n.id !== selectedNode.id)
                                .map((n) => (
                                  <option
                                    key={n.id}
                                    value={n.id}
                                    className="bg-black text-white"
                                  >
                                    {n.title.toUpperCase()}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">
                              Route on Failure/Incorrect
                            </label>
                            <select
                              value={
                                selectedNode.nextNodes?.onIncorrect ||
                                "node-completed"
                              }
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  nextNodes: {
                                    ...selectedNode.nextNodes,
                                    onIncorrect: e.target.value,
                                  },
                                })
                              }
                              className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-2.5 text-[10px] text-white"
                            >
                              <option
                                value="node-completed"
                                className="bg-black text-white"
                              >
                                END ASSESSMENT
                              </option>
                              {assessment.nodes
                                .filter((n) => n.id !== selectedNode.id)
                                .map((n) => (
                                  <option
                                    key={n.id}
                                    value={n.id}
                                    className="bg-black text-white"
                                  >
                                    {n.title.toUpperCase()}
                                  </option>
                                ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Problem Description */}
                      <div className="space-y-2">
                        <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                          Question Text
                        </label>
                        <textarea
                          rows={4}
                          value={selectedNode.text || ""}
                          onChange={(e) =>
                            updateNode(selectedNode.id, {
                              text: e.target.value,
                            })
                          }
                          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-sm font-bold text-white focus:border-[#0052cc] outline-none"
                        />
                      </div>

                      {/* TYPE SPECIFIC RENDERERS */}

                      {/* 1. MCQ and Multiple Select Option List */}
                      {(selectedNode.type === "mcq" ||
                        selectedNode.type === "multiple-select") && (
                        <div className="space-y-4">
                          <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                            Option Vectors
                          </label>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedNode.options?.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className="flex items-center gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl"
                              >
                                <button
                                  onClick={() => {
                                    const updatedCorrect = [
                                      ...(selectedNode.correct || []),
                                    ];
                                    if (selectedNode.type === "mcq") {
                                      updateNode(selectedNode.id, {
                                        correct: [oIdx],
                                      });
                                    } else {
                                      // Checkbox toggle
                                      if (updatedCorrect.includes(oIdx)) {
                                        updateNode(selectedNode.id, {
                                          correct: updatedCorrect.filter(
                                            (c) => c !== oIdx,
                                          ),
                                        });
                                      } else {
                                        updateNode(selectedNode.id, {
                                          correct: [...updatedCorrect, oIdx],
                                        });
                                      }
                                    }
                                  }}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-black ${selectedNode.correct?.includes(oIdx) ? "bg-emerald-500 text-white" : "bg-white/5 text-white/40"}`}
                                >
                                  {String.fromCharCode(65 + oIdx)}
                                </button>
                                <input
                                  type="text"
                                  value={opt}
                                  onChange={(e) => {
                                    const newOpts = [...selectedNode.options];
                                    newOpts[oIdx] = e.target.value;
                                    updateNode(selectedNode.id, {
                                      options: newOpts,
                                    });
                                  }}
                                  className="flex-1 bg-transparent border-none text-xs font-bold text-white focus:outline-none"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. Coding Node */}
                      {selectedNode.type === "coding" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">
                                Language
                              </label>
                              <select
                                value={selectedNode.language}
                                onChange={(e) =>
                                  updateNode(selectedNode.id, {
                                    language: e.target.value,
                                  })
                                }
                                className="w-full bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs"
                              >
                                <option
                                  value="javascript"
                                  className="bg-black text-white"
                                >
                                  JavaScript
                                </option>
                                <option
                                  value="python"
                                  className="bg-black text-white"
                                >
                                  Python (v3.11)
                                </option>
                                <option
                                  value="cpp"
                                  className="bg-black text-white"
                                >
                                  C++ (GCC 17)
                                </option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest mb-1.5">
                                Expected Grading Rubric
                              </label>
                              <input
                                type="text"
                                value={selectedNode.rubric || ""}
                                onChange={(e) =>
                                  updateNode(selectedNode.id, {
                                    rubric: e.target.value,
                                  })
                                }
                                className="jira-input !py-3 text-xs"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Starter Code
                            </label>
                            <textarea
                              rows={8}
                              value={selectedNode.starterCode || ""}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  starterCode: e.target.value,
                                })
                              }
                              className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs font-mono text-emerald-400 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                                Test Cases Matrix
                              </label>
                              <button
                                onClick={() => {
                                  const newTests = [
                                    ...(selectedNode.testCases || []),
                                    { input: "", output: "", hidden: false },
                                  ];
                                  updateNode(selectedNode.id, {
                                    testCases: newTests,
                                  });
                                }}
                                className="text-[9px] font-black text-[#0052cc] uppercase tracking-widest flex items-center gap-1"
                              >
                                <Plus size={12} /> Add TestCase
                              </button>
                            </div>
                            <div className="space-y-2">
                              {selectedNode.testCases?.map((tc, tcIdx) => (
                                <div
                                  key={tcIdx}
                                  className="grid grid-cols-3 gap-3 bg-white/[0.01] border border-white/5 p-3 rounded-xl"
                                >
                                  <input
                                    type="text"
                                    placeholder="Input parameters"
                                    value={tc.input}
                                    onChange={(e) => {
                                      const newTests = [
                                        ...selectedNode.testCases,
                                      ];
                                      newTests[tcIdx].input = e.target.value;
                                      updateNode(selectedNode.id, {
                                        testCases: newTests,
                                      });
                                    }}
                                    className="bg-[#0c0c0f] border border-white/5 rounded-lg p-2 text-xs font-mono"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Expected Return"
                                    value={tc.output}
                                    onChange={(e) => {
                                      const newTests = [
                                        ...selectedNode.testCases,
                                      ];
                                      newTests[tcIdx].output = e.target.value;
                                      updateNode(selectedNode.id, {
                                        testCases: newTests,
                                      });
                                    }}
                                    className="bg-[#0c0c0f] border border-white/5 rounded-lg p-2 text-xs font-mono"
                                  />
                                  <div className="flex items-center justify-between pl-2">
                                    <label className="flex items-center gap-1.5 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={tc.hidden}
                                        onChange={(e) => {
                                          const newTests = [
                                            ...selectedNode.testCases,
                                          ];
                                          newTests[tcIdx].hidden =
                                            e.target.checked;
                                          updateNode(selectedNode.id, {
                                            testCases: newTests,
                                          });
                                        }}
                                      />
                                      <span className="text-[8px] font-black uppercase text-white/40 tracking-wider">
                                        Hidden
                                      </span>
                                    </label>
                                    <button
                                      onClick={() => {
                                        const newTests =
                                          selectedNode.testCases.filter(
                                            (_, idx) => idx !== tcIdx,
                                          );
                                        updateNode(selectedNode.id, {
                                          testCases: newTests,
                                        });
                                      }}
                                      className="text-red-500/50 hover:text-red-500"
                                    >
                                      <MinusCircle size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 3. Matrix Match Node */}
                      {selectedNode.type === "matrix" && (
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">
                                Left Rows
                              </h4>
                              {selectedNode.matrixLeft?.map((left, idx) => (
                                <input
                                  key={idx}
                                  type="text"
                                  value={left}
                                  onChange={(e) => {
                                    const newLeft = [
                                      ...selectedNode.matrixLeft,
                                    ];
                                    newLeft[idx] = e.target.value;
                                    updateNode(selectedNode.id, {
                                      matrixLeft: newLeft,
                                    });
                                  }}
                                  className="w-full bg-[#0c0c0f] border border-white/5 p-2 text-xs rounded-lg mb-2"
                                />
                              ))}
                            </div>
                            <div>
                              <h4 className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-2">
                                Right Columns
                              </h4>
                              {selectedNode.matrixRight?.map((right, idx) => (
                                <input
                                  key={idx}
                                  type="text"
                                  value={right}
                                  onChange={(e) => {
                                    const newRight = [
                                      ...selectedNode.matrixRight,
                                    ];
                                    newRight[idx] = e.target.value;
                                    updateNode(selectedNode.id, {
                                      matrixRight: newRight,
                                    });
                                  }}
                                  className="w-full bg-[#0c0c0f] border border-white/5 p-2 text-xs rounded-lg mb-2"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 4. Text Answer Node */}
                      {selectedNode.type === "text" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Suggested Evaluation Keywords
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. key1, key2"
                              value={
                                selectedNode.suggestedKeywords?.join(", ") || ""
                              }
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  suggestedKeywords: e.target.value
                                    .split(",")
                                    .map((s) => s.trim()),
                                })
                              }
                              className="jira-input text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Evaluation Standard Rubric
                            </label>
                            <textarea
                              value={selectedNode.rubric || ""}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  rubric: e.target.value,
                                })
                              }
                              className="w-full bg-[#0c0c0f] border border-white/5 p-3 text-xs rounded-xl h-24"
                            />
                          </div>
                        </div>
                      )}

                      {/* 5. Image Question Node */}
                      {selectedNode.type === "image" && (
                        <div className="space-y-4">
                          <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                            Image URL Vector
                          </label>
                          <input
                            type="text"
                            value={selectedNode.imageUrl || ""}
                            onChange={(e) =>
                              updateNode(selectedNode.id, {
                                imageUrl: e.target.value,
                              })
                            }
                            className="jira-input text-xs font-mono"
                          />
                          {selectedNode.imageUrl && (
                            <div className="aspect-video w-80 rounded-xl overflow-hidden border border-white/10">
                              <img
                                src={selectedNode.imageUrl}
                                alt="Image node context"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* 6. File Upload Node */}
                      {selectedNode.type === "file-upload" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Allowed Extensions (e.g. .zip, .pdf)
                            </label>
                            <input
                              type="text"
                              value={
                                selectedNode.allowedTypes?.join(", ") || ""
                              }
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  allowedTypes: e.target.value
                                    .split(",")
                                    .map((s) => s.trim()),
                                })
                              }
                              className="jira-input text-xs font-mono"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Max Size (MB)
                            </label>
                            <input
                              type="number"
                              value={selectedNode.maxSize || 25}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  maxSize: parseInt(e.target.value) || 25,
                                })
                              }
                              className="jira-input text-xs"
                            />
                          </div>
                        </div>
                      )}

                      {/* 7. Video Response Node */}
                      {selectedNode.type === "video-response" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Max Recording Duration (Seconds)
                            </label>
                            <input
                              type="number"
                              value={selectedNode.maxDuration || 120}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  maxDuration: parseInt(e.target.value) || 120,
                                })
                              }
                              className="jira-input text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Required Rubrics
                            </label>
                            <textarea
                              value={selectedNode.rubric || ""}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  rubric: e.target.value,
                                })
                              }
                              className="w-full bg-[#0c0c0f] border border-white/5 p-3 text-xs rounded-xl h-24"
                            />
                          </div>
                        </div>
                      )}

                      {/* 8. Audio Response Node */}
                      {selectedNode.type === "audio-response" && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Max Recording Duration (Seconds)
                            </label>
                            <input
                              type="number"
                              value={selectedNode.maxDuration || 60}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  maxDuration: parseInt(e.target.value) || 60,
                                })
                              }
                              className="jira-input text-xs"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="block text-[8px] font-black text-white/20 uppercase tracking-widest">
                              Required Rubrics
                            </label>
                            <textarea
                              value={selectedNode.rubric || ""}
                              onChange={(e) =>
                                updateNode(selectedNode.id, {
                                  rubric: e.target.value,
                                })
                              }
                              className="w-full bg-[#0c0c0f] border border-white/5 p-3 text-xs rounded-xl h-24"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center text-white/30 text-xs italic">
                      Select a Node from the list to modify credentials
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === "flow" && (
              <div className="flex-1 w-full h-full relative overflow-auto bg-black bg-[radial-gradient(#1a1a24_1px,transparent_1px)] bg-[size:24px_24px] rounded-2xl flex flex-wrap p-8 gap-8 justify-center items-center">
                <div className="absolute top-4 left-4 bg-black/60 px-4 py-2 rounded-lg border border-white/5 text-[9px] font-black uppercase text-white/40 tracking-widest z-10">
                  Visual Connection Graph Canvas (Interact & Position Nodes)
                </div>

                {/* Render connecting arrows or lines using canvas or visually styled motion divs */}
                {assessment.nodes.map((node, index) => {
                  return (
                    <motion.div
                      key={node.id}
                      drag
                      dragMomentum={false}
                      initial={{ x: node.x, y: node.y }}
                      onDragEnd={(e, info) => {
                        const x = node.x + info.offset.x;
                        const y = node.y + info.offset.y;
                        updateNode(node.id, { x, y });
                      }}
                      onClick={() => {
                        setSelectedId(node.id);
                        setActiveTab("builder");
                      }}
                      className={`w-64 glass-card border flex flex-col cursor-pointer hover:border-purple-500/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-colors p-4 shrink-0 absolute ${
                        node.id === selectedNodeId
                          ? "border-[#0052cc] bg-[#0052cc]/5"
                          : "border-white/5"
                      }`}
                      style={{ left: node.x, top: node.y }}
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                        <span className="text-[8px] font-black uppercase tracking-widest bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white/60">
                          {node.type}
                        </span>
                        <span className="text-[8px] font-black text-[#0052cc] uppercase">
                          {node.section}
                        </span>
                      </div>

                      <h4 className="text-xs font-black uppercase tracking-tight truncate text-white mb-2">
                        {node.title}
                      </h4>
                      <p className="text-[10px] text-white/40 font-bold tracking-wider uppercase truncate mb-4">
                        {node.text}
                      </p>

                      {/* Route vectors list inside flow node */}
                      <div className="space-y-1 bg-black/40 p-2 rounded-lg border border-white/5">
                        <div className="flex items-center justify-between text-[8px] font-black text-white/40 uppercase">
                          <span>Default flow:</span>
                          <span className="text-emerald-400">
                            {node.nextNodes?.default || "Completed"}
                          </span>
                        </div>
                        {node.nextNodes?.onCorrect && (
                          <div className="flex items-center justify-between text-[8px] font-black text-white/40 uppercase">
                            <span>On Correct:</span>
                            <span className="text-purple-400">
                              {node.nextNodes.onCorrect}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {activeTab === "preview" && (
              <div className="flex-1 overflow-y-auto max-h-[calc(100vh-210px)] p-6 text-left space-y-12">
                <div className="p-8 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl text-center">
                  <Award className="w-12 h-12 text-emerald-500 mx-auto mb-4 animate-pulse" />
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-2">
                    {assessment.title}
                  </h2>
                  <p className="text-[10px] font-black tracking-widest uppercase text-white/30">
                    {assessment.duration} minutes total time limits • All
                    security rules active
                  </p>
                </div>

                <div className="space-y-8">
                  {assessment.nodes.map((node, nIdx) => (
                    <div
                      key={node.id}
                      className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl relative"
                    >
                      <span className="absolute top-4 right-4 bg-white/5 px-3 py-1 rounded text-[8px] font-black uppercase text-white/40">
                        {node.type}
                      </span>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-6 h-6 rounded bg-[#0052cc] text-white font-black text-[11px] flex items-center justify-center">
                          {nIdx + 1}
                        </div>
                        <h3 className="text-sm font-black uppercase text-white tracking-wider">
                          {node.title}
                        </h3>
                      </div>
                      <p className="text-base text-white/80 font-bold mb-6">
                        {node.text}
                      </p>

                      {/* Option list preview */}
                      {node.options && (
                        <div className="grid grid-cols-2 gap-4">
                          {node.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`p-3 rounded-xl border flex items-center gap-3 ${node.correct?.includes(oIdx) ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/5"}`}
                            >
                              <div className="w-5 h-5 rounded bg-white/5 text-white/40 flex items-center justify-center text-[10px] font-black uppercase">
                                {String.fromCharCode(65 + oIdx)}
                              </div>
                              <span className="text-xs font-bold text-white/60">
                                {opt}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {node.type === "coding" && (
                        <div className="bg-[#050508] border border-white/10 rounded-xl p-4 font-mono text-xs space-y-3">
                          <div className="flex justify-between items-center text-[9px] font-black text-white/40 uppercase">
                            <span>Starter Code Template ({node.language})</span>
                          </div>
                          <pre className="text-emerald-400">
                            {node.starterCode}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Floating Status Check */}
      <div className="fixed bottom-6 right-6 px-4 py-2.5 rounded-xl bg-black border border-white/5 flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest z-50 shadow-2xl">
        <ShieldCheck size={12} className="text-[#0052cc]" /> Build Node Verified
      </div>
    </div>
  );
}

function NodeCreatorBtn({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.04] hover:border-white/10 hover:shadow-lg hover:-translate-y-0.5 transition-all text-center group gap-1.5"
    >
      <div className="text-white/20 group-hover:text-[#0052cc] transition-colors">
        {icon}
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
}

function NodeCreatorBtnSub({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] border border-white/5 hover:bg-white/[0.03] transition-all text-left group"
    >
      <div className="text-white/20 group-hover:text-[#0052cc] transition-colors">
        {icon}
      </div>
      <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
        {label}
      </span>
    </button>
  );
}
