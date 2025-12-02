import React, { useEffect, useRef } from 'react';
import { useGravity } from '../contexts/GravityContext';

const LiquidCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  
  const positionRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });
  
  const gravityRef = useGravity();

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      // 1. Follow Mouse
      let tx = targetRef.current.x;
      let ty = targetRef.current.y;

      // 2. Apply Gravity from Portals
      const portals = gravityRef.current.portals || [];
      
      if (portals.length > 0) {
         // Find nearest active portal and pull towards its projected center
         // Since we don't have the full matrix here, we approximate using X/Y percentages from worldTypes
         // x is 0-100vw, y is 0-100vh approximately in our render logic
         
         const nearest = portals[0]; // Just take first for now
         const px = (nearest.x / 100) * window.innerWidth;
         const py = (nearest.y / 100) * window.innerHeight;
         
         const dx = px - positionRef.current.x;
         const dy = py - positionRef.current.y;
         const dist = Math.sqrt(dx*dx + dy*dy);
         
         // Strong pull if close
         if (dist < 500) {
            tx += dx * 0.15;
            ty += dy * 0.15;
         }
      }

      // Smooth follow
      positionRef.current.x += (tx - positionRef.current.x) * 0.15;
      positionRef.current.y += (ty - positionRef.current.y) * 0.15;

      const { x, y } = positionRef.current;
      
      // Deformation logic
      const vx = tx - x;
      const vy = ty - y;
      const vel = Math.sqrt(vx*vx + vy*vy);
      const angle = Math.atan2(vy, vx) * (180 / Math.PI);
      
      const scaleX = 1 + Math.min(vel * 0.005, 0.5);
      const scaleY = 1 - Math.min(vel * 0.005, 0.2);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
      }
      
      if (trailRef.current) {
         trailRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleX * 0.8})`;
      }
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  return (
    <>
      <div 
        ref={trailRef}
        className="fixed top-0 left-0 w-8 h-8 rounded-full bg-cyan-500/30 blur-md pointer-events-none z-50 transition-colors duration-300 mix-blend-screen"
      />
      <div 
        ref={cursorRef}
        className="fixed top-0 left-0 w-4 h-4 rounded-full bg-white shadow-[0_0_10px_cyan] pointer-events-none z-50 mix-blend-difference"
      />
    </>
  );
};

export default LiquidCursor;