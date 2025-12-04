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

    // Cache colors to avoid reading the DOM every frame (Performance Fix)
    let colorPalette = {
      primary: 'rgba(0, 240, 210, 1)', // Default fallback
      secondary: 'rgba(0, 196, 176, 1)',
      tertiary: 'rgba(113, 113, 122, 1)'
    };

    // Helper: Convert Hex/CSS var to RGB numbers for efficient manipulation
    const parseColorToRgb = (varName: string, fallbackVar?: string) => {
      const style = getComputedStyle(document.documentElement);
      let color = style.getPropertyValue(varName).trim();
      
      // Try fallback if primary var is missing
      if (!color && fallbackVar) {
        color = style.getPropertyValue(fallbackVar).trim();
      }

      // If still empty or invalid, return null to handle defaults later
      if (!color) return null;

      // Handle Hex format (#RRGGBB) - This fixes the visibility issue
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return { r, g, b };
      }
      
      return null; // Could add HSL/RGB parsing here if needed in future
    };

    // Helper: Create RGBA string from cached RGB object
    const getRgba = (rgb: { r: number, g: number, b: number } | null, opacity: number) => {
      if (!rgb) return `rgba(255, 255, 255, ${opacity})`;
      return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
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

      constructor(w: number, h: number, colors: typeof colorPaletteRgb) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.baseRadius = Math.random() * 2 + 1; // Slightly smaller for cleaner look
        this.radius = this.baseRadius;
        // Slow random movement
        this.dx = (Math.random() - 0.5) * 0.3; 
        this.dy = (Math.random() - 0.5) * 0.3;
        
        // Use parsed RGB values
        const isPrimary = Math.random() > 0.5;
        const baseColor = isPrimary ? colors.primary : colors.secondary;
        this.color = getRgba(baseColor, 0.4); // Static opacity for particles
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
      }

      update() {
        if (this.x + this.radius > this.canvasWidth || this.x - this.radius < 0) this.dx = -this.dx;
        if (this.y + this.radius > this.canvasHeight || this.y - this.radius < 0) this.dy = -this.dy;

        this.x += this.dx;
        this.y += this.dy;

        // Interactive: Mouse Interactivity
        const dxMouse = mouse.x - this.x;
        const dyMouse = mouse.y - this.y;
        const distanceMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        if (distanceMouse < mouse.radius) {
            if (this.radius < this.baseRadius * 3) {
                this.radius += 0.2;
            }
        } else if (this.radius > this.baseRadius) {
            this.radius -= 0.05;
        }

        this.draw(ctx!);
      }
    }

    let colorPaletteRgb: { 
      primary: { r: number, g: number, b: number } | null, 
      secondary: { r: number, g: number, b: number } | null,
      tertiary: { r: number, g: number, b: number } | null 
    };

    // ---- Initialization & Animation Loop ----
    const init = () => {
      particles = [];
      const particleCount = Math.min(Math.floor((canvas.width * canvas.height) / 20000), 80);
      
      // Initialize colors once
      colorPaletteRgb = {
        primary: parseColorToRgb('--accent-primary'),
        // Fallback to accent-muted since accent-secondary doesn't exist in your CSS
        secondary: parseColorToRgb('--accent-secondary', '--accent-muted'), 
        tertiary: parseColorToRgb('--text-tertiary')
      };

      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(canvas.width, canvas.height, colorPaletteRgb));
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
      });

      connectParticles();
    };

    const connectParticles = () => {
        const maxDistance = 150;
        for (let a = 0; a < particles.length; a++) {
            for (let b = a; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < maxDistance) {
                    const opacity = 1 - (distance / maxDistance);
                    ctx.beginPath();
                    // Use the cached tertiary color with dynamic opacity
                    ctx.strokeStyle = getRgba(colorPaletteRgb.tertiary, opacity * 0.15);
                    ctx.lineWidth = 1;
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (event: MouseEvent) => {
        mouse.x = event.x;
        mouse.y = event.y;
    }

    handleResize();
    animate();

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);

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