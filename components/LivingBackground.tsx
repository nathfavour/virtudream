import React, { useRef, useEffect } from 'react';
import { DreamMood } from '../types';

interface LivingBackgroundProps {
  mood: DreamMood;
}

const LivingBackground: React.FC<LivingBackgroundProps> = ({ mood }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timeRef = useRef(0);
  const frameRef = useRef(0);

  // Configuration based on mood
  const getMoodConfig = (m: DreamMood) => {
    switch (m) {
      case DreamMood.EUPHORIA: return { r: 255, g: 200, b: 100, speed: 0.002, turbulence: 150 }; // Gold/Warm
      case DreamMood.NIGHTMARE: return { r: 50, g: 0, b: 0, speed: 0.004, turbulence: 200 }; // Dark Red
      case DreamMood.MELANCHOLY: return { r: 40, g: 60, b: 120, speed: 0.001, turbulence: 80 }; // Deep Blue
      case DreamMood.MYSTERY: return { r: 100, g: 30, b: 140, speed: 0.0015, turbulence: 120 }; // Purple
      default: return { r: 80, g: 80, b: 90, speed: 0.001, turbulence: 50 }; // Grey
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles: { x: number, y: number, vx: number, vy: number, size: number }[] = [];
    for(let i = 0; i < 50; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            size: Math.random() * 200 + 100
        })
    }

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const animate = () => {
      const config = getMoodConfig(mood);
      timeRef.current += config.speed;
      
      // Clear with trail effect
      ctx.fillStyle = `rgba(5, 5, 5, 0.1)`; 
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
          // Organic movement
          const noiseX = Math.sin(timeRef.current * 2 + p.y * 0.002) * 1;
          const noiseY = Math.cos(timeRef.current * 3 + p.x * 0.002) * 1;
          
          p.x += p.vx + noiseX;
          p.y += p.vy + noiseY;

          // Wrap around
          if(p.x < -200) p.x = width + 200;
          if(p.x > width + 200) p.x = -200;
          if(p.y < -200) p.y = height + 200;
          if(p.y > height + 200) p.y = -200;

          // Draw "Blob"
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          gradient.addColorStop(0, `rgba(${config.r}, ${config.g}, ${config.b}, 0.08)`);
          gradient.addColorStop(1, `rgba(${config.r}, ${config.g}, ${config.b}, 0)`);
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
      });
      
      frameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, [mood]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-1000"
    />
  );
};

export default LivingBackground;
