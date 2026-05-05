import { useState, useMemo } from 'react';

export const useRecommendations = (tasks) => {
  const [dismissed, setDismissed] = useState(() => {
    try {
      const saved = localStorage.getItem('dismissedRecommendations');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const newFormat = {};
          parsed.forEach(item => {
            if (typeof item === 'string') {
              newFormat[item] = Date.now();
            }
          });
          return newFormat;
        }
        return parsed || {};
      }
      return {};
    } catch (e) {
      return {};
    }
  });

  const dismissRecommendation = (title) => {
    const updated = { ...dismissed, [title.toLowerCase()]: Date.now() };
    setDismissed(updated);
    localStorage.setItem('dismissedRecommendations', JSON.stringify(updated));
  };

  const recommendations = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0-6

    const stats = {};

    tasks.forEach(task => {
      if (!task.title) return;
      const title = task.title.trim();
      const titleLower = title.toLowerCase();

      if (!stats[titleLower]) {
        stats[titleLower] = {
          title,
          count: 0,
          hours: [],
          days: [],
          lastCompleted: null,
          isCurrentlyActive: false
        };
      }

      stats[titleLower].count += 1;

      // Skip recommending tasks that are already uncompleted (active)
      if (task.completed === false) {
        stats[titleLower].isCurrentlyActive = true;
      }

      // Time tracking based on completedAt or createdAt
      let taskDate = null;
      if (task.completedAt) {
        taskDate = new Date(task.completedAt);
        if (!isNaN(taskDate)) stats[titleLower].lastCompleted = taskDate;
      } else if (task.createdAt) {
        taskDate = new Date(task.createdAt);
      }

      if (taskDate && !isNaN(taskDate)) {
        stats[titleLower].hours.push(taskDate.getHours());
        stats[titleLower].days.push(taskDate.getDay());
      }
    });

    const suggestions = [];

    Object.values(stats).forEach(stat => {
      const dismissedTimestamp = dismissed[stat.title.toLowerCase()];
      if (dismissedTimestamp) {
        const hoursSinceDismissed = (now.getTime() - dismissedTimestamp) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          return;
        }
      }

      if (stat.isCurrentlyActive) {
        return;
      }

      let score = 0;
      let reason = '';

      // 1. Frequency
      if (stat.count >= 3) {
        score += stat.count * 2;
        reason = `You've done this ${stat.count} times recently`;
      }

      // 2. Recurring (Day of week)
      const matchingDays = stat.days.filter(d => d === currentDay);
      if (matchingDays.length >= 3) {
        score += matchingDays.length * 2;
        reason = `You often do this on ${now.toLocaleDateString('en-US', { weekday: 'long' })}s`;
      }

      // 3. Time-Based
      const matchingHours = stat.hours.filter(h => Math.abs(h - currentHour) <= 1);
      if (matchingHours.length > 0) {
        score += matchingHours.length * 2;
        // Time based reason takes precedence if it's currently that time
        reason = `You usually do this around this time`; 
      }

      // 4. Recency
      if (stat.lastCompleted) {
        const daysSince = (now - stat.lastCompleted) / (1000 * 60 * 60 * 24);
        if (daysSince <= 7) {
          score += 1.5; 
        }
      }

      if (score > 0 && reason) {
        suggestions.push({
          title: stat.title,
          reason,
          score
        });
      }
    });

    suggestions.sort((a, b) => b.score - a.score);

    // Limit to 3 items
    return suggestions.slice(0, 3);
  }, [tasks, dismissed]);

  return { recommendations, dismissRecommendation };
};
