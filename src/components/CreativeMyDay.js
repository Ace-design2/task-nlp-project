import React, { useMemo } from "react";
import "./CreativeMyDay.css";
import VuesaxIcon from "./VuesaxIcon";

const CreativeMyDay = ({
  tasks = [],
  darkMode,
  userProfile,
  user,
  onToggleTaskCompletion,
  onShowNotifications,
  hasUnread,
  onProfileClick, // [NEW]
}) => {
  // 1. Time-based Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // 2. Filter Today's Tasks
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

  // 3. Stats Calculation
  const total = todayTasks.length;
  const completed = todayTasks.filter((t) => t.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Profile Image Logic
  const profileImage =
    userProfile?.photoBase64 ||
    user?.photoURL ||
    "https://avatars.dicebear.com/api/avataaars/user.svg";
  const displayName = userProfile?.displayName || user?.displayName || "User";

  return (
    <div className={`creative-container ${darkMode ? "dark-mode" : ""}`}>
      {/* FIXED TOP SECTION */}
      <div className="creative-fixed-section">
        {/* Header: Profile (Left), Greeting (Mid), Notif (Right) */}
        <div className="creative-header">
           {/* 1. Profile Left */}
           <div 
             className="profile-icon" 
             style={{ marginRight: 16, cursor: "pointer" }} 
             onClick={onProfileClick}
           >
                {profileImage ? (
                <img src={profileImage} alt="Profile" />
                ) : (
                <div className="profile-placeholder">
                    {displayName.charAt(0).toUpperCase()}
                </div>
                )}
            </div>

          {/* 2. Greeting */}
          <div style={{ flex: 1 }}>
            <h1 className="greeting-text">
              {greeting}, {displayName.split(" ")[0]}
            </h1>
            <p className="sub-greeting">Let's make today productive.</p>
          </div>
          
          {/* 3. Notif Right */}
          <div 
            className="notif-btn" 
            onClick={onShowNotifications}
            style={{
                background: darkMode ? "rgba(255,255,255,0.1)" : "#f5f5f5",
                padding: 10,
                borderRadius: "50%",
                cursor: "pointer",
                display: "flex",
                position: 'relative'
            }}
            >
            <VuesaxIcon 
                name="notification" 
                variant={hasUnread ? "Bold" : "Linear"} 
                color={hasUnread ? "#FF4B4B" : (darkMode ? "#fff" : "#292D32")}
                size={22}
            />
            {hasUnread && (
                <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 8,
                    height: 8,
                    background: '#FF4B4B',
                    borderRadius: '50%',
                    border: `2px solid ${darkMode ? '#1E1E1E' : '#fff'}`
                }} />
            )}
           </div>
        </div>

        {/* Progress Card (Glassmorphism) */}
        <div className="progress-card horizontal">
          <div className="progress-header-row">
            <div>
              <div className="progress-title">Daily Progress</div>
              <div className="progress-subtitle">
                {completed} of {total} tasks completed
              </div>
            </div>
            <div className="progress-percentage-large">{percentage}%</div>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* SCROLLABLE TASKS SECTION */}
      <div className="creative-tasks-section">
        <div className="section-label" style={{ marginBottom: 16 }}>
          Your Tasks
        </div>

        <div className="creative-task-list">
          {todayTasks.length > 0 ? (
            todayTasks.map((task) => (
              <div
                key={task.id}
                className={`creative-task-card ${
                  task.completed ? "completed" : ""
                }`}
                onClick={() =>
                  onToggleTaskCompletion &&
                  onToggleTaskCompletion(task.id, task.completed)
                }
              >
                <div
                  className={`checkbox-creative ${
                    task.completed ? "checked" : ""
                  }`}
                  style={{
                    borderColor: task.priorityColor || "#00A231",
                    background: task.completed
                      ? task.priorityColor || "#00A231"
                      : "transparent",
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

                <div className="task-content">
                  <div
                    className="task-title-creative"
                    style={{
                      textDecoration: task.completed ? "line-through" : "none",
                    }}
                  >
                    {task.title}
                  </div>
                  <div className="task-meta-creative">
                    <span>{task.time}</span>
                    {task.priority && (
                      <span
                        style={{
                          color: task.priorityColor || "#00A231",
                          fontWeight: 600,
                          fontSize: 10,
                          textTransform: "uppercase",
                        }}
                      >
                        • {task.priority}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state-creative">
              <VuesaxIcon
                name="task-square"
                size={40}
                style={{ marginBottom: 16, opacity: 0.5 }}
              />
              <div style={{ fontSize: 14, fontWeight: 500 }}>
                No tasks scheduled for today.
              </div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Enjoy your free time!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeMyDay;
