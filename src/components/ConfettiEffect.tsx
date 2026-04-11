import { useEffect, useRef } from "react";
import { Application, Graphics } from "pixi.js";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  gravity: number;
  life: number;
}

export default function ConfettiEffect({ trigger, duration = 3000 }: { trigger: boolean; duration?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trigger || !containerRef.current) return;

    const container = containerRef.current;
    const app = new Application();
    
    const init = async () => {
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundAlpha: 0,
        antialias: true,
      });
      
      container.appendChild(app.canvas as HTMLCanvasElement);

      const colors = [0xFF6B6B, 0x4ECDC4, 0xFFE66D, 0xFF006E, 0x06D6A0, 0xFFD60A, 0x7C3AED, 0xFB5607];
      const particles: Particle[] = [];
      const graphics = new Graphics();
      app.stage.addChild(graphics);

      // Create particles
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          y: window.innerHeight / 2,
          vx: (Math.random() - 0.5) * 20,
          vy: Math.random() * -20 - 5,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 8 + 3,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 0.3,
          gravity: 0.15 + Math.random() * 0.1,
          life: 1,
        });
      }

      const animate = () => {
        graphics.clear();
        let alive = 0;
        
        for (const p of particles) {
          if (p.life <= 0) continue;
          alive++;
          
          p.vy += p.gravity;
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotSpeed;
          p.vx *= 0.99;
          p.life -= 0.008;
          
          graphics.beginFill(p.color, p.life);
          graphics.drawRoundedRect(
            p.x - p.size / 2,
            p.y - p.size / 2,
            p.size,
            p.size * 0.6,
            2
          );
          graphics.endFill();
        }

        if (alive > 0) {
          requestAnimationFrame(animate);
        }
      };

      animate();

      setTimeout(() => {
        app.destroy(true);
        if (container.firstChild) container.removeChild(container.firstChild);
      }, duration);
    };

    init();

    return () => {
      try { app.destroy(true); } catch {}
    };
  }, [trigger, duration]);

  if (!trigger) return null;

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none z-50" />
  );
}
