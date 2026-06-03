'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * QuestionCard – premium MCQ / text question display.
 * Props:
 *   question       – { text, options[], image?, marks? }
 *   selectedAnswer – index (number) or null
 *   onSelectOption – (idx) => void
 *   isFlagged      – boolean
 *   onToggleFlag   – () => void
 *   questionNumber – 1-indexed display number
 *   totalQuestions – total question count
 */
export default function QuestionCard({
  question,
  selectedAnswer,
  onSelectOption,
  isFlagged,
  onToggleFlag,
  questionNumber,
  totalQuestions,
}) {
  if (!question) return null;

  const isSubjective = question.type === 'text' || question.type === 'subjective';

  return (
    <motion.div
      key={questionNumber}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col gap-6"
    >
      {/* ── Question meta row ──────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black text-[#0052cc] uppercase tracking-[0.3em]">
            Q {questionNumber} / {totalQuestions}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
            {isSubjective ? 'Subjective' : question.type === 'multiple-select' ? 'Multi-Select' : 'MCQ'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            {question.marks ?? 1} {(question.marks ?? 1) === 1 ? 'mark' : 'marks'}
          </span>
          {onToggleFlag && (
            <button
              onClick={onToggleFlag}
              title={isFlagged ? 'Unflag question' : 'Flag for review'}
              className={`p-1.5 rounded-lg border transition-all text-[11px] ${
                isFlagged
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-white/[0.03] border-white/[0.06] text-white/30 hover:text-amber-400 hover:border-amber-400/30'
              }`}
            >
              ⚑
            </button>
          )}
        </div>
      </div>

      {/* ── Question body ──────────────────────────────── */}
      <div className="jira-premium-card !p-8 space-y-6">

        {/* Image attachment */}
        {question.image && (
          <div className="rounded-xl overflow-hidden border border-white/[0.06]">
            <img
              src={question.image}
              alt="Question visual"
              className="w-full max-h-64 object-contain bg-black/30"
            />
          </div>
        )}

        {/* Question text */}
        <p className="text-[15px] font-semibold text-white/90 leading-relaxed">
          {question.text}
        </p>

        {/* ── MCQ Options ──────────────────────────────── */}
        {!isSubjective && question.options?.length > 0 && (
          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              const selected = selectedAnswer === idx;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectOption(idx)}
                  className={`w-full flex items-start gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-200 group ${
                    selected
                      ? 'bg-[#0052cc]/10 border-[#0052cc]/50 shadow-[0_0_16px_rgba(0,82,204,0.12)]'
                      : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.05] hover:border-white/[0.14]'
                  }`}
                >
                  {/* Letter badge */}
                  <span className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[12px] font-black transition-all ${
                    selected
                      ? 'bg-[#0052cc] text-white shadow-[0_0_10px_rgba(0,82,204,0.4)]'
                      : 'bg-white/[0.06] text-white/40 group-hover:bg-white/[0.10] group-hover:text-white/70'
                  }`}>
                    {letter}
                  </span>
                  <span className={`text-[13px] leading-relaxed font-medium mt-0.5 ${
                    selected ? 'text-white' : 'text-white/65 group-hover:text-white/85'
                  }`}>
                    {opt}
                  </span>
                  {selected && (
                    <span className="ml-auto shrink-0 text-[#0052cc] mt-0.5">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Subjective textarea ───────────────────────── */}
        {isSubjective && (
          <textarea
            rows={8}
            placeholder="Write your answer here…"
            value={typeof selectedAnswer === 'string' ? selectedAnswer : ''}
            onChange={(e) => onSelectOption(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/[0.09] rounded-xl px-5 py-4 text-[13px] text-white/85 placeholder-white/20 focus:outline-none focus:border-[#0052cc]/50 focus:bg-white/[0.05] resize-none transition-all leading-relaxed"
          />
        )}
      </div>
    </motion.div>
  );
}
