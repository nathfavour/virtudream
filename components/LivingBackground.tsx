import React, { useRef, useEffect } from 'react';
import { DreamMood } from '../types';

interface LivingBackgroundProps {
  mood: DreamMood;
}

interface MoodConfig {
  r: number;
  g: number;
  b: number;
  speed: number;
  turbulence: number;
}

const LivingBackground: React.FC<LivingBackgroundProps> = ({ mood }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Store persistent state so we don't reset particles on mood change
  const particlesRef = useRef<any[]>([]);
  const timeRef = useRef(0);
  const frameRef = useRef(0);
  
  // We need to access the *current* mood in the animation loop without restarting the effect
  const moodRef = useRef(mood);
  
  // Keep track of current color state for smooth transition interpolation
  const currentColorRef = useRef<MoodConfig>({ r: 80, g: 80, b: 90, speed: 0.001, turbulence: 50 });

  // Update ref when prop changes
  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const getMoodConfig = (m: DreamMood): MoodConfig => {
    switch (m) {
      case DreamMood.EUPHORIA: return { r: 255, g: 200, b: 100, speed: 0.002, turbulence: 150 }; // Warm Gold
      case DreamMood.NIGHTMARE: return { r: 139, g: 0, b: 0, speed: 0.004, turbulence: 220 }; // Deep Crimson
      case DreamMood.MELANCHOLY: return { r: 40, g: 80, b: 140, speed: 0.0008, turbulence: 60 }; // Somber Blue
      case DreamMood.MYSTERY: return { r: 110, g: 30, b: 160, speed: 0.0015, turbulence: 120 }; // Mystic Purple
      default: return { r: 80, g: 80, b: 90, speed: 0.001, turbulence: 50 }; // Neutral Grey
    }
  };

  // Linear interpolation helper
  const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Initialize particles only if they don't exist
    if (particlesRef.current.length === 0) {
      for(let i = 0; i < 60; i++) {
          particlesRef.current.push({
              x: Math.random() * width,
              y: Math.random() * height,
              vx: (Math.random() - 0.5) * 0.5,
              vy: (Math.random() - 0.5) * 0.5,
              size: Math.random() * 250 + 50
          });
      }
    }

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const animate = () => {
      // 1. Determine target state based on latest mood
      const targetConfig = getMoodConfig(moodRef.current);
      const current = currentColorRef.current;

      // 2. Smoothly interpolate current state towards target
      // Lower factor = slower, more "dreamlike" transition
      const colorFactor = 0.02; 
      const physicsFactor = 0.01;

      current.r = lerp(current.r, targetConfig.r, colorFactor);
      current.g = lerp(current.g, targetConfig.g, colorFactor);
      current.b = lerp(current.b, targetConfig.b, colorFactor);
      current.speed = lerp(current.speed, targetConfig.speed, physicsFactor);
      current.turbulence = lerp(current.turbulence, targetConfig.turbulence, physicsFactor);

      // Advance time
      timeRef.current += current.speed;
      
      // Clear screen with a slight trail effect
      ctx.fillStyle = `rgba(5, 5, 5, 0.2)`; 
      ctx.fillRect(0, 0, width, height);

      // Draw particles
      particlesRef.current.forEach(p => {
          // Calculate organic noise movement
          const noiseX = Math.sin(timeRef.current * 2 + p.y * 0.002) * (current.turbulence / 100);
          const noiseY = Math.cos(timeRef.current * 3 + p.x * 0.002) * (current.turbulence / 100);
          
          p.x += p.vx + noiseX;
          p.y += p.vy + noiseY;

          // Wrap particles around screen edges
          const buffer = 300;
          if(p.x < -buffer) p.x = width + buffer;
          if(p.x > width + buffer) p.x = -buffer;
          if(p.y < -buffer) p.y = height + buffer;
          if(p.y > height + buffer) p.y = -buffer;

          // Create gradient for soft "blob" look
          const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
          // Use interpolated RGB values
          gradient.addColorStop(0, `rgba(${current.r}, ${current.g}, ${current.b}, 0.08)`);
          gradient.addColorStop(0.5, `rgba(${current.r}, ${current.g}, ${current.b}, 0.02)`);
          gradient.addColorStop(1, `rgba(${current.r}, ${current.g}, ${current.b}, 0)`);
          
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
  }, []); // Empty dependency array ensures we don't restart the loop on prop change

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none transition-opacity duration-1000"
    />
  );
};

export default LivingBackground;