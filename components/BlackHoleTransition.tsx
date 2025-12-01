import React, { useEffect, useState } from 'react';

interface BlackHoleTransitionProps {
  scrollProgress: number; // 0 to 1 based on scroll position in transition zone
}

const BlackHoleTransition: React.FC<BlackHoleTransitionProps> = ({ scrollProgress }) => {
  // Scale from 0 to massive (e.g., 50) to engulf screen
  // Start scaling only after some threshold if needed, but here we assume scrollProgress maps 0->1 for the effect
  
  // Create an exponential scale effect so it starts slow and accelerates
  const scale = Math.pow(scrollProgress * 4, 3); 
  const opacity = Math.min(scrollProgress * 2, 1);

  if (scrollProgress <= 0) return null;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden"
      style={{ opacity: scrollProgress > 0.95 ? 0 : 1 }} // Hide when fully engulfed to reveal next layer cleanly if needed
    >
      <div 
        className="rounded-full bg-black shadow-[0_0_100px_rgba(0,0,0,1)]"
        style={{
          width: '200px',
          height: '200px',
          transform: `scale(${scale})`,
          transition: 'transform 0.1s linear', // smooth update
        }}
      >
        {/* Accretion Disk / Glow */}
        <div className="absolute inset-0 rounded-full border-4 border-purple-500/50 blur-xl opacity-50 animate-spin-slow"></div>
        <div className="absolute -inset-4 rounded-full border border-cyan-500/30 blur-md opacity-30 animate-reverse-spin"></div>
      </div>
    </div>
  );
};

export default BlackHoleTransition;
