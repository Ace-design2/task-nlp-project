export class SoftGradient {
  constructor(config) {
    this.config = {
      container: config.container,
      particleCount: config.particleCount ?? 6, // Fewer, larger blobs
      colors: config.colors ?? [
        "#FFD700", // Gold
        "#FF6B00", // Orange
        "#FF0055", // Pink/Red
        "#764ba2", // Purple
        "#4facfe", // Light Blue accent
      ],
      speed: config.speed ?? 0.002, // Very slow drift
      blurAmount: config.blurAmount ?? 60, // Heavy blur for soft mesh look
    };

    this.particles = [];
    this.animationId = 0;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.config.container.appendChild(this.canvas);

    this.animate = this.animate.bind(this);
    this.resizeHandler = this.resizeCanvas.bind(this);

    this.init();
  }

  init() {
    this.resizeCanvas();
    this.createParticles();
    window.addEventListener("resize", this.resizeHandler);
    this.animate();
  }

  resizeCanvas() {
    const rect = this.config.container.getBoundingClientRect();
    // Use slightly larger canvas to avoid hard edges when blurring?
    // Actually standard size is fine if we keep blobs center-ish or wrap.
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  createParticles() {
    this.particles = [];
    const { width, height } = this.canvas;
    const { colors } = this.config;

    for (let i = 0; i < this.config.particleCount; i++) {
      // Random start position
      this.particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        radius: Math.min(width, height) * 0.4 + Math.random() * 20, // Large radius relative to container
        color: colors[i % colors.length],
      });
    }
  }

  draw() {
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);

    // Apply heavy blur for the mesh effect
    // Note: ctx.filter is supported in most modern browsers.
    // Fallback could be CSS blur on canvas, but ctx is flexible.
    this.ctx.filter = `blur(${this.config.blurAmount}px)`;

    // Draw background base (optional, maybe unnecessary if particles cover all)
    // this.ctx.fillStyle = this.config.colors[0];
    // this.ctx.fillRect(0,0, width, height);

    this.particles.forEach((p) => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = p.color;
      this.ctx.fill();
    });

    this.ctx.filter = "none"; // Reset filter
  }

  update() {
    const { width, height } = this.canvas;

    this.particles.forEach((p) => {
      p.x += p.vx * width; // Scale velocity by dimension for consistency
      p.y += p.vy * height;

      // Bounce off walls (soft bounce, or wrap? Wrap is better for mesh)
      // Actually bouncing keeps color concentration better for specific vibes.
      // Let's bounce with a buffer so they don't get stuck.

      if (p.x < -p.radius * 0.5) {
        p.x = -p.radius * 0.5;
        p.vx *= -1;
      }
      if (p.x > width + p.radius * 0.5) {
        p.x = width + p.radius * 0.5;
        p.vx *= -1;
      }
      if (p.y < -p.radius * 0.5) {
        p.y = -p.radius * 0.5;
        p.vy *= -1;
      }
      if (p.y > height + p.radius * 0.5) {
        p.y = height + p.radius * 0.5;
        p.vy *= -1;
      }

      // Slight random wobble
      p.vx += (Math.random() - 0.5) * 0.0001;
      p.vy += (Math.random() - 0.5) * 0.0001;

      // Clamp velocity
      const maxSpeed = this.config.speed;
      if (p.vx > maxSpeed) p.vx = maxSpeed;
      if (p.vx < -maxSpeed) p.vx = -maxSpeed;
      if (p.vy > maxSpeed) p.vy = maxSpeed;
      if (p.vy < -maxSpeed) p.vy = -maxSpeed;
    });
  }

  animate() {
    if (!this.paused) {
      this.update();
      this.draw();
    }
    this.animationId = requestAnimationFrame(this.animate);
  }

  pause() {
    this.paused = true;
  }

  play() {
    this.paused = false;
  }

  destroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener("resize", this.resizeHandler);
    if (this.canvas) this.canvas.remove();
  }
}
