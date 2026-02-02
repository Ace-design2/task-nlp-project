import React from "react";
import "./NotificationsPage.css";
import VuesaxIcon from "./VuesaxIcon";

const NotificationsPage = ({ notifications = [], onBack, darkMode }) => {
  return (
    <div className={`notifications-page ${darkMode ? "dark-mode" : ""}`}>
      {/* Header */}
      <div className="notifications-header">
        <button className="back-btn" onClick={onBack}>
          <VuesaxIcon name="arrow-left" variant="Linear" darkMode={darkMode} />
        </button>
        <h1 className="notifications-title">Notifications</h1>
        <div style={{ width: 24 }}></div> {/* Spacer for alignment */}
      </div>

      {/* List */}
      <div className="notifications-list">
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <div key={notif.id} className="notification-item">
              <div className="notif-icon-box">
                <VuesaxIcon
                  name={
                    notif.type === "task_due"
                      ? "alarm"
                      : notif.type === "task_created"
                      ? "add-circle"
                      : "notification"
                  }
                  variant="Bold"
                  color={
                    notif.type === "task_due"
                      ? "#FF4B4B"
                      : notif.type === "task_created"
                      ? "#00A231"
                      : "#4B8BFF"
                  }
                  size={20}
                />
              </div>
              <div className="notif-content">
                <div className="notif-title">{notif.title}</div>
                <div className="notif-time">{notif.timestamp}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-notifications">
            <VuesaxIcon
              name="notification"
              size={40}
              style={{ opacity: 0.3, marginBottom: 16 }}
              darkMode={darkMode}
            />
            <div style={{ opacity: 0.6 }}>No notifications yet</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
