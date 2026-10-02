import { AuditResult, ParsedProfile } from './types';
import ScoreGauge from './ScoreGauge';
import CategoryBreakdown from './CategoryBreakdown';
import Suggestions from './Suggestions';

interface Props {
  profile: ParsedProfile;
  result: AuditResult;
  onReset: () => void;
}

const CATEGORY_ORDER = [
  { key: 'search-visibility', label: 'Search visibility', icon: 'Search visibility' },
  { key: 'skills', label: 'Skills recruiters can find', icon: 'Skills' },
  { key: 'completeness', label: 'Profile completeness', icon: 'Completeness' },
  { key: 'writing', label: 'Profile writing', icon: 'Writing' },
  { key: 'proof-of-work', label: 'Proof of work', icon: 'Proof of work' },
  { key: 'activity', label: 'Recent activity & connections', icon: 'Activity' },
];

export default function AuditReport({ profile, result, onReset }: Props) {
  const { overallScore, totalChecked, totalPossible, checkedPercent, criteria, topActions, headlineSuggestions, aboutOutline } = result;
  
  const goodCount = criteria.filter(c => c.status === 'pass' && !c.couldNotCheck).length;
  const warnCount = criteria.filter(c => c.status === 'warn' && !c.couldNotCheck).length;
  const failCount = criteria.filter(c => c.status === 'fail' && !c.couldNotCheck).length;
  const uncheckedCount = criteria.filter(c => c.couldNotCheck).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <ScoreGauge score={overallScore} />
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              Your LinkedIn Audit score: {overallScore}/100
            </h2>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">Beta</span>
              <span className="text-sm text-gray-500">{checkedPercent}% of scoring criteria checked</span>
            </div>
            <p className="text-sm text-gray-600 max-w-lg">
              This score reviews how this profile presents your skills and work. It is not a grade of you and does not predict hiring results.
              {uncheckedCount > 0 && (
                <span className="block mt-1 text-gray-400">
                  {uncheckedCount} items could not be checked and were left out of the score.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {topActions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Start with these {topActions.length} changes</h3>
          <p className="text-sm text-gray-500 mb-6">
            This audit reviewed {totalChecked} criteria. {goodCount} look good, {warnCount} could be stronger, and {failCount} need attention. {uncheckedCount} could not be checked and were left out of the score.
          </p>
          <div className="space-y-4">
            {topActions.map((action, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {action.rank}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{action.title}</h4>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm">
                    <span className="text-green-600 font-medium">Potential score increase: up to +{action.potentialIncrease}</span>
                    <span className="text-gray-400">{"·"}</span>
                    <span className="text-gray-500">{action.timeEstimate}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Why this was suggested: {action.reason}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 italic">
            Score changes are estimates. Your next result can vary if LinkedIn provides different profile data.
          </p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Score breakdown</h3>
        <div className="space-y-2">
          {CATEGORY_ORDER.map(({ key, label, icon }) => {
            const catCriteria = criteria.filter(c => c.category === key && !c.couldNotCheck);
            if (catCriteria.length === 0) return null;
            const catScore = catCriteria.reduce((sum, c) => sum + c.score, 0);
            const catMax = catCriteria.reduce((sum, c) => sum + c.maxScore, 0);
            const catUnchecked = criteria.filter(c => c.category === key && c.couldNotCheck).length;
            return (
              <CategoryBreakdown
                key={key}
                icon={icon}
                label={label}
                score={catScore}
                maxScore={catMax}
                criteria={criteria.filter(c => c.category === key)}
                uncheckedCount={catUnchecked}
              />
            );
          })}
        </div>
      </div>

      <Suggestions
        headlineSuggestions={headlineSuggestions}
        aboutOutline={aboutOutline}
        profile={profile}
      />

      <div className="text-center pb-8">
        <button
          onClick={onReset}
          className="px-6 py-2.5 text-sm font-medium text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
        >
          Upload a different profile
        </button>
      </div>
    </div>
  );
}
