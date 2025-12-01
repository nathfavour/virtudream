import React, { useRef, useEffect } from 'react';
import { DreamMood } from '../types';

interface LivingBackgroundProps {
  mood: DreamMood;
}

interface MoodConfig {
  r: number;
  g: number;
  b: number;
  speed: number; // Z-axis speed
  spread: number; // How wide the tunnel is
}

const LivingBackground: React.FC<LivingBackgroundProps> = ({ mood }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Persistent state
  const particlesRef = useRef<any[]>([]);
  const moodRef = useRef(mood);
  const currentColorRef = useRef<MoodConfig>({ r: 100, g: 100, b: 120, speed: 2, spread: 1000 });
  
  // Interaction State
  const mouseRef = useRef({ x: 0, y: 0 }); // Normalized mouse position (-1 to 1)
  const cameraRef = useRef({ x: 0, y: 0 }); // Smoothed camera position
  const warpSpeedRef = useRef(0); // Temporary speed boost on click

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  const getMoodConfig = (m: DreamMood): MoodConfig => {
    switch (m) {
      case DreamMood.EUPHORIA: return { r: 255, g: 215, b: 100, speed: 8, spread: 1500 }; // Fast Gold
      case DreamMood.NIGHTMARE: return { r: 200, g: 20, b: 20, speed: 12, spread: 800 }; // Violent Red
      case DreamMood.MELANCHOLY: return { r: 50, g: 100, b: 200, speed: 1, spread: 1200 }; // Slow Blue
      case DreamMood.MYSTERY: return { r: 140, g: 50, b: 220, speed: 3, spread: 2000 }; // Deep Purple
      default: return { r: 100, g: 100, b: 120, speed: 2, spread: 1000 }; // Neutral
    }
  };

  const lerp = (start: number, end: number, factor: number) => start + (end - start) * factor;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // Initialize 3D particles
    const particleCount = 400;
    if (particlesRef.current.length === 0) {
      for(let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: (Math.random() - 0.5) * 2000, // True 3D coordinates
          y: (Math.random() - 0.5) * 2000,
          z: Math.random() * 2000,
          size: Math.random() * 2
        });
      }
    }

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Normalize mouse coordinates to -1 to 1 range
      mouseRef.current = {
        x: (e.clientX / width) * 2 - 1,
        y: (e.clientY / height) * 2 - 1
      };
    };

    const handleMouseDown = () => {
      // Trigger warp speed
      warpSpeedRef.current = 50;
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);

    const animate = () => {
      const target = getMoodConfig(moodRef.current);
      const current = currentColorRef.current;

      // Smooth interpolation for physics/colors
      const f = 0.02;
      current.r = lerp(current.r, target.r, f);
      current.g = lerp(current.g, target.g, f);
      current.b = lerp(current.b, target.b, f);
      current.speed = lerp(current.speed, target.speed, f);
      current.spread = lerp(current.spread, target.spread, f);

      // Smooth Camera/Parallax movement
      const camF = 0.05;
      cameraRef.current.x = lerp(cameraRef.current.x, mouseRef.current.x, camF);
      cameraRef.current.y = lerp(cameraRef.current.y, mouseRef.current.y, camF);

      // Decay warp speed
      warpSpeedRef.current = lerp(warpSpeedRef.current, 0, 0.02);
      const totalSpeed = current.speed + warpSpeedRef.current;

      // Calculate Vanishing Point (shifts opposite to mouse to simulate looking around)
      const vpX = (width / 2) - (cameraRef.current.x * width * 0.25);
      const vpY = (height / 2) - (cameraRef.current.y * height * 0.25);

      // Create a deep, dark version of the current mood color for the background void
      const bgR = Math.floor(current.r * 0.08); 
      const bgG = Math.floor(current.g * 0.08); 
      const bgB = Math.floor(current.b * 0.08); 

      // Fade trail with tinted void
      ctx.fillStyle = `rgba(${bgR}, ${bgG}, ${bgB}, 0.25)`;
      ctx.fillRect(0, 0, width, height);

      // Sort particles by Z so distant ones draw first (simple depth buffering)
      particlesRef.current.sort((a, b) => b.z - a.z);

      particlesRef.current.forEach(p => {
        // Move particle towards camera
        p.z -= totalSpeed;

        // Reset if passed camera
        if (p.z <= 1) {
          p.z = 2000;
          p.x = (Math.random() - 0.5) * current.spread;
          p.y = (Math.random() - 0.5) * current.spread;
        }

        // 3D Projection Math
        // fov / (fov + z)
        const fov = 300;
        const scale = fov / (fov + p.z);
        
        // Apply Vanishing Point Shift
        const x2d = p.x * scale + vpX;
        const y2d = p.y * scale + vpY;
        const size = Math.max(0.1, p.size * scale * 3);

        // Draw
        const alpha = Math.min(1, (2000 - p.z) / 1000); // Fade in as they get closer
        ctx.fillStyle = `rgba(${current.r}, ${current.g}, ${current.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Optional: Connection lines for "constellation" feel if close enough
        // Connect to the Dynamic Vanishing Point for speed/warp effect
        if (scale > 0.8) { 
            ctx.strokeStyle = `rgba(${current.r}, ${current.g}, ${current.b}, 0.05)`;
            ctx.beginPath();
            ctx.moveTo(x2d, y2d);
            ctx.lineTo(vpX, vpY); // Line to vanishing center
            ctx.stroke();
        }
      });

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed top-0 left-0 w-full h-full -z-10 bg-black cursor-crosshair"
    />
  );
};

export default LivingBackground;