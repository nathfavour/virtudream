import React, { useRef, useEffect } from 'react';
import { DreamMood } from '../types';

interface LivingBackgroundProps {
  mood: DreamMood;
  isDreaming?: boolean;
}

interface MoodConfig {
  r: number;
  g: number;
  b: number;
  speed: number; // Z-axis speed
  spread: number; // How wide the tunnel is
}

const LivingBackground: React.FC<LivingBackgroundProps> = ({ mood, isDreaming = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Persistent state
  const particlesRef = useRef<any[]>([]);
  const moodRef = useRef(mood);
  const isDreamingRef = useRef(isDreaming);
  const currentColorRef = useRef<MoodConfig>({ r: 100, g: 100, b: 120, speed: 2, spread: 1000 });
  
  // Interaction State
  const mouseRef = useRef({ x: 0, y: 0 }); // Normalized mouse position (-1 to 1)
  const cameraRef = useRef({ x: 0, y: 0 }); // Smoothed camera position
  const warpSpeedRef = useRef(0); // Temporary speed boost on click

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    isDreamingRef.current = isDreaming;
  }, [isDreaming]);

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
    
    // Initialize 3D particles - Restored standard flow
    const particleCount = 450; 
    if (particlesRef.current.length === 0) {
      for(let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: (Math.random() - 0.5) * 2000, 
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
      
      // Dynamic override for Dreaming state
      if (isDreamingRef.current) {
        target.speed = 30; // Hyperspace speed
        target.spread = 500; // Tunnel narrows focus
        // Jitter camera to simulate processing turbulence
        cameraRef.current.x += (Math.random() - 0.5) * 0.005;
        cameraRef.current.y += (Math.random() - 0.5) * 0.005;
      }

      const current = currentColorRef.current;

      // Smooth interpolation for physics/colors
      const f = 0.03;
      current.r = lerp(current.r, target.r, f);
      current.g = lerp(current.g, target.g, f);
      current.b = lerp(current.b, target.b, f);
      current.speed = lerp(current.speed, target.speed, isDreamingRef.current ? 0.05 : f);
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

      // Calculate mouse pixel position for interaction
      const mousePixelX = (mouseRef.current.x + 1) / 2 * width;
      const mousePixelY = (mouseRef.current.y + 1) / 2 * height;

      // --- BREATHING BACKGROUND LOGIC ---
      // Use time to drive organic pulses
      const time = Date.now() * 0.001;
      
      // Calculate dynamic gradient positions based on mouse and time
      // The "Light" follows the mouse slightly
      const gradX = mousePixelX;
      const gradY = mousePixelY;
      
      // Dynamic radius based on mood intensity or speed
      const radius = Math.max(width, height) * (0.8 + Math.sin(time * 0.5) * 0.2); // Bigger radius

      // Create a complex gradient - ALWAYS VISIBLE
      const gradient = ctx.createRadialGradient(gradX, gradY, 0, width/2, height/2, radius);
      
      // Center color (Mouse): Tinted by current mood, but bright/alive
      gradient.addColorStop(0, `rgba(${current.r}, ${current.g}, ${current.b}, 0.3)`); // Higher opacity
      
      // Mid color: Deep shifting hues - VIBRANT
      const shiftR = Math.sin(time * 0.5) * 50 + current.r * 0.8;
      const shiftB = Math.cos(time * 0.5) * 50 + current.b * 0.9;
      gradient.addColorStop(0.4, `rgba(${shiftR}, ${current.g * 0.6}, ${shiftB}, 0.2)`);
      
      // Outer edge: Fades to a deep color, NOT black
      gradient.addColorStop(0.8, `rgba(${current.r * 0.2}, ${current.g * 0.2}, ${current.b * 0.3}, 0.8)`);
      gradient.addColorStop(1, `rgb(${current.r * 0.1}, ${current.g * 0.1}, ${current.b * 0.15})`);

      // Clear with the breathing gradient instead of solid color
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // --- ADD WAVE OVERLAY ---
      // Simulating "Background Waves" that are always present
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
         const offset = (time * 0.2 + w) * Math.PI;
         ctx.beginPath();
         // Create a wave path
         ctx.moveTo(0, height);
         for(let px = 0; px <= width; px += 50) {
            // Wave function: mixing sine waves for organic feel
            const py = height/2 + 
                       Math.sin(px * 0.002 + offset) * 100 + 
                       Math.sin(px * 0.01 - time) * 50 +
                       (w * 100); 
            ctx.lineTo(px, py);
         }
         ctx.lineTo(width, height);
         ctx.lineTo(0, height);
         ctx.fillStyle = `rgba(${current.r}, ${current.g}, ${current.b}, 0.05)`; // More visible
         ctx.fill();
         
         // Wave Highlight Line
         ctx.beginPath();
         for(let px = 0; px <= width; px += 50) {
            const py = height/2 + 
                       Math.sin(px * 0.002 + offset) * 100 + 
                       Math.sin(px * 0.01 - time) * 50 +
                       (w * 100); 
            if (px === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
         }
         ctx.strokeStyle = `rgba(${current.r}, ${current.g}, ${current.b}, 0.15)`;
         ctx.stroke();
      }

      // Sort particles by Z so distant ones draw first
      particlesRef.current.sort((a, b) => b.z - a.z);

      particlesRef.current.forEach(p => {
        // Standard forward motion (Restored)
        p.z -= totalSpeed;

        // Reset if passed camera
        if (p.z <= 1) {
          p.z = 2000;
          p.x = (Math.random() - 0.5) * current.spread;
          p.y = (Math.random() - 0.5) * current.spread;
        }

        // 3D Projection Math
        const fov = 300;
        const scale = fov / (fov + p.z);
        
        // Apply Vanishing Point Shift
        const x2d = p.x * scale + vpX;
        const y2d = p.y * scale + vpY;
        const size = Math.max(0.1, p.size * scale * 3);

        // Draw Particle
        const alpha = Math.min(1, (2000 - p.z) / 1000); 
        ctx.fillStyle = `rgba(${current.r}, ${current.g}, ${current.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Simple Trail (Optional, less chaotic)
        if (totalSpeed > 20) {
           ctx.beginPath();
           ctx.moveTo(x2d, y2d);
           ctx.lineTo(x2d, y2d - size * 2); // Simple streak up/back
           ctx.strokeStyle = `rgba(${current.r}, ${current.g}, ${current.b}, ${alpha * 0.3})`;
           ctx.stroke();
        }

        // INTERACTIVE: Connect to Mouse (Tactile Net)
        const dx = x2d - mousePixelX;

        const dy = y2d - mousePixelY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const connectionThreshold = 150;

        if (dist < connectionThreshold && scale > 0.5) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(${current.r}, ${current.g}, ${current.b}, ${(1 - dist/connectionThreshold) * 0.5})`;
          ctx.lineWidth = 1;
          ctx.moveTo(mousePixelX, mousePixelY);
          ctx.lineTo(x2d, y2d);
          ctx.stroke();
        }

        // INTERACTIVE: Connect to Vanishing Point (Warp Lines)
        // Only draw these if fast or clicked
        if (totalSpeed > 10 && scale > 0.8) { 
            ctx.strokeStyle = `rgba(${current.r}, ${current.g}, ${current.b}, 0.1)`;
            ctx.beginPath();
            ctx.moveTo(x2d, y2d);
            ctx.lineTo(vpX, vpY);
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