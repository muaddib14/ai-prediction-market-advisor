import React, { useEffect, useRef } from 'react';

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let mouse = { x: -1000, y: -1000, radius: 150 };

    // Helper to get CSS variable colors
    const getThemeColor = (varName: string, opacity = 1) => {
        const style = getComputedStyle(document.documentElement);
        const hsl = style.getPropertyValue(varName).trim(); // expects "h s% l%"
        return `hsla(${hsl} / ${opacity})`;
    };

    // ---- Particle Class definition ----
    class Particle {
      x: number;
      y: number;
      radius: number;
      baseRadius: number;
      dx: number;
      dy: number;
      color: string;
      canvasWidth: number;
      canvasHeight: number;

      constructor(w: number, h: number) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        //Random size between 2 and 6
        this.baseRadius = Math.random() * 4 + 2; 
        this.radius = this.baseRadius;
        // Slow random movement
        this.dx = (Math.random() - 0.5) * 0.5; 
        this.dy = (Math.random() - 0.5) * 0.5;
        // Alternating colors between primary and secondary accents
        this.color = Math.random() > 0.5 
            ? getThemeColor('--accent-primary', 0.6) 
            : getThemeColor('--accent-secondary', 0.6);
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        // Create a glowing effect
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.shadowBlur = 0; // Reset shadow for lines
      }

      update() {
        // Boundary check - bounce off walls
        if (this.x + this.radius > this.canvasWidth || this.x - this.radius < 0) this.dx = -this.dx;
        if (this.y + this.radius > this.canvasHeight || this.y - this.radius < 0) this.dy = -this.dy;

        // Move
        this.x += this.dx;
        this.y += this.dy;

        // Interactive: Mouse Interactivity
        const dxMouse = mouse.x - this.x;
        const dyMouse = mouse.y - this.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        // Grow slightly when mouse is near
        if (distanceMouse < mouse.radius) {
            if (this.radius < this.baseRadius * 2) {
                this.radius += 1;
            }
        } else if (this.radius > this.baseRadius) {
            this.radius -= 0.1;
        }

        this.draw(ctx!);
      }
    }

    // ---- Initialization & Animation Loop ----
    const init = () => {
      particles = [];
      // Adjust particle count based on screen size for performance
      const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 15000), 100);
      
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    const animate = () => {
      requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Update and draw particles
      particles.forEach(particle => {
        particle.update();
      });

      // 2. Draw connecting lines (Neural Network effect)
      connectParticles();
    };

    const connectParticles = () => {
        const maxDistance = 120; // Distance to form a connection
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    // Calculate opacity based on distance (closer = brighter)
                    const opacity = 1 - (distance / maxDistance);
                    ctx.beginPath();
                    ctx.strokeStyle = getThemeColor('--text-tertiary', opacity * 0.2);
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    // ---- Event Listeners ----
    const handleResize = () => {
      // Set canvas resolution to match window size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (event: MouseEvent) => {
        mouse.x = event.x;
        mouse.y = event.y;
    }

    // Initial setup
    handleResize();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-0"
    />
  );
}