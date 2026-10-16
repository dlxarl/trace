import React from 'react';
import { RelationshipStatus } from '@/types';

interface StatusBadgeProps {
  status: RelationshipStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<RelationshipStatus, { label: string; bg: string; text: string; border: string }> = {
    confirmed: {
      label: 'Confirmed',
      bg: 'bg-emerald-950/60',
      text: 'text-emerald-400',
      border: 'border-emerald-800/80',
    },
    supported: {
      label: 'Supported',
      bg: 'bg-sky-950/60',
      text: 'text-sky-400',
      border: 'border-sky-800/80',
    },
    unverified: {
      label: 'Unverified',
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-800/80',
    },
    candidate: {
      label: 'Candidate',
      bg: 'bg-zinc-800/60',
      text: 'text-zinc-400',
      border: 'border-zinc-700/80',
    },
    rejected: {
      label: 'Rejected',
      bg: 'bg-rose-950/60',
      text: 'text-rose-400',
      border: 'border-rose-800/80',
    },
  };

  const c = configs[status] || configs.candidate;
  const padding = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded border ${c.bg} ${c.text} ${c.border} ${padding}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-80" />
      {c.label}
    </span>
  );
};
