import React, { useEffect, useRef } from "react";
import { SoftGradient } from "../utils/SoftGradient";

const AstraAvatar = ({ size = 40 }) => {
  const containerRef = useRef(null);
  const gradientRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      gradientRef.current = new SoftGradient({
        container: containerRef.current,
        // Use Astra colors
        colors: ["#FFD700", "#FF6B00", "#FF0055", "#764ba2", "#2E91E5"],
        speed: 0.01, // Slightly faster for small scale ensuring visibility
        blurAmount: 15, // Less blur for smaller size
        particleCount: 4, // Fewer blobs for small area
      });
    }

    // Performance Optimization: Pause animation when off-screen
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gradientRef.current?.play();
          } else {
            gradientRef.current?.pause();
          }
        });
      },
      { threshold: 0.1 },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
      if (gradientRef.current) {
        gradientRef.current.destroy();
      }
    };
  }, []);

  return (
    <div
      className="astra-avatar"
      ref={containerRef}
      style={{ width: size, height: size }}
    />
  );
};

export default AstraAvatar;
