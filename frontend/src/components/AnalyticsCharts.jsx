import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

/** Renders visual analytics charts for weekly study activity and milestone progress. */
export default function AnalyticsCharts({ weeklyData, milestoneData }) {
  const hasWeeklyData = weeklyData && weeklyData.length > 0;
  const hasMilestoneData = milestoneData && milestoneData.length > 0;

  if (!hasWeeklyData && !hasMilestoneData) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      {/* Chart 1: Weekly Activity */}
      <div className="bg-bg-card border border-border-color rounded-xl p-5 shadow-md flex flex-col text-left h-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-accent shrink-0" size={18} />
          <h3 className="text-sm font-bold font-heading text-text-primary">Weekly Study Activity</h3>
        </div>
        <div className="flex-1 w-full min-h-0">
          {hasWeeklyData ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                <XAxis dataKey="day" stroke="#a3a3a3" fontSize={11} tickLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#111', borderColor: '#262626', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar name="Topics Done" dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar name="Resources Viewed" dataKey="viewed" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-text-secondary">
              No recent study activity recorded.
            </div>
          )}
        </div>
      </div>

      {/* Chart 2: Milestone Completion */}
      <div className="bg-bg-card border border-border-color rounded-xl p-5 shadow-md flex flex-col text-left h-[300px]">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="text-accent shrink-0" size={18} />
          <h3 className="text-sm font-bold font-heading text-text-primary">Milestone Progress</h3>
        </div>
        <div className="flex-1 w-full overflow-y-auto pr-1">
          {hasMilestoneData ? (
            <div style={{ height: `${Math.max(milestoneData.length * 38, 180)}px` }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={milestoneData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                  <XAxis type="number" domain={[0, 100]} stroke="#a3a3a3" fontSize={11} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" stroke="#a3a3a3" fontSize={10} tickLine={false} width={120} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111', borderColor: '#262626', borderRadius: '8px', fontSize: '12px' }}
                    formatter={(value) => [`${value}%`, 'Completed']}
                  />
                  <Bar name="Completion" dataKey="percent" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-text-secondary">
              Start progress on your roadmap milestones to see tracking details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
