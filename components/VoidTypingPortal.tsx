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
      
      // Randomize portal position slightly or significantly?
      // "Pop up randomly on the screen"
      // We only move it if it's currently closed or mostly closed (re-opening)
      // Otherwise it feels too jumpy while typing a sentence.
      if (portal.openness < 0.1) {
         portal.targetX = window.innerWidth * 0.2 + Math.random() * window.innerWidth * 0.6;
         portal.targetY = window.innerHeight * 0.2 + Math.random() * window.innerHeight * 0.6;
         
         // Snap to new pos instantly if closed
         portal.x = portal.targetX;
         portal.y = portal.targetY;
      }
      
      portal.openness = 1;

      // PHYSICS: Spawn high-velocity sparks from the rim
      const sparkCount = 12; // More initial sparks
      for(let i=0; i<sparkCount; i++) {
         const angle = Math.random() * Math.PI * 2;
         const velocity = 5 + Math.random() * 10;
         
         // We handle sparks in the render loop for simplicity, 
         // but spawning them here based on input is also valid.
      }
      
      // Text Particle Spawn
      const colorPalette = ['#e879f9', '#22d3ee', '#facc15', '#f87171']; 
      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      particlesRef.current.push({
        id: Date.now() + Math.random(),
        x: portal.x, 
        y: portal.y,
        char: invertChar(inputChar),
        size: 50 + Math.random() * 30,
        rotation: Math.random() * Math.PI * 2,
        color: color,
        life: 1.0,
        velocity: {
          x: (Math.random() - 0.5) * 25, // High explosive velocity
          y: (Math.random() - 0.5) * 25
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
    
    // Spark System for the Portal Rim
    // We'll manage transient visual sparks here in the render loop for performance
    let rimSparks: {x: number, y: number, vx: number, vy: number, life: number}[] = [];

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      const portal = portalStateRef.current;
      
      // ELASTIC PHYSICS for Portal Position
      // We want it to be springy when it moves to a new target
      const springStrength = 0.1;
      const friction = 0.8;
      
      // If we had velocity state, we could do real spring physics
      // For now, simple lerp is okay but let's make it snappier
      portal.x += (portal.targetX - portal.x) * 0.15;
      portal.y += (portal.targetY - portal.y) * 0.15;

      // Snappy decay - closes fast when typing stops
      portal.openness *= 0.92;
      if (portal.openness < 0.001) portal.openness = 0;

      if (portal.openness > 0.001) {
        const radius = 120 * portal.openness;
        const time = Date.now() * 0.005; // Spin speed
        
        // --- 1. THE VOID CIRCLE ---
        ctx.save();
        ctx.translate(portal.x, portal.y);
        ctx.rotate(time * 2); // AGGRESSIVE SPIN of the whole structure
        
        // Pure black hole
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = '#000000';
        ctx.fill();
        
        // --- 2. BLAZING RIM (Thin Sparks) ---
        // Emit new sparks if portal is open
        if (Math.random() > 0.1) {
           for(let i=0; i<3; i++) {
             const angle = Math.random() * Math.PI * 2;
             // Tangential velocity for spin effect
             const speed = 5 + Math.random() * 5;
             rimSparks.push({
               x: Math.cos(angle) * radius,
               y: Math.sin(angle) * radius,
               vx: Math.cos(angle) * speed - Math.sin(angle) * speed * 2, // Spin velocity
               vy: Math.sin(angle) * speed + Math.cos(angle) * speed * 2,
               life: 1.0
             });
           }
        }

        // Render Sparks
        ctx.globalCompositeOperation = 'lighter'; 
        ctx.strokeStyle = '#f59e0b'; // Amber core
        ctx.lineWidth = 1.5;

        // Update and draw sparks
        for (let i = rimSparks.length - 1; i >= 0; i--) {
            const s = rimSparks[i];
            
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.08; // Faster decay
            
            if (s.life <= 0) {
              rimSparks.splice(i, 1);
              continue;
            }
            
            // Draw thin line (streak)
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            // Trail
            ctx.lineTo(s.x - s.vx * 0.5, s.y - s.vy * 0.5);
            
            const alpha = s.life * portal.openness;
            ctx.strokeStyle = `rgba(255, 200, 50, ${alpha})`;
            ctx.stroke();
        }

        // Inner Rim Glow
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 200, 100, ${portal.openness})`;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 30;
        ctx.shadowColor = '#f59e0b';
        ctx.stroke();

        ctx.restore();
      }

      // --- 3. TEXT PHYSICS ---
      ctx.globalCompositeOperation = 'source-over'; 

      particlesRef.current.forEach((p, index) => {
        // Physics: Explosive start, then drag
        const dx = portal.x - p.x;
        const dy = portal.y - p.y;
        
        const dist = Math.sqrt(dx*dx + dy*dy);
        const gravityStrength = 2000 / (dist * dist + 100); 
        
        p.velocity.x += dx * gravityStrength * 0.5;
        p.velocity.y += dy * gravityStrength * 0.5;
        
        // Spin around portal center
        // Tangential force
        const angle = Math.atan2(dy, dx);
        p.velocity.x += Math.cos(angle + Math.PI/2) * 2;
        p.velocity.y += Math.sin(angle + Math.PI/2) * 2;

        p.velocity.x *= 0.92;
        p.velocity.y *= 0.92;

        p.x += p.velocity.x;
        p.y += p.velocity.y;
        
        p.rotation += 0.1;
        p.size *= 0.95;
        p.life -= 0.01;

        if (p.life <= 0 || p.size < 0.5) {
          particlesRef.current.splice(index, 1);
          return;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        
        ctx.font = 'bold 50px "Quicksand"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = p.color;
        
        ctx.shadowBlur = 10;
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