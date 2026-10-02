import { Criterion } from './types';
import { useState } from 'react';

interface Props {
  label: string;
  score: number;
  maxScore: number;
  criteria: Criterion[];
  uncheckedCount: number;
}

export default function CategoryBreakdown({ label, score, maxScore, criteria, uncheckedCount }: Props) {
  const [expanded, setExpanded] = useState(false);
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const hasUnchecked = uncheckedCount > 0;
  
  const getBarColor = (p: number) => {
    if (p >= 75) return '#27835d';
    if (p >= 50) return '#d69a20';
    return '#d64c4c';
  };
  
  const getIcon = (status: Criterion['status']) => {
    switch (status) {
      case 'pass': return <span className="audit-status-mark audit-status-pass" aria-label="Passed">✓</span>;
      case 'warn': return <span className="audit-status-mark audit-status-warn" aria-label="Could be stronger">?</span>;
      case 'fail': return <span className="audit-status-mark audit-status-fail" aria-label="Needs attention">×</span>;
      default: return <span className="audit-status-mark audit-status-unchecked" aria-label="Not checked">○</span>;
    }
  };

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden category-breakdown">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors text-left category-toggle"
        aria-expanded={expanded}
      >
        <div className="flex-1 min-w-0 category-toggle-content">
          <div className="flex items-center gap-2 category-toggle-title-row">
            <span className="font-medium text-gray-900 text-sm">{label}</span>
            {hasUnchecked && <span className="text-xs text-gray-400">{"·"} {uncheckedCount} could not check</span>}
          </div>
          <div className="flex items-center gap-2 mt-1 category-score-row">
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden category-score-track">
              <div className="h-full rounded-full transition-all category-score-fill" style={{ width: `${pct}%`, backgroundColor: getBarColor(pct) }} />
            </div>
            <span className="text-xs text-gray-500">{score}/{maxScore}</span>
          </div>
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''} category-chevron${expanded ? ' is-expanded' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 px-5 py-3 space-y-3 category-details">
          {criteria.map((c) => (
            <div key={c.id} className="py-2 border-b border-gray-100 last:border-0 criterion-row">
              <div className="flex items-start gap-2 criterion-line">
                <span className="mt-0.5 flex-shrink-0 criterion-indicator">{getIcon(c.status)}</span>
                <div className="flex-1 min-w-0 criterion-copy">
                  {c.finding && <p className="text-sm font-medium text-gray-900 criterion-finding">{c.finding}</p>}
                  {c.action && <p className="text-sm text-blue-600 mt-0.5 criterion-action">What to do: {c.action}</p>}
                  <div className="criterion-points" aria-label={c.couldNotCheck ? 'Not scored' : `${c.score} points earned; ${Math.max(0, c.maxScore - c.score)} points missed`}>
                    {c.couldNotCheck ? <span className="points-unscored">Not scored</span> : <>
                      {c.score > 0 && <span className="points-earned">+{c.score} {c.score === 1 ? 'point' : 'points'} earned</span>}
                      {c.maxScore > c.score && <span className="points-missed">−{c.maxScore - c.score} {c.maxScore - c.score === 1 ? 'point' : 'points'} missed</span>}
                    </>}
                  </div>
                  {c.couldNotCheck && (
                    <>
                      <p className="text-sm text-gray-500 mt-0.5 criterion-unavailable">Why we could not check: {c.finding || 'This information is not included in the PDF.'}</p>
                      {c.action && <p className="text-sm text-gray-500 mt-0.5 criterion-action">Check it yourself: {c.action}</p>}
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
