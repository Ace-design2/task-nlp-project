import React, { useState } from "react";
import "./TodayTaskList.css";
import VuesaxIcon from "./VuesaxIcon";

const TodayTaskList = ({ darkMode, tasks = [], onToggleTaskCompletion }) => {
  const [isOpen, setIsOpen] = useState(true);

  // Helper to check if a date is today
  const isToday = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const todayTasks = tasks.filter((task) => isToday(task.date));

  return (
    <div
      className={`today-task-list-container ${darkMode ? "dark-mode" : ""} ${
        !isOpen ? "collapsed" : ""
      }`}
    >
      <div className="today-header-section">
        <div className="today-header-row">
          <div className={`today-title ${darkMode ? "dark-mode" : ""}`}>
            Today
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
          <div className="tasks-container">
            {/* Dynamic tasks */}
            {todayTasks.length > 0 ? (
              todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={`task-item ${darkMode ? "dark-mode" : ""}`}
                >
                  <div
                    className="task-checkbox"
                    onClick={() =>
                      onToggleTaskCompletion &&
                      onToggleTaskCompletion(task.id, task.completed)
                    }
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `2px solid ${task.priorityColor || "#00A231"}`,
                      background: task.completed
                        ? task.priorityColor || "#00A231"
                        : "transparent",
                      marginRight: 12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {task.completed && (
                      <VuesaxIcon
                        name="tick-square"
                        variant="Bold"
                        style={{ color: "#fff", width: 14, height: 14 }}
                      />
                    )}
                  </div>

                  <div
                    className={`task-title ${darkMode ? "dark-mode" : ""}`}
                    style={{
                      textDecoration: task.completed ? "line-through" : "none",
                      opacity: task.completed ? 0.6 : 1,
                      flex: 1,
                    }}
                  >
                    {task.title}
                  </div>
                  <div className="task-meta">
                    <div className={`task-time ${darkMode ? "dark-mode" : ""}`}>
                      {task.time}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className={`task-item ${darkMode ? "dark-mode" : ""}`}
                style={{ justifyContent: "center", opacity: 0.7 }}
              >
                No tasks for today
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodayTaskList;
