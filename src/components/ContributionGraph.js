import React, { useMemo, useRef, useEffect, useState } from 'react';
import './ContributionGraph.css';
import VuesaxIcon from './VuesaxIcon';
import html2canvas from 'html2canvas';

const ContributionGraph = ({ tasks = [], darkMode, timeRange = 'yearly', user, userProfile, stats }) => {
  const scrollerRef = useRef(null);
  const shareRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);
  const [base64Photo, setBase64Photo] = useState(null);

  useEffect(() => {
     const fetchPhoto = async () => {
         const url = userProfile?.photoBase64 || userProfile?.photoURL || user?.photoURL;
         if (!url) return;
         
         // If it's already a base64 string, use it directly
         if (url.startsWith('data:image/')) {
             setBase64Photo(url);
             return;
         }

         try {
             // Attempt to fetch the image natively and convert it to a local Base64 blob
             // This can bypass rendering issues since the final img src becomes a local data URI
             const urlWithBust = `${url}${url.includes('?') ? '&' : '?'}t=${new Date().getTime()}`;
             const res = await fetch(urlWithBust, { mode: 'cors' });
             const blob = await res.blob();
             const reader = new FileReader();
             reader.onloadend = () => {
                 setBase64Photo(reader.result);
             };
             reader.readAsDataURL(blob);
         } catch (e) {
             console.warn("Failed to fetch external profile image, falling back to raw URL", e);
             // If fetch fails (usually strict CORS), fallback to just the raw URL
             // html2canvas might still fail to proxy it, but it preserves regular render
             setBase64Photo(url);
         }
     };
     
     if (userProfile?.photoBase64 || userProfile?.photoURL || user?.photoURL) {
         fetchPhoto();
     }
  }, [userProfile, user]);

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

  const mostProductiveDay = useMemo(() => {
    if (!graphData || graphData.length === 0) return null;
    return graphData.reduce((max, current) => (current.count > max.count ? current : max), graphData[0]);
  }, [graphData]);

  const handleShare = async () => {
    if (!shareRef.current) return;
    setIsSharing(true);
    try {
      // Container is now permanently rendered off-screen so the image loads natively before we capture
      
      // Ensure all images within the container are fully loaded before capturing
      const images = Array.from(shareRef.current.querySelectorAll('img'));
      await Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = resolve; // Resolve on error too, so we don't block the share entirely
          });
      }));
      
      // Give the browser time to render local SVGs and the final tree layout
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const canvas = await html2canvas(shareRef.current, {
        backgroundColor: '#1E1E1E', // Dark mode background
        scale: 2, // Higher quality
        useCORS: true, // Attempt to load cross-origin images
        logging: true, // Enable logging to see what fails
        onclone: (clonedDoc) => {
            const clonedShareNode = clonedDoc.getElementById('astra-share-container');
            if (clonedShareNode) {
                // Reset the off-screen positioning inside the cloning environment
                clonedShareNode.style.position = 'static';
                clonedShareNode.style.left = 'auto';
                clonedShareNode.style.top = 'auto';
                clonedShareNode.style.zIndex = '1';
                clonedShareNode.style.opacity = '1';
            }
        }
      });

      // Fallback implementation to try blob first, then DataUrl
      try {
          const blob = await new Promise((resolve, reject) => {
              canvas.toBlob((b) => {
                  if (b) resolve(b);
                  else reject(new Error("Canvas toBlob failed"));
              }, 'image/png');
          });
          
          if (navigator.canShare && navigator.canShare({ files: [new File([blob], 'streak.png', { type: 'image/png' })] })) {
              const file = new File([blob], 'streak.png', { type: 'image/png' });
              await navigator.share({
                title: 'My Consistency Streak',
                text: 'Check out my consistency streak on Astra to-do!',
                files: [file]
              });
          } else {
            // Fallback: download
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = 'consistency-streak.png';
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          }
      } catch (err) {
         console.warn("Blob share failed, falling back to data URL download", err);
         const url = canvas.toDataURL('image/png');
         const link = document.createElement('a');
         link.download = 'consistency-streak.png';
         link.href = url;
         link.click();
      }

    } catch (error) {
      console.error('Error generating share image:', error);
      alert('Failed to generate share image.');
    } finally {
      setIsSharing(false);
    }
  };

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
      <div className="contribution-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
            <span className="contribution-title">Consistency Streak</span>
            <span className="contribution-subtitle">
                {totalContributions} tasks in {timeRange === 'weekly' ? 'the last 7 days' : 
                                              timeRange === 'monthly' ? 'the last 30 days' : 'the last year'}
            </span>
        </div>
        <button 
            onClick={handleShare} 
            disabled={isSharing}
            style={{ 
                background: 'transparent', 
                border: darkMode ? '1px solid #333' : '1px solid #ddd', 
                borderRadius: '12px', 
                padding: '8px', 
                cursor: isSharing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: isSharing ? 0.5 : 1,
                color: darkMode ? '#fff' : '#000',
                flexShrink: 0,
                marginLeft: '12px'
            }}
            title="Share Streak"
        >
            <VuesaxIcon name={isSharing ? "clock" : "export"} variant="Linear" size={20} color="currentColor" />
        </button>
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

      {/* Hidden Container for Export - permanently rendered off-screen to ensure fonts and images are loaded */}
      <div 
        id="astra-share-container"
        ref={shareRef} 
        style={{ 
            position: 'absolute', 
            left: '0',
            top: '0',
            zIndex: '-100',
            opacity: '0.001',
            pointerEvents: 'none',
            width: 'max-content', 
            minWidth: '800px',
            padding: '40px', 
            background: '#1E1E1E', 
            color: '#fff', 
            borderRadius: '24px',
            fontFamily: 'Inter, sans-serif',
            boxSizing: 'border-box'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
            <div>
                <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 600 }}>Consistency Streak</h1>
                <p style={{ margin: '8px 0 0 0', fontSize: '18px', color: '#888' }}>
                    {totalContributions} tasks in {timeRange === 'weekly' ? 'the last 7 days' : 
                                                  timeRange === 'monthly' ? 'the last 30 days' : 'the last year'}
                </p>
            </div>
            {(userProfile?.photoURL || user?.photoURL) ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{userProfile?.displayName || user?.displayName || 'Astra User'}</div>
                        <div style={{ fontSize: '14px', color: '#888' }}>Astra to-do</div>
                    </div>
                    <img 
                        src={base64Photo || userProfile?.photoBase64 || userProfile?.photoURL || user?.photoURL} 
                        alt="Profile" 
                        crossOrigin="anonymous"
                        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '16px', fontWeight: 600 }}>{userProfile?.displayName || user?.displayName || 'Astra User'}</div>
                        <div style={{ fontSize: '14px', color: '#888' }}>Astra to-do</div>
                    </div>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold' }}>
                        {(userProfile?.displayName || user?.displayName || 'A')?.charAt(0)?.toUpperCase()}
                    </div>
                </div>
            )}
        </div>

        <div style={{ marginBottom: '40px', background: '#121212', padding: '24px', borderRadius: '16px' }}>
            {isGrid ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                    {weeks.map((week, wIdx) => {
                        return (
                        <div key={`share-${wIdx}`} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {week.map((day, dIdx) => {
                                if (!day) {
                                    return <div key={`share-empty-${dIdx}`} style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'transparent' }}></div>;
                                }
                                const level = getLevel(day.count);
                                let bgColor = '#222';
                                if (level === 1) bgColor = '#4A1D20';
                                if (level === 2) bgColor = '#7A1C20';
                                if (level === 3) bgColor = '#A5181F';
                                if (level === 4) bgColor = '#C1121F';
                                return <div key={`share-day-${day.dateStr}`} style={{ width: '12px', height: '12px', borderRadius: '3px', background: bgColor }}></div>;
                            })}
                        </div>
                        );
                    })}
                </div>
            ) : (
                <div style={{ display: 'flex', gap: timeRange === 'weekly' ? '24px' : '12px', width: '100%', justifyContent: 'space-between' }}>
                    {graphData.map((day) => {
                        const level = getLevel(day.count);
                        const dayLabel = day.date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
                        let bgColor = '#222';
                        if (level === 1) bgColor = '#4A1D20';
                        if (level === 2) bgColor = '#7A1C20';
                        if (level === 3) bgColor = '#A5181F';
                        if (level === 4) bgColor = '#C1121F';
                        
                        const isWeekly = timeRange === 'weekly';
                        return (
                            <div key={`share-day-${day.dateStr}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isWeekly ? '16px' : '8px', flex: 1 }}>
                                <div style={{ width: '100%', maxWidth: isWeekly ? '80px' : '24px', aspectRatio: '1/1', borderRadius: isWeekly ? '16px' : '6px', background: bgColor }}></div>
                                <span style={{ fontSize: isWeekly ? '20px' : '12px', color: '#888' }}>{isWeekly ? day.date.toLocaleDateString('en-US', { weekday: 'short' }) : dayLabel}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
        
        {stats && (
            <div style={{ display: 'flex', gap: '24px', marginBottom: '40px' }}>
                <div style={{ flex: 1, background: '#121212', padding: '24px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Tasks ({stats.periodLabel || 'Total'})</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.total || 0}</div>
                </div>
                <div style={{ flex: 1, background: '#121212', padding: '24px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Completion Rate</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.rate || 0}%</div>
                </div>
                <div style={{ flex: 1, background: '#121212', padding: '24px', borderRadius: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#888', marginBottom: '8px' }}>Tasks Today</div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.tasksTodayCount || 0}</div>
                </div>
            </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
             <div>
                <div style={{ fontSize: '14px', color: '#888', marginBottom: '4px' }}>Most Productive Day</div>
                <div style={{ fontSize: '20px', fontWeight: 600 }}>
                    {mostProductiveDay ? `${mostProductiveDay.count} tasks on ${mostProductiveDay.date.toLocaleDateString()}` : 'N/A'}
                </div>
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/logo.svg" alt="Astra Logo" crossOrigin="anonymous" style={{ width: '32px', height: '32px' }} />
                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>Astra to-do</span>
             </div>
        </div>
      </div>
    </div>
  );
};

export default ContributionGraph;
