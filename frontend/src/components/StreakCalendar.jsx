import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function intensityClass(count) {
  if (count === 0) return 'bg-bg-secondary/40 border-border-color text-text-secondary/50';
  if (count === 1) return 'bg-accent/15 border-accent/20 text-accent font-medium';
  if (count <= 3) return 'bg-accent/40 border-accent/50 text-black font-semibold';
  return 'bg-accent border-accent text-black font-bold';
}

/**
 * Renders a compact monthly calendar heatmap showing study activities per day,
 * with navigation controls to view previous/next months.
 */
export default function StreakCalendar({ activityData }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const activityMap = new Map(
    activityData.map(a => [a.activity_date, a.subtopics_completed + a.resources_viewed])
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIdx = new Date(year, month, 1).getDay();

  // Create list of cells
  const cells = [];
  // 1. Pad with empty slots for the weekday alignment
  for (let i = 0; i < firstDayIdx; i++) {
    cells.push(null);
  }
  // 2. Add actual days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(d);
  }

  return (
    <div className="flex flex-col gap-2.5 w-[210px] select-none text-left">
      {/* Month Selector Header */}
      <div className="flex justify-between items-center bg-bg-secondary/50 rounded-lg p-1 border border-border-color/30">
        <button
          onClick={prevMonth}
          className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          type="button"
          title="Previous Month"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[10px] font-bold font-heading text-text-primary">
          {MONTH_NAMES[month]} {year}
        </span>
        <button
          onClick={nextMonth}
          className="p-1 hover:bg-white/5 rounded text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          type="button"
          title="Next Month"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Weekday Labels */}
        <div className="grid grid-cols-7 gap-1 mb-1 text-center">
          {WEEKDAYS.map(w => (
            <span key={w} className="text-[8px] font-bold text-text-secondary/60 uppercase">
              {w}
            </span>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="w-[26px] h-[26px]" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const count = activityMap.get(dateStr) || 0;

            return (
              <div
                key={`day-${day}`}
                title={`${dateStr}: ${count} study activities`}
                className={`w-[26px] h-[26px] rounded border flex items-center justify-center text-[9px] transition-all duration-200 ${intensityClass(count)}`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
