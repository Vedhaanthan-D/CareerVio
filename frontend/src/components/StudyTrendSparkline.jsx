import React from 'react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

/** Renders a stock-market style line sparkline representing study activity trend. */
export default function StudyTrendSparkline({ weeklyActivity }) {
  const isTrendUp = weeklyActivity.length > 1 && weeklyActivity[weeklyActivity.length - 1].completed >= weeklyActivity[weeklyActivity.length - 2].completed;

  return (
    <div className="flex-1 min-w-[140px] flex flex-col justify-between h-full py-1">
      <div className="text-left mb-1">
        <span className="text-[9px] text-text-secondary uppercase tracking-wider font-semibold block">Study Trend</span>
        <span className="text-xs font-bold text-text-primary flex items-center gap-1 mt-0.5">
          Performance: 
          {isTrendUp ? (
            <span className="text-success text-[10px] font-bold flex items-center gap-0.5">▲ UP</span>
          ) : (
            <span className="text-text-secondary text-[10px] font-bold">STEADY</span>
          )}
        </span>
      </div>
      <div className="h-[90px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weeklyActivity} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="studyTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="completed" 
              stroke="#22c55e" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#studyTrendGrad)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
