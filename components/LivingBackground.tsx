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

      // --- MULTIPLE GRADIENT ORBS (Dynamic Lighting) ---
      // We render multiple moving gradient spots to create complex lighting
      // instead of just one center spot.
      
      const orbs = [
        { x: gradX, y: gradY, r: current.r, g: current.g, b: current.b, radius: radius }, // Mouse Orb
        { x: width * 0.2 + Math.sin(time * 0.3) * 200, y: height * 0.3 + Math.cos(time * 0.4) * 100, r: current.b, g: current.r, b: current.g, radius: radius * 0.8 }, // Orbiting Orb 1
        { x: width * 0.8 + Math.cos(time * 0.2) * 200, y: height * 0.7 + Math.sin(time * 0.3) * 100, r: current.g, g: current.b, b: current.r, radius: radius * 0.7 }  // Orbiting Orb 2
      ];

      // Base Background (Dark)
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Render Orbs with Screen Blend
      ctx.globalCompositeOperation = 'screen';
      
      orbs.forEach(orb => {
         const g = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
         g.addColorStop(0, `rgba(${orb.r}, ${orb.g}, ${orb.b}, 0.15)`);
         g.addColorStop(0.5, `rgba(${orb.r * 0.5}, ${orb.g * 0.5}, ${orb.b * 0.5}, 0.05)`);
         g.addColorStop(1, 'transparent');
         ctx.fillStyle = g;
         ctx.fillRect(0, 0, width, height);
      });

      ctx.globalCompositeOperation = 'source-over';

      // --- STATIC STARFIELD LAYER ---

      // --- STATIC STARFIELD LAYER (The "Twinkles" needed always) ---
      // We draw these directly on the background gradient to ensure NO BLANK SPOTS
      const starSeed = Math.floor(time * 0.5); // Shift stars slowly
      const starCount = 300;
      
      for(let i=0; i<starCount; i++) {
        // Pseudo-random deterministic stars based on time-block
        const x = ((Math.sin(i * 12.9898 + starSeed) * 43758.5453) % 1 + 1) / 2 * width;
        const y = ((Math.cos(i * 78.233 + starSeed) * 43758.5453) % 1 + 1) / 2 * height;
        const s = ((Math.sin(i * 32.1 + starSeed) * 43758.5453) % 1 + 1) * 2;
        const a = ((Math.cos(i * 89.2 + time * 3) * 43758.5453) % 1 + 1) / 2; // Twinkle alpha

        ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.8})`;
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sort particles by Z so distant ones draw first
      particlesRef.current.sort((a, b) => b.z - a.z);

      particlesRef.current.forEach(p => {
        // SPIRAL TUNNEL EFFECT (Restored & Controlled)
        // Particles rotate around the Vanishing Point as they travel
        // Angle increases as they get closer (acceleration effect)
        const angleSpeed = 0.002 + (1.0 / (p.z + 100)) * 5; 
        
        // We use 'x' and 'y' as the base coordinates, but we rotate them in 2D space around center
        // To persist the spiral, we need to track 'angle' state per particle if we want smooth trails
        // For now, let's derive rotation from Z to create a fixed "twisted tunnel" look
        const twist = p.z * 0.001; 
        
        // Move particle towards camera
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
        
        // Apply Tunnel Rotation
        // Rotate (p.x, p.y) by (time + twist)
        const rotAngle = time * 0.2 + twist;
        const rx = p.x * Math.cos(rotAngle) - p.y * Math.sin(rotAngle);
        const ry = p.x * Math.sin(rotAngle) + p.y * Math.cos(rotAngle);

        // Apply Vanishing Point Shift
        const x2d = rx * scale + vpX;
        const y2d = ry * scale + vpY;
        const size = Math.max(0.1, p.size * scale * 3);

        // Draw Particle
        const alpha = Math.min(1, (2000 - p.z) / 1000); 
        ctx.fillStyle = `rgba(${current.r}, ${current.g}, ${current.b}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Trail effect for fast particles (Tunnel Streaks)
        if (totalSpeed > 10) {
           ctx.beginPath();
           ctx.moveTo(x2d, y2d);
           // Calculate previous position (further back in Z, slightly less rotated)
           const prevZ = p.z + totalSpeed * 2;
           const prevScale = fov / (fov + prevZ);
           const prevRot = time * 0.2 + (prevZ * 0.001);
           const prx = p.x * Math.cos(prevRot) - p.y * Math.sin(prevRot);
           const pry = p.x * Math.sin(prevRot) + p.y * Math.cos(prevRot);
           const prevX = prx * prevScale + vpX;
           const prevY = pry * prevScale + vpY;
           
           ctx.lineTo(prevX, prevY);
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