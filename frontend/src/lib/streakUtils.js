/**
 * Calculates current and longest study streaks from an array of activity date strings.
 */
export function calculateStreaks(activityDates) {
  const dateSet = new Set(activityDates);
  const today = new Date();
  let current = 0;
  let cursor = new Date(today);

  const todayStr = today.toISOString().split('T')[0];
  if (!dateSet.has(todayStr)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateSet.has(cursor.toISOString().split('T')[0])) {
    current++;
    cursor.setDate(cursor.getDate() - 1);
  }

  let longest = 0;
  let run = 0;
  let prevDate = null;

  for (const dateStr of [...activityDates].sort()) {
    const d = new Date(dateStr);
    if (prevDate && (d - prevDate) / 86400000 === 1) {
      run++;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prevDate = d;
  }

  return { current, longest };
}
