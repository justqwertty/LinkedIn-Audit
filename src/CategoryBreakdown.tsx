import { Criterion } from './types';
import { useState } from 'react';

interface Props {
  icon: string;
  label: string;
  score: number;
  maxScore: number;
  criteria: Criterion[];
  uncheckedCount: number;
}

export default function CategoryBreakdown({ icon, label, score, maxScore, criteria, uncheckedCount }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const hasUnchecked = uncheckedCount > 0;
  
  const getBarColor = (p: number) => {
    if (p >= 75) return 'bg-green-500';
    if (p >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const getIcon = (status: Criterion['status']) => {
    switch (status) {
      case 'pass': return <span className="text-green-500 text-sm">{"✓"}</span>;
      case 'warn': return <span className="text-yellow-500 text-sm">{"△"}</span>;
      case 'fail': return <span className="text-red-500 text-sm">{"✕"}</span>;
      default: return <span className="text-gray-300 text-sm">{"○"}</span>;
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <span className="text-xl">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">{label}</span>
            {hasUnchecked && <span className="text-xs text-gray-400">{"·"} {uncheckedCount} could not check</span>}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${getBarColor(pct)}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-gray-500">{score}/{maxScore}</span>
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 space-y-3">
          {criteria.map((c) => (
            <div key={c.id} className="py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex-shrink-0">{getIcon(c.status)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{c.finding}</p>
                  {c.action && <p className="text-sm text-blue-600 mt-0.5">What to do: {c.action}</p>}
                  {c.couldNotCheck && (
                    <>
                      <p className="text-sm text-gray-500 mt-0.5">Why we could not check: {c.finding || 'Not enough information available.'}</p>
                      {c.action && <p className="text-sm text-gray-500 mt-0.5">Check it yourself: {c.action}</p>}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
