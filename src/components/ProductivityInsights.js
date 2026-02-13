import React, { useMemo } from "react";
import "./ProductivityInsights.css";
import VuesaxIcon from "./VuesaxIcon";
import ContributionGraph from "./ContributionGraph";

const ProductivityInsights = ({ tasks = [], darkMode, onDeleteCourse }) => {
  const [timeRange, setTimeRange] = React.useState("weekly"); // 'weekly', 'monthly', 'yearly'

  // Statistics Calculations
  const stats = useMemo(() => {
    const todayDate = new Date();

    let chartData = []; // { label, count, isActive }
    let filteredTasks = [];
    let periodLabel = "This Week";

    if (timeRange === "weekly") {
      periodLabel = "This Week";
      // Last 7 Days Logic
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const last7DaysSet = new Set();

      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        chartData.push({
          label: days[d.getDay()],
          dateStr: dateStr,
          isToday: i === 0,
          totalCount: 0,
          completedCount: 0,
        });
        last7DaysSet.add(dateStr);
      }

      // Filter tasks for this period
      filteredTasks = tasks.filter((t) => t.date && last7DaysSet.has(t.date));

      // Fill Chart Data
      chartData = chartData.map((d) => {
        const tasksForDay = tasks.filter((t) => t.date === d.dateStr);
        return {
          ...d,
          totalCount: tasksForDay.length,
          completedCount: tasksForDay.filter((t) => t.completed).length,
        };
      });
    } else if (timeRange === "monthly") {
      periodLabel = "This Month";
      // Last 30 Days Logic
      const last30DaysSet = new Set();

      // We will show just simple daily bars for last 30 days
      for (let i = 29; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setDate(d.getDate() - i);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        // Only show label every 5 days to avoid crowding
        const showLabel = i % 5 === 0 || i === 0;

        chartData.push({
          label: showLabel ? `${d.getDate()}` : "",
          dateStr: dateStr,
          isToday: i === 0,
          totalCount: 0,
          completedCount: 0,
        });
        last30DaysSet.add(dateStr);
      }

      filteredTasks = tasks.filter((t) => t.date && last30DaysSet.has(t.date));

      chartData = chartData.map((d) => {
        const tasksForDay = tasks.filter((t) => t.date === d.dateStr);
        return {
          ...d,
          totalCount: tasksForDay.length,
          completedCount: tasksForDay.filter((t) => t.completed).length,
        };
      });
    } else if (timeRange === "yearly") {
      periodLabel = "This Year";
      // Last 12 Months Logic
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const last12MonthsSet = new Set(); // store "YYYY-MM"

      for (let i = 11; i >= 0; i--) {
        const d = new Date(todayDate);
        d.setMonth(d.getMonth() - i);
        const m = d.getMonth();
        const y = d.getFullYear();
        const monthStr = `${y}-${String(m + 1).padStart(2, "0")}`;

        chartData.push({
          label: months[m],
          monthStr: monthStr,
          isToday: i === 0, // Current month
          totalCount: 0,
          completedCount: 0,
        });
        last12MonthsSet.add(monthStr);
      }

      // Filter tasks. Need to match YYYY-MM prefix of task.date
      filteredTasks = tasks.filter((t) => {
        if (!t.date) return false;
        const prefix = t.date.substring(0, 7); // YYYY-MM
        return last12MonthsSet.has(prefix);
      });

      // Fill Chart Data
      chartData = chartData.map((d) => {
        const tasksForMonth = tasks.filter(
          (t) => t.date && t.date.startsWith(d.monthStr),
        );
        return {
          ...d,
          totalCount: tasksForMonth.length,
          completedCount: tasksForMonth.filter((t) => t.completed).length,
        };
      });
    }

    // 1. Total Tasks (Filtered)
    const total = filteredTasks.length;

    // 2. Completion Rate (Filtered)
    const completed = filteredTasks.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // 3. Priority Distribution (Global - Keep as global context? Or filtered?)
    // User asked to change timeframe, usually implies ALL stats update.
    // Let's filter priority based on the view too for consistency.
    const high = filteredTasks.filter((t) => t.priority === "high").length;
    const medium = filteredTasks.filter((t) => t.priority === "medium").length;
    const low = filteredTasks.filter(
      (t) => t.priority === "low" || !t.priority,
    ).length;

    const highPct = total > 0 ? (high / total) * 100 : 0;
    const mediumPct = total > 0 ? (medium / total) * 100 : 0;
    const lowPct = total > 0 ? (low / total) * 100 : 0;

    // 4. Tasks Today (Always Today)
    const tYear = todayDate.getFullYear();
    const tMonth = String(todayDate.getMonth() + 1).padStart(2, "0");
    const tDay = String(todayDate.getDate()).padStart(2, "0");
    const todayStr = `${tYear}-${tMonth}-${tDay}`;
    const tasksTodayCount = tasks.filter((t) => t.date === todayStr).length;

    return {
      total,
      completed,
      rate,
      highPct,
      mediumPct,
      lowPct,
      chartData,
      tasksTodayCount,
      periodLabel,
    };
  }, [tasks, timeRange]);

  return (
    <div
      className={`insights-container ${darkMode ? "dark-mode" : ""}`}
      style={{ padding: "12px 12px 112px 12px", boxSizing: "border-box" }}
    >
      <div className="insights-header">
        <h1 className="insights-title">Usage & Insights</h1>
        <p className="insights-subtitle">
          Track your productivity trends and task habits.
        </p>
      </div>

      {/* Timeframe Toggle */}
      <div className="timeframe-toggle">
        <button
          className={`toggle-item ${timeRange === "weekly" ? "active" : ""}`}
          onClick={() => setTimeRange("weekly")}
        >
          Weekly
        </button>
        <button
          className={`toggle-item ${timeRange === "monthly" ? "active" : ""}`}
          onClick={() => setTimeRange("monthly")}
        >
          Monthly
        </button>
        <button
          className={`toggle-item ${timeRange === "yearly" ? "active" : ""}`}
          onClick={() => setTimeRange("yearly")}
        >
          Yearly
        </button>
      </div>

      {/* Contribution Graph - Adapts to timeRange */}
      <ContributionGraph
        tasks={tasks}
        darkMode={darkMode}
        timeRange={timeRange}
      />

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ background: "#EAEEF1", color: "#333" }}
          >
            <VuesaxIcon name="task-square" variant="bold" />
          </div>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Tasks ({stats.periodLabel})</div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ background: "#E6F7ED", color: "#00A231" }}
          >
            <VuesaxIcon name="verify" variant="bold" />
          </div>
          <div className="stat-value">{stats.rate}%</div>
          <div className="stat-label">
            Completion Rate (
            {stats.periodLabel === "This Week"
              ? "Week"
              : stats.periodLabel === "This Month"
                ? "Month"
                : "Year"}
            )
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon-wrapper"
            style={{ background: "#FFF4E5", color: "#FFB800" }}
          >
            <VuesaxIcon name="activity" variant="bold" />
          </div>
          <div className="stat-value">{stats.tasksTodayCount || 0}</div>
          <div className="stat-label">Tasks Today</div>
        </div>
      </div>

      <div className="charts-section">
        {/* Weekly Activity Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Activity ({stats.periodLabel})</span>
            <VuesaxIcon
              name="calendar-1"
              size={20}
              color={darkMode ? "#FFFFFF" : "#292D32"}
              variant="Bold"
            />
          </div>

          <div className="bar-chart-container">
            {stats.chartData.map((data, idx) => {
              const maxVal = Math.max(
                1,
                Math.max(...stats.chartData.map((d) => d.totalCount)),
              );
              const heightPct = Math.min(100, (data.totalCount / maxVal) * 100);
              const fillPct =
                data.totalCount > 0
                  ? (data.completedCount / data.totalCount) * 100
                  : 0;

              return (
                <div key={idx} className="bar-column">
                  <div
                    className={`bar-visual ${data.isToday ? "active" : ""}`}
                    style={{
                      height: `${heightPct}%`,
                    }}
                  >
                    <div
                      className="bar-fill"
                      style={{ height: `${fillPct}%` }}
                    ></div>
                  </div>
                  {/* Fixed height scaling to be relative to Max count instead of arbitrary 12 */}
                  <span className="bar-tooltip">
                    {data.completedCount} / {data.totalCount} Tasks
                  </span>
                  <span className="bar-label">{data.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Tasks by Priority</span>
            <VuesaxIcon
              name="flag"
              size={20}
              color={darkMode ? "#FFFFFF" : "#292D32"}
              variant="Bold"
            />
          </div>

          <div className="priority-dist-container">
            {stats.highPct > 0 && (
              <div
                className="priority-bar p-high"
                style={{ width: `${stats.highPct}%` }}
              ></div>
            )}
            {stats.mediumPct > 0 && (
              <div
                className="priority-bar p-medium"
                style={{ width: `${stats.mediumPct}%` }}
              ></div>
            )}
            {stats.lowPct > 0 && (
              <div
                className="priority-bar p-low"
                style={{ width: `${stats.lowPct}%` }}
              ></div>
            )}
          </div>

          <div className="priority-legend">
            <div className="legend-item">
              <div className="dot p-high"></div> High
            </div>
            <div className="legend-item">
              <div className="dot p-medium"></div> Medium
            </div>
            <div className="legend-item">
              <div className="dot p-low"></div> Low / Normal
            </div>
          </div>
          </div>
        </div>

      {/* Study Section */}
      <StudySection tasks={tasks} onDeleteCourse={onDeleteCourse} darkMode={darkMode} />
    </div>
  );
};

