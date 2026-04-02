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
    <div
      className="w-full px-4 py-3"
      style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border-light)' }}
    >
      <div className="flex items-center gap-1.5 max-w-2xl mx-auto">
        {PHASES.map((phase, idx) => {
          const isActive = idx === activeIdx;
          const isComplete = idx < activeIdx;

          return (
            <div key={phase.key} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="h-1.5 w-full rounded-full transition-colors duration-500"
                style={{
                  background: isComplete
                    ? 'var(--teal)'
                    : isActive
                      ? 'var(--yellow)'
                      : 'var(--border-light)',
                }}
              />
              <span
                className="text-[10px] leading-tight text-center transition-colors duration-300 font-medium"
                style={{
                  color: isActive
                    ? 'var(--yellow-hover)'
                    : isComplete
                      ? 'var(--teal)'
                      : 'var(--border)',
                }}
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
