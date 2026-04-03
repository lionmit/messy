'use client';

import type { InterviewPhase } from '@/types';

interface PhaseIndicatorProps {
  currentPhase: InterviewPhase;
}

const PHASES: { key: InterviewPhase; label: string }[] = [
  { key: 'person', label: 'You' },
  { key: 'offering', label: 'Offerings' },
  { key: 'brand', label: 'Brand' },
  { key: 'assets', label: 'Assets' },
];

function phaseIndex(phase: InterviewPhase): number {
  if (phase === 'complete') return PHASES.length;
  return PHASES.findIndex((p) => p.key === phase);
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const activeIdx = phaseIndex(currentPhase);

  return (
    <div className="flex items-center gap-1.5" style={{ maxWidth: '280px', width: '100%' }}>
      {PHASES.map((phase, idx) => {
        const isActive = idx === activeIdx;
        const isComplete = idx < activeIdx;

        return (
          <div key={phase.key} className="flex-1 flex flex-col items-center gap-0.5">
            <div
              className="h-[4px] w-full rounded-full transition-all duration-500"
              style={{
                background: isComplete
                  ? 'var(--teal)'
                  : isActive
                    ? 'var(--yellow)'
                    : 'var(--border-light)',
                boxShadow: isActive ? '0 0 6px rgba(245, 166, 35, 0.3)' : 'none',
              }}
            />
            <span
              className="text-[9px] leading-tight text-center font-medium hidden sm:block"
              style={{
                color: isActive
                  ? 'var(--yellow-dark)'
                  : isComplete
                    ? 'var(--teal)'
                    : 'var(--text-muted)',
              }}
            >
              {phase.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
