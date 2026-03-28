'use client';

import type { InterviewPhase } from '@/types';

interface PhaseIndicatorProps {
  currentPhase: InterviewPhase;
}

const PHASES: { key: InterviewPhase; label: string }[] = [
  { key: 'person', label: 'Getting to know you' },
  { key: 'offering', label: 'Your offerings' },
  { key: 'brand', label: 'Brand & energy' },
  { key: 'assets', label: 'Assets & proof' },
];

function phaseIndex(phase: InterviewPhase): number {
  if (phase === 'complete') return PHASES.length;
  return PHASES.findIndex((p) => p.key === phase);
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const activeIdx = phaseIndex(currentPhase);

  return (
    <div className="w-full px-4 py-3 bg-white border-b border-gray-100">
      <div className="flex items-center gap-1 max-w-2xl mx-auto">
        {PHASES.map((phase, idx) => {
          const isActive = idx === activeIdx;
          const isComplete = idx < activeIdx;

          return (
            <div key={phase.key} className="flex-1 flex flex-col items-center gap-1">
              {/* Step bar */}
              <div
                className={`
                  h-1 w-full rounded-full transition-colors duration-300
                  ${isComplete ? 'bg-amber-400' : isActive ? 'bg-amber-300' : 'bg-gray-200'}
                `}
              />
              {/* Label */}
              <span
                className={`
                  text-[10px] leading-tight text-center transition-colors duration-300
                  ${isActive ? 'text-amber-600 font-medium' : isComplete ? 'text-gray-500' : 'text-gray-300'}
                `}
              >
                {phase.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
