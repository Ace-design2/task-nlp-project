import React, { useMemo, useRef, useEffect } from 'react';
import './ContributionGraph.css';

const ContributionGraph = ({ tasks = [], darkMode, timeRange = 'yearly' }) => {
  const scrollerRef = useRef(null);

  // 1. Generate Data based on timeRange
  const calendarData = useMemo(() => {
    const today = new Date();
    const data = [];
    let daysToGenerate = 365; // ~52-53 weeks

    if (timeRange === 'weekly') {
      daysToGenerate = 7;
    } else if (timeRange === 'monthly') {
      daysToGenerate = 30;
    }

    // Loop from daysToGenerate-1 down to 0 so the LAST element is today.
    for (let i = daysToGenerate - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      data.push({
        date: d,
        dateStr,
        monthIdx: d.getMonth(), // 0-11
        count: 0
      });
    }
    return data;
  }, [timeRange]);

  // 2. Map tasks to dates
  const graphData = useMemo(() => {
    const taskCounts = {};
    tasks.forEach(task => {
      if (task.date) {
        // Ensure date format matches YYYY-MM-DD
        const d = task.date.split('T')[0];
        taskCounts[d] = (taskCounts[d] || 0) + 1;
      }
    });

    return calendarData.map(day => ({
      ...day,
      count: taskCounts[day.dateStr] || 0
    }));
  }, [calendarData, tasks]);

  // 3. Helper to determine color intensity
  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 5) return 2;
    if (count <= 9) return 3;
    return 4;
  };

  // 4. Group by weeks for YEARLY grid layout
  // Also calculate Month Labels positions
  const { weeks, monthLabels } = useMemo(() => {
    if (timeRange !== 'yearly') return { weeks: [], monthLabels: [] };

    const weeksArr = [];
    let currentWeek = [];
    
    // Align start day (0=Sun)
    if (graphData.length > 0) {
        const startDate = graphData[0].date;
        const startDay = startDate.getDay(); 
        
        for (let i = 0; i < startDay; i++) {
            currentWeek.push(null); 
        }
    }

    graphData.forEach(day => {
        currentWeek.push(day);
        if (currentWeek.length === 7) {
            weeksArr.push(currentWeek);
            currentWeek = [];
        }
    });
    
    if (currentWeek.length > 0) {
        weeksArr.push(currentWeek);
    }

    // Logic for Month Labels:
    // Iterate through weeks. If a week contains the 1st of a month, OR simply the first appearance of a month index?
    // GitHub places "Jan", "Feb" above the column where that month starts roughly.
    const labels = [];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    let lastMonthIdx = -1;

    weeksArr.forEach((week, weekIndex) => {
        // Check the first valid day in this week to see if month changed
        const firstDay = week.find(d => d !== null);
        if (firstDay) {
            const mIdx = firstDay.monthIdx;
            if (mIdx !== lastMonthIdx) {
                // New Month started in this week (or previous week end, but simplifying to "Column" label)
                // Only simplify: If this column has the start of a month, label it?
                // Or: Label every change.
                labels.push({ text: months[mIdx], weekIndex });
                lastMonthIdx = mIdx;
            }
        }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [graphData, timeRange]);

  const totalContributions = graphData.reduce((acc, curr) => acc + curr.count, 0);

  // Auto-scroll to end on mount/update (for Yearly view on mobile)
  useEffect(() => {
    if (timeRange === 'yearly' && scrollerRef.current) {
        // Scroll to the far right
        scrollerRef.current.scrollLeft = scrollerRef.current.scrollWidth;
    }
  }, [timeRange, weeks]); // Run when weeks are computed

  // Render Logic
  const isGrid = timeRange === 'yearly';

  return (
    <div className={`contribution-graph-card ${darkMode ? 'dark-mode' : ''}`}>
      <div className="contribution-header">
        <span className="contribution-title">Consistency Streak</span>
        <span className="contribution-subtitle">
            {totalContributions} tasks in {timeRange === 'weekly' ? 'the last 7 days' : 
                                          timeRange === 'monthly' ? 'the last 30 days' : 'the last year'}
        </span>
      </div>
      
      <div className="graph-scroller" ref={scrollerRef}>
        {isGrid ? (
            // Yearly Grid View
                <div className="daily-grid-container">
                {/* Grid now contains labels relative to columns */}
                <div className="graph-grid">
                    {weeks.map((week, wIdx) => {
                        const labelObj = monthLabels.find(l => l.weekIndex === wIdx);
                        return (
                        <div key={wIdx} className="graph-column" style={{ position: 'relative' }}>
                            {labelObj && (
                                <span className="month-label-floating">{labelObj.text}</span>
                            )}
                            {week.map((day, dIdx) => {
                                if (!day) {
                                    return <div key={`empty-${dIdx}`} className="graph-cell empty"></div>;
                                }
                                const level = getLevel(day.count);
                                return (
                                    <div 
                                        key={day.dateStr} 
                                        className={`graph-cell level-${level}`}
                                        title={`${day.count} tasks on ${day.date.toDateString()}`}
                                    ></div>
                                );
                            })}
                        </div>
                        );
                    })}
                </div>
            </div>
        ) : (
            // Weekly/Monthly Linear View
            <div className={`graph-linear ${timeRange}`}>
                {graphData.map((day) => {
                    const level = getLevel(day.count);
                    const dayLabel = day.date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0); // S, M, T...
                    
                    return (
                        <div key={day.dateStr} className="linear-cell-wrapper">
                             <div 
                                className={`graph-cell level-${level}`}
                                title={`${day.count} tasks on ${day.date.toDateString()}`}
                            ></div>
                            {timeRange === 'weekly' && (
                                <span className="cell-label">{dayLabel}</span>
                            )}
                            {timeRange === 'monthly' && (
                                <span className="cell-label">{dayLabel}</span>
                            )}
                        </div>
                       
                    );
                })}
            </div>
        )}
      </div>
      
      <div className="graph-footer">
        <span className="legend-text">Less</span>
        <div className="legend-cells">
            <div className="graph-cell level-0"></div>
            <div className="graph-cell level-1"></div>
            <div className="graph-cell level-2"></div>
            <div className="graph-cell level-3"></div>
            <div className="graph-cell level-4"></div>
        </div>
        <span className="legend-text">More</span>
      </div>
    </div>
  );
};

export default ContributionGraph;
