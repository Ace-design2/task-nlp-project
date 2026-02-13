import React, { useState } from "react";
import "./CreativeCalendar.css";
import VuesaxIcon from "./VuesaxIcon";

const CreativeCalendar = ({ darkMode, tasks = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // --- Date Logic ---
  const daysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const startDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const getMonthName = (date) =>
    date.toLocaleString("default", { month: "long" });

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const isSameDay = (d1, d2String) => {
    if (!d2String) return false;
    const [y, m, d] = d2String.split("-").map(Number);
    const d2 = new Date(y, m - 1, d);
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  };

  const getTasksForDate = (date) => {
    return tasks.filter((task) => isSameDay(date, task.date));
  };

  const onDateClick = (day) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    setSelectedDate(newDate);
  };

  // --- Render Helpers ---
  const renderDays = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = startDayOfMonth(currentDate);
    const days = [];

    // Empty slots for prev month
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day-cell empty" />);
    }

    // Days
    const today = new Date();
    for (let i = 1; i <= totalDays; i++) {
      const thisDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        i
      );
      const dayTasks = getTasksForDate(thisDate);
      const isSelected =
        selectedDate &&
        thisDate.getDate() === selectedDate.getDate() &&
        thisDate.getMonth() === selectedDate.getMonth() &&
        thisDate.getFullYear() === selectedDate.getFullYear();

      const isToday =
        today.getDate() === i &&
        today.getMonth() === currentDate.getMonth() &&
        today.getFullYear() === currentDate.getFullYear();

      days.push(
        <div
          key={i}
          className={`calendar-day-cell ${isSelected ? "selected" : ""} ${
            isToday ? "today" : ""
          }`}
          onClick={() => onDateClick(i)}
        >
          <span>{i}</span>
          {/* Dots Indicator */}
          {dayTasks.length > 0 && (
            <div className="day-dots-container">
              {dayTasks.slice(0, 3).map(
                (
                  t,
                  idx // Max 3 dots
                ) => (
                  <div
                    key={idx}
                    className="day-dot"
                    style={{
                      backgroundColor: isSelected
                        ? "#fff"
                        : t.priorityColor || "var(--accent-color)",
                    }}
                  />
                )
              )}
              {dayTasks.length > 3 && (
                <div
                  className="day-dot"
                  style={{
                    opacity: 0.5,
                    backgroundColor: isSelected ? "#fff" : "gray",
                  }}
                />
              )}
            </div>
          )}
        </div>
      );
    }
    return days;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDayTasks = getTasksForDate(selectedDate);

  // Format selected date for header: "Monday, January 10"
  const formattedSelectedDate = selectedDate.toLocaleDateString("default", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className={`creative-calendar-container ${darkMode ? "dark-mode" : ""}`}
    >
      <div className="creative-calendar-fixed-section">
        {/* Header Controls */}
        <div className="calendar-creative-header">
          <button
            className="creative-nav-btn glass-back-btn"
            onClick={handlePrevMonth}
            aria-label="Previous Month"
            style={{
              marginRight: 8,
              width: 36, height: 36,
              border: 'none',
              color: darkMode ? '#fff' : '#000'
            }}
          >
            <VuesaxIcon name="arrow-left" variant="Linear" size={18} darkMode={darkMode} />
          </button>
          <div className="month-display">
            {getMonthName(currentDate)} {currentDate.getFullYear()}
          </div>
          <button
            className="creative-nav-btn glass-back-btn"
            onClick={handleNextMonth}
            aria-label="Next Month"
            style={{
              width: 36, height: 36,
              border: 'none',
              color: darkMode ? '#fff' : '#000'
            }}
          >
            <VuesaxIcon name="arrow-right" variant="Linear" size={18} darkMode={darkMode} />
          </button>
        </div>

        {/* Calendar Card */}
        <div className="creative-calendar-card">
          <div className="week-days-row">
            {weekDays.map((d) => (
              <div key={d} className="week-day-label">
                {d}
              </div>
            ))}
          </div>
          <div className="days-grid">{renderDays()}</div>
        </div>
      </div>

      {/* Selected Date Details */}
      <div className="selected-date-section">
        <div className="selected-date-header">{formattedSelectedDate}</div>

        {selectedDayTasks.length > 0 ? (
          selectedDayTasks.map((task) => (
            <div
              key={task.id}
              className={`calendar-task-card priority-${(
                task.priority || "low"
              ).toLowerCase()}`}
            >
              <div className="cal-task-time">{task.time || "All Day"}</div>
              <div className="cal-task-title">{task.title}</div>
              {task.completed && (
                <VuesaxIcon
                  name="tick-circle"
                  variant="Bold"
                  color="#00A231"
                  size={18}
                />
              )}
            </div>
          ))
        ) : (
          <div className="empty-day-state">No tasks planned for this day.</div>
        )}
      </div>
    </div>
  );
};

export default CreativeCalendar;
