import React from "react";
import "./BottomNavigation.css";
import VuesaxIcon from "./VuesaxIcon";
import { motion } from "framer-motion";

const BottomNavigation = ({ activeTab, setActiveTab, onNewChat, darkMode }) => {
  const navItems = [
    { id: "My Day", icon: "sun", label: "My Day" },
    { id: "Chat", icon: "message-text", label: "Chat" },
    { id: "Insights", icon: "chart-2", label: "Insights" },
    { id: "Calendar", icon: "calendar", label: "Calendar" },
    { id: "Account Settings", icon: "user", label: "Profile" },
  ];

  return (
    <div className="bottom-navigation">
      {navItems.map((item) => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? "active" : ""}`}
            onClick={() => {
              setActiveTab(item.id);
              if (item.id === "Chat" && onNewChat) {
                onNewChat();
              }
            }}
          >
            {/* Sliding Indicator */}
            {isActive && (
              <motion.div
                layoutId="nav-indicator"
                className="nav-indicator"
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  backgroundColor: darkMode
                    ? "rgba(255, 255, 255, 0.1)"
                    : "rgba(0, 0, 0, 0.05)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "32px",
                  zIndex: 0, // Behind content
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            )}

            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <VuesaxIcon
                name={item.icon}
                isActive={isActive}
                variant={isActive ? "bold" : "linear"}
                darkMode={darkMode}
                color={isActive ? "#c1121f" : undefined}
                style={{ width: 24, height: 24, marginBottom: 4 }}
              />
              <span className="nav-label">{item.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNavigation;
