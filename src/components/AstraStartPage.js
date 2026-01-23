import React, { useMemo } from "react";

import ParticleSwarm from "./ParticleSwarm";

const AstraStartPage = ({ onTaskStart, darkMode }) => {
  const particlesColors = useMemo(() => {
    return darkMode
      ? ["#ffffff", "#aaaaaa", "#4facfe"]
      : ["#FFD700", "#FF6B00", "#FF0055", "#764ba2", "#2E91E5"];
  }, [darkMode]);

  return (
    <div className={`astra-start-page ${darkMode ? "dark" : ""}`}>
      <ParticleSwarm count={80} colors={particlesColors} />

      {/* Animated Gradient Orb - REMOVED */}
    </div>
  );
};

export default AstraStartPage;
