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
      
      // Randomize portal position slightly for "appearing randomly" but keep relatively central
      // Or move portal towards the typing? Let's keep it somewhat centered but jittery
      portal.targetX = window.innerWidth / 2 + (Math.random() - 0.5) * 400;
      portal.targetY = window.innerHeight / 2 + (Math.random() - 0.5) * 200;

      // Burst of particles
      const colorPalette = ['#e879f9', '#22d3ee', '#facc15', '#f87171']; // Purple, Cyan, Gold, Red
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      particlesRef.current.push({
        id: Date.now(),
        x: portal.x, // Start at portal center
        y: portal.y,
        char: invertChar(inputChar),
        size: 40 + Math.random() * 20,
        rotation: Math.random() * Math.PI * 2,
        color: color,
        life: 1.0,
        velocity: {
          x: (Math.random() - 0.5) * 5, // Explode outward initially
          y: (Math.random() - 0.5) * 5
        }
      });
      
      // Snap open portal
      portalStateRef.current.openness = 1;
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

      const portal = portalStateRef.current;
      
      // Smoothly move portal
      portal.x += (portal.targetX - portal.x) * 0.1;
      portal.y += (portal.targetY - portal.y) * 0.1;

      // Decay openness
      portal.openness *= 0.95;
      if (portal.openness < 0.01) portal.openness = 0;

      // Draw Portal (The Void Mouth)
      if (portal.openness > 0.01) {
        const radius = 60 * portal.openness;
        
        // 1. The Void Hole (Vanishing Point)
        ctx.save();
        ctx.translate(portal.x, portal.y);
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();

        // 2. The Rotating Sparkly Mosaic Lips
        const time = Date.now() * 0.005;
        const segmentCount = 12;
        
        ctx.rotate(time); // Spin the whole ring
        
        for (let i = 0; i < segmentCount; i++) {
          const angle = (i / segmentCount) * Math.PI * 2;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + time * 2); // Spin individual shards
          
          // Shard Colors (Sparkling)
          const hue = (time * 50 + i * 30) % 360;
          ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${portal.openness})`;
          
          // Draw Shard (Diamond shape)
          ctx.beginPath();
          ctx.moveTo(0, -10);
          ctx.lineTo(10, 0);
          ctx.lineTo(0, 10);
          ctx.lineTo(-10, 0);
          ctx.fill();
          
          // Add Glow
          ctx.shadowBlur = 15;
          ctx.shadowColor = `hsla(${hue}, 80%, 60%, 1)`;
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
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // Attraction force increases as life decreases
        const force = (1 - p.life) * 0.5; 
        p.velocity.x += dx * 0.05 * force;
        p.velocity.y += dy * 0.05 * force;
        
        p.x += p.velocity.x;
        p.y += p.velocity.y;
        
        // Rotate due to "friction of motion"
        p.rotation += 0.1;
        
        // Shrink into distance
        p.size *= 0.96;
        p.life -= 0.01;

        if (p.life <= 0 || p.size < 0.5) {
          particlesRef.current.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.size / 20, p.size / 20); // Scale based on size
        
        // Inverted Rendering (Upside down)
        ctx.scale(1, -1); 
        
        ctx.font = 'bold 40px "Courier New"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 20;
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
