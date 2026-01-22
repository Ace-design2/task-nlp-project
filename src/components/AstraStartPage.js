import React, { useEffect, useRef, useMemo } from "react";

import { SoftGradient } from "../utils/SoftGradient";
import ParticleSwarm from "./ParticleSwarm";

const AstraStartPage = ({ onTaskStart, darkMode }) => {
  const orbRef = useRef(null);
  const gradientRef = useRef(null);

  useEffect(() => {
    if (orbRef.current) {
      gradientRef.current = new SoftGradient({
        container: orbRef.current,
        colors: ["#FFD700", "#FF6B00", "#FF0055", "#764ba2", "#2E91E5"], // Astra + Blue accent
        speed: 0.005,
        blurAmount: 50,
      });
    }

    return () => {
      if (gradientRef.current) {
        gradientRef.current.destroy();
      }
    };
  }, []);

  const particlesColors = useMemo(() => {
    return darkMode
      ? ["#ffffff", "#aaaaaa", "#4facfe"]
      : ["#FFD700", "#FF6B00", "#FF0055", "#764ba2", "#2E91E5"];
  }, [darkMode]);

  return (
    <div className={`astra-start-page ${darkMode ? "dark" : ""}`}>
      <ParticleSwarm count={80} colors={particlesColors} />

      {/* Animated Gradient Orb - Isolated */}
      <div
        className="astra-orb"
        ref={orbRef}
        style={{ background: "transparent", zIndex: 2 }}
      ></div>
    </div>
  );
};

export default AstraStartPage;
