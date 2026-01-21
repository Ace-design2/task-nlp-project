import React, { useState, useEffect, useRef } from "react";
import VuesaxIcon from "./VuesaxIcon";
import { SoftGradient } from "../utils/SoftGradient";

const AstraStartPage = ({ onTaskStart, darkMode }) => {
  const [inputText, setInputText] = useState("");
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      onTaskStart(inputText);
    }
  };

  const prompts = [
    "pixelate a few ideas to round out your dashboard...",
    "Draft a quick email to the team...",
    "Schedule a meeting for tomorrow...",
  ];

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
