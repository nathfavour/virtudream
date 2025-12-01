import React, { useState, useEffect, useRef } from 'react';

interface VoidTypingPortalProps {
  inputChar: string; // The character just typed
  isActive: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  char: string;
  size: number;
  rotation: number;
  color: string;
  life: number; // 0 to 1
  velocity: { x: number, y: number };
}

const VoidTypingPortal: React.FC<VoidTypingPortalProps> = ({ inputChar, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const portalStateRef = useRef({ 
    openness: 0, // 0 (closed) to 1 (fully open)
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2
  });

  // Helper: Invert Character (Simple Map)
  const invertChar = (char: string) => {
    // A mapping of characters to visually inverted/upside-down versions or just stylistic variants
    // Since full inversion isn't standard unicode for all chars, we'll use a stylistic glitch effect
    // or known lookalikes. For simplicity and robustness, we will render the character rotated 180deg in canvas.
    return char; 
  };

  useEffect(() => {
    if (inputChar && isActive) {
      // Spawn a new particle for the typed character
      const portal = portalStateRef.current;
      
      // Keep portal centered for the Dr. Strange effect - it should open in the center
      // or maybe slightly offset if multiple chars come in fast?
      // Let's keep it dead center for maximum drama
      portal.targetX = window.innerWidth / 2;
      portal.targetY = window.innerHeight / 2;

      // Reset decay so it snaps open and stays open while typing
      portal.openness = 1;

      // Burst of particles
      const colorPalette = ['#e879f9', '#22d3ee', '#facc15', '#f87171']; // Purple, Cyan, Gold, Red
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: portal.x, // Start at portal center
        y: portal.y,
        char: invertChar(inputChar),
        size: 60 + Math.random() * 40, // Larger initial size
        rotation: Math.random() * Math.PI * 2,
        color: color,
        life: 1.0,
        velocity: {
          x: (Math.random() - 0.5) * 15, // Faster explosion
          y: (Math.random() - 0.5) * 15
        }
      });
    }
  }, [inputChar, isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);

    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      
      // Portal Visualization Fix: Ensure it's drawn even if openness is small
      // or check if it was being hidden by something
      
      const portal = portalStateRef.current;
      
      // Smoothly move portal
      portal.x += (portal.targetX - portal.x) * 0.1;
      portal.y += (portal.targetY - portal.y) * 0.1;

      // Slower decay so it stays visible longer
      portal.openness *= 0.98; // Very slow decay
      if (portal.openness < 0.001) portal.openness = 0;

      // Force render if it has openness
      if (portal.openness > 0.001) {
        // Larger radius for dramatic effect
        const radius = 150 * portal.openness;
        
        // 1. The Void Hole (Vanishing Point)
        ctx.save();
        ctx.translate(portal.x, portal.y);
        
        // Outer Glow - DRAW FIRST so it's behind
        ctx.shadowBlur = 80 * portal.openness;
        ctx.shadowColor = '#d97706'; // Amber/Gold glow
        
        // Draw Main Void Circle
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        ctx.shadowBlur = 0; // Reset

        // 2. The Rotating Sparkly Mosaic Lips (Dr Strange Style)
        const time = Date.now() * 0.002;
        const segmentCount = 24; 
        
        ctx.rotate(time); 
        
        for (let i = 0; i < segmentCount; i++) {
          const angle = (i / segmentCount) * Math.PI * 2;
          const spiralOffset = Math.sin(time * 5 + i) * 15; // Increased spiral
          const x = Math.cos(angle) * (radius + spiralOffset);
          const y = Math.sin(angle) * (radius + spiralOffset);
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + time * 3); 
          
          // Shard Colors 
          const hue = (time * 100 + i * 15) % 60 + 10; 
          ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${portal.openness})`;
          
          ctx.beginPath();
          ctx.moveTo(0, -20); // Larger shards
          ctx.lineTo(10, 0);
          ctx.lineTo(0, 20);
          ctx.lineTo(-10, 0);
          ctx.fill();
          
          ctx.shadowBlur = 25;
          ctx.shadowColor = `hsla(${hue}, 100%, 50%, 1)`;
          ctx.stroke();
          
          ctx.restore();
        }
        ctx.restore();
      }

      // Draw Letters Dragged into Void
      particlesRef.current.forEach((p, index) => {
        // Physics: Sucked back into portal
        const dx = portal.x - p.x;
        const dy = portal.y - p.y;
        
        // Stronger gravity as it gets closer
        const force = (1.5 - p.life) * 0.8; 
        p.velocity.x += dx * 0.08 * force;
        p.velocity.y += dy * 0.08 * force;
        
        p.x += p.velocity.x;
        p.y += p.velocity.y;
        
        // Rotate faster as it enters the void
        p.rotation += 0.2;
        
        // Shrink into distance
        p.size *= 0.95;
        p.life -= 0.015;

        if (p.life <= 0 || p.size < 0.5) {
          particlesRef.current.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        // Simulated 3D tumble
        const scaleX = Math.cos(p.rotation); 
        ctx.scale(p.size / 20 * scaleX, p.size / 20); 
        
        ctx.font = 'bold 50px "Cinzel"'; // More mystical font
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 30;
        ctx.shadowColor = p.color;
        ctx.fillText(p.char, 0, 0);
        
        ctx.restore();
      });

      requestAnimationFrame(animate);
    };

    const animId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-50" // Highest Z-index to overlay everything
    />
  );
};

export default VoidTypingPortal;
