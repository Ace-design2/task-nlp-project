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
                    <div 
                        className={`task-action-btn ${darkMode ? "dark-mode" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Function to add to calendar
                          const addToCalendar = (t) => {
                             // Create .ics content
                             const now = new Date();
                             // Parse task date (YYYY-MM-DD)
                             // and time (HH:MM or "All Day")
                             // Simple construction
                             let startDateTime = t.date.replace(/-/g, '') + 'T090000'; // Default 9AM
                             let endDateTime = t.date.replace(/-/g, '') + 'T100000';
                             
                             if (t.time && t.time !== 'All Day') {
                                 const [hh, mm] = t.time.split(':');
                                 startDateTime = t.date.replace(/-/g, '') + 'T' + hh + mm + '00';
                                 // End time + 1 hour
                                 let endH = parseInt(hh) + 1;
                                 let endHStr = String(endH).padStart(2, '0');
                                 if (endH > 23) endHStr = "23"; // Clip to end of day roughly
                                 endDateTime = t.date.replace(/-/g, '') + 'T' + endHStr + mm + '00';
                             }

                             const icsContent = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Astra//Task App//EN
BEGIN:VEVENT
UID:${t.id || Date.now()}@astra.app
DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${t.title}
DESCRIPTION:Created via Astra Task App
END:VEVENT
END:VCALENDAR`;

                             const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
                             const link = document.createElement('a');
                             link.href = window.URL.createObjectURL(blob);
                             link.setAttribute('download', `${t.title}.ics`);
                             document.body.appendChild(link);
                             link.click();
                             document.body.removeChild(link);
                          };
                          addToCalendar(task);
                        }}
                        title="Add to Calendar"
                        style={{ marginRight: 8, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      >
                         <VuesaxIcon name="calendar-add" size={16} variant="Linear" color={darkMode ? "#aaa" : "#666"} />
                      </div>

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
