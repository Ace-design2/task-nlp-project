import React, { useRef, useEffect } from "react";

const ParticleSwarm = ({
  count = 100,
  colors = ["#FFD700", "#FF6B00", "#FF0055", "#764ba2", "#2E91E5"],

  className = "",
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let animationId;
    let particles = [];

    // Resize handling
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width;
        canvas.height = height;
        initParticles(width, height);
      }
    });

    resizeObserver.observe(canvas.parentElement); // Observe parent container

    class Particle {
      constructor(w, h, color) {
        // Start at center
        this.x = w / 2;
        this.y = h / 2;

        // Target position (randomly distributed)
        this.targetX = Math.random() * w;
        this.targetY = Math.random() * h;

        // Velocity
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;

        // Size
        this.size = Math.random() * 2 + 1;
        this.color = color;

        // "Swarm" parameters
        this.maxSpeed = 3 + Math.random() * 2;
        this.maxForce = 0.05 + Math.random() * 0.05;
        this.settled = false;

        // Drift phase parameters
        this.angle = Math.random() * Math.PI * 2;
        this.driftSpeed = 0.2 + Math.random() * 0.3;
      }

      update(w, h) {
        if (!this.settled) {
          // Steering behavior towards target
          const dx = this.targetX - this.x;
          const dy = this.targetY - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 5) {
            this.settled = true;
          } else {
            // Seek
            let desireX = (dx / distance) * this.maxSpeed;
            let desireY = (dy / distance) * this.maxSpeed;

            let steerX = desireX - this.vx;
            let steerY = desireY - this.vy;

            // Limit force
            const steerLen = Math.sqrt(steerX * steerX + steerY * steerY);
            if (steerLen > this.maxForce) {
              steerX = (steerX / steerLen) * this.maxForce;
              steerY = (steerY / steerLen) * this.maxForce;
            }

            this.vx += steerX;
            this.vy += steerY;

            this.x += this.vx;
            this.y += this.vy;
          }
        } else {
          // Settled: Drift gently
          this.x += Math.cos(this.angle) * this.driftSpeed;
          this.y += Math.sin(this.angle) * this.driftSpeed;

          // Wrap around edges softly or bounce? Let's bounce for simplicity in restricted view
          // Actually, let's allow slow drift and wrap
          if (this.x < 0) this.x = w;
          if (this.x > w) this.x = 0;
          if (this.y < 0) this.y = h;
          if (this.y > h) this.y = 0;

          // Slowly change angle
          this.angle += (Math.random() - 0.5) * 0.05;
        }
      }

      draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
      }
    }

    const initParticles = (w, h) => {
      particles = [];
      for (let i = 0; i < count; i++) {
        const color = colors[i % colors.length];
        particles.push(new Particle(w, h, color));
      }
    };

    // Initial setup if size known
    if (canvas.parentElement) {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      initParticles(rect.width, rect.height);
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.update(canvas.width, canvas.height);
        p.draw(ctx);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      resizeObserver.disconnect();
    };
  }, [count, colors]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
};

export default React.memo(ParticleSwarm);
