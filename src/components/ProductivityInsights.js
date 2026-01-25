import React, { useMemo } from "react";
import "./ProductivityInsights.css";
import VuesaxIcon from "./VuesaxIcon";

const ProductivityInsights = ({ tasks = [], darkMode }) => {
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
          count: 0, // Will fill later
        });
        last7DaysSet.add(dateStr);
      }

      // Filter tasks for this period
      filteredTasks = tasks.filter((t) => t.date && last7DaysSet.has(t.date));

      // Fill Chart Data
      chartData = chartData.map((d) => ({
        ...d,
        count: tasks.filter((t) => t.completed && t.date === d.dateStr).length,
      }));
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
          count: 0,
        });
        last30DaysSet.add(dateStr);
      }

      filteredTasks = tasks.filter((t) => t.date && last30DaysSet.has(t.date));

      chartData = chartData.map((d) => ({
        ...d,
        count: tasks.filter((t) => t.completed && t.date === d.dateStr).length,
      }));
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
          count: 0,
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
      chartData = chartData.map((d) => ({
        ...d,
        count: tasks.filter(
          (t) => t.completed && t.date && t.date.startsWith(d.monthStr),
        ).length,
      }));
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
    <div className={`insights-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="insights-header">
        <h2 className="insights-title">Usage & Insights</h2>
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
            <span className="chart-title">Weekly Activity</span>
            <VuesaxIcon
              name="calendar-1"
              size={20}
              color={darkMode ? "#FFFFFF" : "#292D32"}
              variant="Bold"
            />
          </div>

          <div className="bar-chart-container">
            {stats.chartData.map((data, idx) => (
              <div key={idx} className="bar-column">
                <div
                  className={`bar-visual ${data.isToday ? "active" : ""}`}
                  style={{
                    height: `${Math.min(100, (data.count / Math.max(1, Math.max(...stats.chartData.map((d) => d.count)))) * 100)}%`,
                  }}
                ></div>
                {/* Fixed height scaling to be relative to Max count instead of arbitrary 12 */}
                <span className="bar-tooltip">{data.count} Tasks</span>
                <span className="bar-label">{data.label}</span>
              </div>
            ))}
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
    </div>
  );
};

export default ProductivityInsights;
