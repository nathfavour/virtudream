import React, { useEffect, useRef, useState } from 'react';

const LiquidCursor: React.FC = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const targetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Hide default cursor globally
    document.body.style.cursor = 'none';

    const handleMouseMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    let animationFrameId: number;

    const animate = () => {
      // Lerp for smooth follow
      positionRef.current.x += (targetRef.current.x - positionRef.current.x) * 0.15;
      positionRef.current.y += (targetRef.current.y - positionRef.current.y) * 0.15;

      const { x, y } = positionRef.current;
      
      // Calculate velocity for deformation
      const vx = targetRef.current.x - x;
      const vy = targetRef.current.y - y;
      const vel = Math.sqrt(vx*vx + vy*vy);
      const angle = Math.atan2(vy, vx) * (180 / Math.PI);
      
      // Stretch based on velocity
      const scaleX = 1 + Math.min(vel * 0.005, 0.5);
      const scaleY = 1 - Math.min(vel * 0.005, 0.2);

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg) scale(${scaleX}, ${scaleY})`;
      }
      
      if (trailRef.current) {
         // Trail lags more
         trailRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scaleX * 0.8})`;
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
      document.body.style.cursor = 'auto'; // Restore
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Main Cursor Blob */}
      <div 
        ref={cursorRef}
        className="absolute top-0 left-0 w-8 h-8 -ml-4 -mt-4 bg-white mix-blend-difference rounded-full blur-[2px]"
      />
      {/* Trail Blob */}
      <div 
        ref={trailRef}
        className="absolute top-0 left-0 w-6 h-6 -ml-3 -mt-3 bg-cyan-400 opacity-50 mix-blend-screen rounded-full blur-[4px] transition-transform duration-100 ease-out"
      />
    </div>
  );
};

export default LiquidCursor;
