'use client';

import React from 'react';

/**
 * QuestionCard displays the current MCQ question and its choices.
 * @param {object} question - The question object { text, options: [] }
 * @param {number} selectedAnswer - The index of the currently selected answer (0-3)
 * @param {function} onSelectOption - Callback function passing the selected option index
 * @param {number} currentNumber - Current 1-indexed question index
 * @param {number} totalQuestions - Total questions in the exam
 */
export default function QuestionCard({ 
  question, 
  selectedAnswer, 
  onSelectOption, 
  currentNumber, 
  totalQuestions 
}) {
  if (!question) return null;

  return (
    <div className="p-8 rounded-xl border border-white/5 bg-[#0f0f11] space-y-6 hover-animate">
      
      {/* Progress & Marks Indicator */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <span className="text-[10px] font-bold tracking-widest text-accentBlue uppercase font-outfit">
          Question {currentNumber} of {totalQuestions}
        </span>
        <span className="px-2.5 py-0.5 rounded-full border border-white/10 bg-white/[0.03] text-[10px] text-white/50 font-bold uppercase font-outfit">
          {question.marks || 1} {question.marks === 1 ? 'Mark' : 'Marks'}
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
        {question.text}
      </h3>

      {/* MCQ Options List */}
      <div className="space-y-3">
        {question.options.map((option, idx) => {
          const isSelected = selectedAnswer === idx;
          const letter = String.fromCharCode(65 + idx); // A, B, C, D

          return (
            <button
              key={idx}
              onClick={() => onSelectOption(idx)}
              className={`w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all duration-200 ${
                isSelected
                  ? 'border-accentBlue bg-accentBlue/5 text-white ring-2 ring-accentBlue/20 shadow-md shadow-accentBlue/5'
                  : 'border-white/5 bg-white/[0.01] text-white/70 hover:bg-white/[0.03] hover:border-white/10 hover:text-white'
              }`}
            >
              {/* Alphabet circle indicator */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                isSelected
                  ? 'bg-accentBlue text-white shadow-md'
                  : 'bg-white/[0.04] text-white/50 border border-white/5'
              }`}>
                {letter}
              </div>
              <span className="text-sm font-medium">{option}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
}
