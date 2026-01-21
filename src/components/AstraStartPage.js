import React, { useEffect, useRef } from "react";

import { SoftGradient } from "../utils/SoftGradient";

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

  return (
    <div className={`astra-start-page ${darkMode ? "dark" : ""}`}>
      {/* Central Card */}
      <div className={`astra-start-page ${darkMode ? "dark" : ""}`}>
        {/* Animated Gradient Orb - Isolated */}
        <div
          className="astra-orb"
          ref={orbRef}
          style={{ background: "transparent" }}
        ></div>
      </div>
    </div>
  );
};

export default AstraStartPage;
