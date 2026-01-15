import React, { useState } from "react";
import "./Calendar.css";

const Calendar = ({ darkMode, tasks = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const startDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getMonthName = (date) => {
    return date.toLocaleString("default", { month: "long" });
  };

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
    // Parse YYYY-MM-DD strictly as local time
    const [y, m, d] = d2String.split("-").map(Number);
    // Note: new Date(y, m-1, d) creates a date at 00:00:00 Local Time
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

  const renderDays = () => {
    const days = [];
    const totalDays = daysInMonth(currentDate);
    const startDay = startDayOfMonth(currentDate);

    // Initial empty slots
    for (let i = 0; i < startDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="calendar-day-card empty"></div>
      );
    }

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

      days.push(
        <div
          key={i}
          className={`calendar-day-card ${darkMode ? "dark-mode" : ""} ${
            isSelected ? "selected" : ""
          }`}
          onClick={() => onDateClick(i)}
        >
          <div className={`day-number ${darkMode ? "dark-mode" : ""}`}>{i}</div>
          <div className="day-tasks-dots">
            {dayTasks.map((task, idx) => (
              <div
                key={idx}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: task.priorityColor || "#00A231",
                  margin: "1px",
                }}
              />
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const selectedDayTasks = getTasksForDate(selectedDate);

  return (
    <div className={`calendar-container ${darkMode ? "dark-mode" : ""}`}>
      <div className="calendar-header">
        <div
          className={`nav-button ${darkMode ? "dark-mode" : ""}`}
          onClick={handlePrevMonth}
          style={{ cursor: "pointer" }}
        >
          <div
            data-property-1="linear"
            style={{ width: 24, height: 24, position: "relative" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 19L8 12L15 5"
                stroke={darkMode ? "white" : "black"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className={`month-title ${darkMode ? "dark-mode" : ""}`}>
          {getMonthName(currentDate)} {currentDate.getFullYear()}
        </div>
        <div
          className={`nav-button ${darkMode ? "dark-mode" : ""}`}
          onClick={handleNextMonth}
          style={{ cursor: "pointer" }}
        >
          <div
            data-property-1="linear"
            style={{ width: 24, height: 24, position: "relative" }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 5L16 12L9 19"
                stroke={darkMode ? "white" : "black"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="calendar-week-header">
        {weekDays.map((day) => (
          <div
            key={day}
            className={`week-day-name ${darkMode ? "dark-mode" : ""}`}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">{renderDays()}</div>

      <div
        style={{
          alignSelf: "center",
          width: "100%",
          maxWidth: "800px",
          display: "flex",
          flexDirection: "column",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <div
          className={`today-title ${darkMode ? "dark-mode" : ""}`}
          style={{ fontSize: "1.2rem" }}
        >
          Tasks for {selectedDate.toLocaleDateString()}
        </div>

        {selectedDayTasks.length > 0 ? (
          selectedDayTasks.map((task) => (
            <div
              key={task.id}
              className={`task-item ${darkMode ? "dark-mode" : ""}`}
            >
              <div className={`task-title ${darkMode ? "dark-mode" : ""}`}>
                {task.title}
              </div>
              <div className="task-meta">
                <div className={`task-time ${darkMode ? "dark-mode" : ""}`}>
                  {task.time}
                </div>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    background: task.priorityColor || "#00A231",
                    borderRadius: 9999,
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div
            style={{ textAlign: "center", color: darkMode ? "#aaa" : "#666" }}
          >
            No tasks for this day
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
