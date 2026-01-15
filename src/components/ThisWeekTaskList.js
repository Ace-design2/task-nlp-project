import React, { useState } from "react";
import "./TodayTaskList.css";
import VuesaxIcon from "./VuesaxIcon";

const ThisWeekTaskList = ({ darkMode, tasks = [] }) => {
  const [isOpen, setIsOpen] = useState(true);

  const getDayName = (dateStr) => {
    if (!dateStr) return null;
    const [y, m, d] = dateStr.split("-");
    const date = new Date(y, m - 1, d);
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[date.getDay()];
  };

  const weekTasks = {
    Sunday: [],
    Monday: [],
    Tuesday: [],
    Wednesday: [],
    Thursday: [],
    Friday: [],
    Saturday: [],
  };

  tasks.forEach((task) => {
    const day = getDayName(task.date);
    if (day && weekTasks[day]) {
      weekTasks[day].push(task);
    }
  });

  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div
      className={`today-task-list-container ${darkMode ? "dark-mode" : ""} ${
        !isOpen ? "collapsed" : ""
      }`}
    >
      <div className="today-header-section">
        <div className="today-header-row">
          <div className={`today-title ${darkMode ? "dark-mode" : ""}`}>
            This Week
          </div>
          <div
            className="today-toggle-icon"
            onClick={() => setIsOpen(!isOpen)}
            style={{
              cursor: "pointer",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          >
            <VuesaxIcon name="arrow-circle-down" darkMode={darkMode} />
          </div>
        </div>
      </div>

      <div className={`animated-tasks-wrapper ${isOpen ? "open" : ""}`}>
        <div
          style={{
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%",
          }}
        >
          <div className={`today-divider ${darkMode ? "dark-mode" : ""}`}></div>
          <div className="tasks-container week-view">
            {daysOfWeek.map((day) => (
              <div key={day} className="day-section">
                <div className={`day-header ${darkMode ? "dark-mode" : ""}`}>
                  {day}
                </div>
                {weekTasks[day] && weekTasks[day].length > 0 ? (
                  weekTasks[day].map((task) => (
                    <div
                      key={task.id}
                      className={`task-item ${darkMode ? "dark-mode" : ""}`}
                    >
                      <div
                        className={`task-title ${darkMode ? "dark-mode" : ""}`}
                      >
                        {task.title}
                      </div>
                      <div className="task-meta">
                        <div
                          className={`task-time ${darkMode ? "dark-mode" : ""}`}
                        >
                          {task.time}
                        </div>
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            background: task.priorityColor,
                            borderRadius: 9999,
                          }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`no-tasks ${darkMode ? "dark-mode" : ""}`}>
                    No tasks
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThisWeekTaskList;
