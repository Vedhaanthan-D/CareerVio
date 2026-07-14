import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { fetchStudyActivity } from '../lib/roadmapQueries';
import { calculateStreaks } from '../lib/streakUtils';
import { useAuth } from './AuthContext';

const StreakContext = createContext({ current: 0, longest: 0, celebrating: false, refreshStreak: () => {} });

/** Provides live streak state and a refreshStreak() trigger to the whole app. */
export const StreakProvider = ({ children }) => {
  const { user } = useAuth();
  const [current, setCurrent] = useState(0);
  const [longest, setLongest] = useState(0);
  const [celebrating, setCelebrating] = useState(false);

  // Holds the most recently known streak so comparison survives across async gaps
  const prevCurrentRef = useRef(0);

  const refreshStreak = useCallback(async () => {
    if (!user?.id) return;
    try {
      const activity = await fetchStudyActivity(user.id);
      const { current: newCurrent, longest: newLongest } = calculateStreaks(
        activity.map((a) => a.activity_date)
      );

      // Celebrate only when the streak genuinely increased
      if (prevCurrentRef.current > 0 && newCurrent > prevCurrentRef.current) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 700);
      }

      prevCurrentRef.current = newCurrent;
      setCurrent(newCurrent);
      setLongest(newLongest);
    } catch (err) {
      console.error('[StreakContext] Failed to refresh streak:', err);
    }
  }, [user?.id]);

  // Populate streak on first mount and whenever the logged-in user changes
  useEffect(() => {
    refreshStreak();
  }, [refreshStreak]);

  return (
    <StreakContext.Provider value={{ current, longest, celebrating, refreshStreak }}>
      {children}
    </StreakContext.Provider>
  );
};

/** Returns { current, longest, celebrating, refreshStreak } from the nearest StreakProvider. */
export const useStreak = () => useContext(StreakContext);
