import React from 'react';
import { CornerDownLeft, CornerDownRight } from 'lucide-react';

interface FollowUpsProps {
  followUps: string[];
  onSelect: (query: string) => void;
  dir: 'ltr' | 'rtl';
}

export const FollowUps: React.FC<FollowUpsProps> = ({ followUps, onSelect, dir }) => {
  if (!followUps || followUps.length === 0) return null;

  // Filter to max 3 items and clean up
  const items = followUps.slice(0, 3);

  return (
    <div className="mt-2 pt-1.5 border-t border-[var(--border-default)]/40 w-full select-none" id="follow-ups-container" dir={dir}>
      <div className="flex flex-wrap items-center gap-1.5 w-full">
        {items.map((q, idx) => (
          <button
            key={`follow-up-${idx}-${q.slice(0, 15)}`}
            onClick={() => onSelect(q)}
            id={`follow-up-${idx}`}
            className="group flex-1 min-w-[120px] max-w-full inline-flex items-center justify-between gap-1.5 px-3 py-1.5 bg-[var(--surface-card)] hover:bg-[var(--surface-subtle)] active:bg-[var(--surface-inset)] border border-[var(--border-default)] hover:border-[var(--border-accent)]/60 rounded-[var(--radius-sm)] text-start cursor-pointer transition-colors duration-fast shadow-2xs"
            title={q}
          >
            <span className="text-xs font-semibold text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors truncate">
              {q}
            </span>
            <span className="shrink-0 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors">
              {dir === 'rtl' ? (
                <CornerDownLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              ) : (
                <CornerDownRight size={12} className="transition-transform group-hover:translate-x-0.5" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

