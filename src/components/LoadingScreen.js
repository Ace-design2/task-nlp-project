import React from "react";
import "./LoadingScreen.css";

const LoadingScreen = ({ darkMode }) => {
  return (
    <div className={`loading-screen ${darkMode ? "dark-mode" : ""}`}>
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingScreen;
