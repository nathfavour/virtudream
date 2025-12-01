import React, { useState, useEffect, useRef } from 'react';
import VoidTypingPortal from './VoidTypingPortal';

interface GlobalInputHandlerProps {
  onWhisper: (text: string) => void;
  isLoading: boolean;
  onTypingActivity?: (intensity: number) => void;
}

interface SparkleChar {
  id: number;
  char: string;
  opacity: number;
  createdAt: number;
  x: number; // Random screen position
  y: number;
}

const GlobalInputHandler: React.FC<GlobalInputHandlerProps> = ({ onWhisper, isLoading, onTypingActivity }) => {
  const [buffer, setBuffer] = useState('');
  const [lastChar, setLastChar] = useState('');
  const [sparkleChars, setSparkleChars] = useState<SparkleChar[]>([]);
  const typingSpeedRef = useRef({ count: 0, lastTime: Date.now() });
  const lastUpdateRef = useRef(Date.now());

  // Handle global keydown
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLoading) return;

      // Handle Submit (Enter)
      if (e.key === 'Enter') {
        if (buffer.trim().length > 0) {
          onWhisper(buffer);
          setBuffer('');
          setSparkleChars([]); // Clear visuals on submit
        }
        return;
      }

      // Handle Backspace
      if (e.key === 'Backspace') {
        setBuffer(prev => prev.slice(0, -1));
        return;
      }

      // Handle standard typing (letters, numbers, symbols, space)
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const char = e.key;
        setBuffer(prev => prev + char);
        setLastChar(char);
        setTimeout(() => setLastChar(''), 50);

        // Visual Effects
        const now = Date.now();
        
        // Random position around center or cursor? Global means center-ish area usually
        // Let's scatter them around the center "void" area
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 200; // 200px spread
        const x = window.innerWidth / 2 + Math.cos(angle) * radius;
        const y = window.innerHeight / 2 + Math.sin(angle) * radius;

        setSparkleChars(prev => [...prev, {
          id: now,
          char,
          opacity: 1,
          createdAt: now,
          x,
          y
        }]);

        // Speed calculation
        const timeDiff = now - typingSpeedRef.current.lastTime;
        typingSpeedRef.current.lastTime = now;
        typingSpeedRef.current.count += Math.max(1, 100 - timeDiff) * 0.5;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buffer, isLoading, onWhisper]);

  // Animation Loop (Shared logic with previous WhisperInput, adapted for global sparkles)
  useEffect(() => {
    let animId: number;
    const animate = () => {
      const now = Date.now();
      const dt = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      // Fade out
      setSparkleChars(prev => prev.map(c => ({
        ...c,
        opacity: c.opacity - dt * 0.8 
      })).filter(c => c.opacity > 0));

      // Decay intensity
      typingSpeedRef.current.count *= 0.9;
      
      if (onTypingActivity) {
         onTypingActivity(typingSpeedRef.current.count);
      }

      animId = requestAnimationFrame(animate);
    };
    
    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [onTypingActivity]);

  return (
    <>
      {/* 3D Portal Effect for typed char */}
      <VoidTypingPortal inputChar={lastChar} isActive={true} />
      
      {/* Floating Text Display Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {sparkleChars.map(c => (
           <span 
              key={c.id}
              className="absolute text-4xl font-light text-white transition-opacity duration-75 font-cyber"
              style={{ 
                left: c.x,
                top: c.y,
                opacity: c.opacity,
                textShadow: `0 0 ${20 * c.opacity}px rgba(255,255,255,0.8), 0 0 ${40 * c.opacity}px rgba(147, 51, 234, 0.5)`,
                transform: `translate(-50%, -50%) scale(${0.5 + c.opacity}) rotate(${c.opacity * 20}deg)`
              }}
           >
             {c.char === ' ' ? '·' : c.char}
           </span>
        ))}
        
        {/* Optional: Show current buffer faintly at bottom center? */}
        {buffer.length > 0 && (
          <div className="absolute bottom-20 left-0 w-full text-center">
             <p className="text-white/20 font-mono text-sm tracking-widest uppercase animate-pulse">
               Transmission Buffer: {buffer}
             </p>
          </div>
        )}
      </div>
    </>
  );
};

export default GlobalInputHandler;
