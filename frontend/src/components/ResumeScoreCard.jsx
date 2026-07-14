import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

const SCORE_TIERS = [
  { min: 75, label: 'ATS Ready', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', Icon: CheckCircle },
  { min: 50, label: 'Needs Work', color: '#f97316', bg: 'rgba(249,115,22,0.08)', Icon: AlertCircle },
  { min: 0,  label: 'Needs Improvement', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', Icon: XCircle },
];

function getScoreTier(score) {
  return SCORE_TIERS.find(t => score >= t.min);
}

/** Displays the overall ATS-readiness score with color coding and section breakdown. */
export default function ResumeScoreCard({ score, sectionScores, wordCount }) {
  const tier = getScoreTier(score);
  const { Icon } = tier;

  const circumference = 2 * Math.PI * 44;
  const progress = (score / 100) * circumference;

  return (
    <div className="bg-bg-card border border-border-color rounded-2xl p-6 space-y-5">
      {/* Score ring */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-color)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44"
              fill="none"
              stroke={tier.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold font-heading" style={{ color: tier.color }}>{score}</span>
            <span className="text-xs text-text-secondary">/100</span>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Icon size={15} style={{ color: tier.color }} />
            <span className="text-sm font-semibold font-heading" style={{ color: tier.color }}>{tier.label}</span>
          </div>
          <p className="text-xs text-text-secondary">ATS Readiness Score</p>
          {wordCount && (
            <p className="text-xs text-text-secondary mt-1">{wordCount} words detected</p>
          )}
        </div>
      </div>

      {/* Section breakdown */}
      {sectionScores && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {['contact', 'education', 'experience', 'skills'].map(key => (
            <div
              key={key}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border-color text-xs"
              style={{ background: sectionScores[key] ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)' }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: sectionScores[key] ? '#22c55e' : '#ef4444' }}
              />
              <span className="capitalize text-text-secondary">{key}</span>
              <span className="ml-auto font-semibold" style={{ color: sectionScores[key] ? '#22c55e' : '#ef4444' }}>
                {sectionScores[key] ? '✓' : '✗'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
