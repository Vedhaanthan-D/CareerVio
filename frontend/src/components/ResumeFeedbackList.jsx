import { CheckCircle, AlertTriangle, Lightbulb, TrendingUp } from 'lucide-react';

/**
 * Renders structured resume feedback, including a summary,
 * key strengths (pros), sorted improvement areas (cons) with impact levels,
 * and a top priority fix banner.
 */
export default function ResumeFeedbackList({ feedback }) {
  if (!feedback) return null;

  const { summary, pros = [], cons = [], topPriority } = feedback;

  return (
    <div className="space-y-6">
      {/* Top Priority Banner */}
      {topPriority && (
        <div className="relative overflow-hidden bg-accent/5 border border-accent/20 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-10 h-10 shrink-0 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <TrendingUp size={20} />
          </div>
          <div>
            <span className="text-xs font-bold font-heading text-accent uppercase tracking-wider">Top Priority Change</span>
            <p className="text-sm font-medium text-text-primary mt-1 leading-relaxed">
              {topPriority}
            </p>
          </div>
        </div>
      )}

      {/* Summary & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pros */}
        <div className="bg-bg-card border border-border-color rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold font-heading text-text-primary flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-500" />
            Key Strengths
          </h3>
          {pros.length > 0 ? (
            <div className="space-y-3">
              {pros.map((pro, idx) => (
                <div key={idx} className="flex gap-2.5 text-xs text-text-secondary leading-relaxed">
                  <span className="text-emerald-500 font-bold shrink-0">✓</span>
                  <span>{pro}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-text-secondary italic">No key strengths highlighted yet.</p>
          )}
        </div>

        {/* Verdict / Summary */}
        <div className="bg-bg-card border border-border-color rounded-2xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold font-heading text-text-primary flex items-center gap-2 mb-3">
              <Lightbulb size={16} className="text-accent" />
              Overall Verdict
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              {summary || 'Review complete. Follow the action items below to optimize your score.'}
            </p>
          </div>
        </div>
      </div>

      {/* Cons (Actionable Improvements) */}
      {cons.length > 0 && (
        <div className="bg-bg-card border border-border-color rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold font-heading text-text-primary flex items-center gap-2">
            <AlertTriangle size={16} className="text-orange-500" />
            Areas for Improvement
          </h3>
          <div className="divide-y divide-border-color">
            {cons.map((con, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-4 items-start justify-between">
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-heading text-text-primary uppercase tracking-wider">
                      {con.category}
                    </span>
                    {con.pointsLost > 0 && (
                      <span className="text-[10px] font-semibold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded">
                        -{con.pointsLost} pts
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">{con.issue}</p>
                  {con.fix && (
                    <div className="mt-2 text-xs bg-bg-main/50 border border-border-color rounded-lg p-2.5">
                      <span className="font-semibold text-accent">Fix:</span>{' '}
                      <span className="text-text-primary">{con.fix}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