const StudySection = ({ tasks, onDeleteCourse, darkMode }) => {
    const [selectedCourse, setSelectedCourse] = React.useState(null);

    const courses = useMemo(() => {
        const map = {};
        tasks.forEach(t => {
            if (!t.title.startsWith("Study: ")) return;
            
            // Parse "Study: Course - Topic" vs "Study: Topic"
            let courseName = "";
            let topicName = "";
            
            const content = t.title.replace("Study: ", "");
            
            // Prioritize "Course | Topic" format (New)
            if (content.includes(" | ")) {
                const parts = content.split(" | ");
                courseName = parts[0].trim();
                topicName = parts.slice(1).join(" | ").trim();
            } 
            // Fallback to "Course - Topic" (Old)
            else if (content.includes(" - ")) {
                const parts = content.split(" - ");
                courseName = parts[0].trim();
                topicName = parts.slice(1).join(" - ").trim();
            } else {
                courseName = content; // Fallback
                topicName = content;
            }

            if (!map[courseName]) map[courseName] = { name: courseName, total: 0, completed: 0, tasks: [] };
            map[courseName].total++;
            if (t.completed) map[courseName].completed++;
            
            // Store task with parsed topic name for display
            map[courseName].tasks.push({ ...t, parsedTopic: topicName });
        });
        return Object.values(map);
    }, [tasks]);

    const selectedCourseData = useMemo(() => {
        if (!selectedCourse) return null;
        const course = courses.find(c => c.name === selectedCourse);
        if (!course) return null;
        return {
            ...course,
            tasks: [...course.tasks].sort((a, b) => new Date(a.date) - new Date(b.date))
        };
    }, [selectedCourse, courses]);

    if (courses.length === 0) return null;

    return (
        <div className="study-section" style={{ marginTop: 12, position: 'relative' }}>
            <div className="insights-header" style={{ marginBottom: 12 }}>
                <h2 className="insights-title" style={{ fontSize: 18 }}>Study Progress</h2>
            </div>
            
            <div className="courses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {courses.map(course => {
                    const progress = Math.round((course.completed / course.total) * 100);
                    return (
                        <div 
                            key={course.name} 
                            className="course-card" 
                            onClick={() => setSelectedCourse(course.name)}
                            style={{
                                background: darkMode ? '#1e1e1e' : '#fff',
                                padding: 16,
                                borderRadius: 16,
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 12,
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: 10,
                                        background: 'linear-gradient(135deg, #FF4B4B 0%, #C1121F 100%)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <VuesaxIcon name="book" variant="Bold" size={16} color="#fff" />
                                    </div>
                                    <span style={{ fontWeight: 600, fontSize: 15 }}>{course.name}</span>
                                </div>
                                
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation(); 
                                        if (window.confirm(`Delete all study tasks for "${course.name}"?`)) {
                                            if (onDeleteCourse) onDeleteCourse(course.name);
                                        }
                                    }}
                                    style={{ background: 'none', border:'none', cursor:'pointer', opacity: 0.5 }}
                                >
                                    <VuesaxIcon name="trash" size={16} color={darkMode ? '#ff4b4b' : '#ff4b4b'} />
                                </button>
                            </div>

                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, opacity: 0.7 }}>
                                    <span>Progress</span>
                                    <span>{progress}%</span>
                                </div>
                                <div style={{ width: '100%', height: 6, background: darkMode ? '#333' : '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: '#C1121F', borderRadius: 3 }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* DETAIL VIEW OVERLAY */}
            {selectedCourseData && (
                 <div style={{
                     position: 'fixed', 
                     top: 0, left: 0, right: 0, bottom: 0,
                     background: darkMode ? '#121212' : '#f9f9f9',
                     zIndex: 100,
                     padding: 20,
                     overflowY: 'auto',
                     display: 'flex',
                     flexDirection: 'column'
                 }}>
                     <div style={{ maxWidth: 800, margin: '0 auto', width: '100%' }}>
                        <button 
                            onClick={() => setSelectedCourse(null)}
                            className="glass-back-btn"
                            style={{ 
                                border: 'none', 
                                marginBottom: 20,
                                color: darkMode ? '#fff' : '#000',
                            }}
                        >
                            <VuesaxIcon name="arrow-left" size={24} color={darkMode ? '#fff' : '#000'} />
                        </button>

                        <div style={{ 
                            background: darkMode ? '#1e1e1e' : '#fff', 
                            padding: 24, borderRadius: 24,
                            marginBottom: 24,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 20 }}>
                                <div>
                                    <h1 style={{ fontSize: 24, margin: '0 0 8px 0' }}>{selectedCourseData.name}</h1>
                                    <div style={{ opacity: 0.6, fontSize: 14 }}>
                                        {selectedCourseData.completed} / {selectedCourseData.total} Tasks Completed
                                    </div>
                                </div>
                                <div style={{ 
                                    width: 48, height: 48, borderRadius: 16,
                                    background: 'linear-gradient(135deg, #FF4B4B 0%, #C1121F 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <VuesaxIcon name="book" variant="Bold" size={24} color="#fff" />
                                </div>
                            </div>

                            <div style={{ marginBottom: 10 }}>
                                <div style={{ width: '100%', height: 8, background: darkMode ? '#333' : '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
                                    <div style={{ 
                                        width: `${Math.round((selectedCourseData.completed / selectedCourseData.total) * 100)}%`, 
                                        height: '100%', background: '#C1121F', borderRadius: 4 
                                    }} />
                                </div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: 18, marginBottom: 16 }}>Course Schedule</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {selectedCourseData.tasks.map((task, idx) => (
                                <div key={task.id || idx} style={{
                                    background: darkMode ? '#1e1e1e' : '#fff',
                                    padding: 16, borderRadius: 16,
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    opacity: task.completed ? 0.6 : 1
                                }}>
                                    <div style={{
                                        width: 24, height: 24, borderRadius: 8,
                                        border: `2px solid ${task.completed ? '#00A231' : (darkMode ? '#444' : '#ddd')}`,
                                        background: task.completed ? '#00A231' : 'transparent',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        {task.completed && <VuesaxIcon name="tick-circle" variant="Bold" size={14} color="#fff" />}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ 
                                            fontSize: 15, fontWeight: 500,
                                            textDecoration: task.completed ? 'line-through' : 'none'
                                        }}>
                                            {task.parsedTopic}
                                        </div>
                                        <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>
                                            {task.date} • {task.time || 'All Day'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     </div>
                 </div>
            )}
        </div>
    );
};

export default ProductivityInsights;

