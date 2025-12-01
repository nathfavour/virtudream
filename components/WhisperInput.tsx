import React, { useState, useEffect, useRef } from 'react';
import VoidTypingPortal from './VoidTypingPortal';

interface WhisperInputProps {
  onWhisper: (text: string) => void;
  isLoading: boolean;
  onTypingActivity?: (intensity: number) => void; // Callback to inform parent of typing intensity
}

interface SparkleChar {
  id: number;
  char: string;
  opacity: number;
  createdAt: number;
}

const WhisperInput: React.FC<WhisperInputProps> = ({ onWhisper, isLoading, onTypingActivity }) => {
  const [text, setText] = useState('');
  const [lastChar, setLastChar] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [sparkleChars, setSparkleChars] = useState<SparkleChar[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const typingSpeedRef = useRef({ count: 0, lastTime: Date.now() });
  const lastUpdateRef = useRef(Date.now());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onWhisper(text);
      setText('');
      setSparkleChars([]); // Clear visuals
      // Blur gently to show processing
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const now = Date.now();
    
    // Calculate typing speed (intensity)
    if (val.length > text.length) {
       // New character typed
       const char = val.slice(-1);
       setLastChar(char);
       setTimeout(() => setLastChar(''), 50);

       // Update sparkle visuals
       setSparkleChars(prev => [...prev, {
         id: now,
         char,
         opacity: 1,
         createdAt: now
       }]);

       // Speed calculation
       const timeDiff = now - typingSpeedRef.current.lastTime;
       typingSpeedRef.current.lastTime = now;
       
       // Increment "heat" counter, decay handled in loop
       typingSpeedRef.current.count += Math.max(1, 100 - timeDiff) * 0.5;
    }
    
    setText(val);
  };

  // Animation Loop for visual decay and intensity reporting
  useEffect(() => {
    let animId: number;

    const animate = () => {
      const now = Date.now();
      const dt = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      // 1. Fade out characters (First in, first out visually matches typing order)
      setSparkleChars(prev => prev.map(c => ({
        ...c,
        opacity: c.opacity - dt * 0.8 // Fade speed
      })).filter(c => c.opacity > 0));

      // 2. Decay typing intensity
      typingSpeedRef.current.count *= 0.9; // Fast decay
      
      // Report intensity to parent (for screen shake/blur)
      // Normalize somewhat: 0 to ~50 is normal, >100 is chaos
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
      <VoidTypingPortal inputChar={lastChar} isActive={isFocused} />
      
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative z-20 mt-12">
        <div className={`relative transition-all duration-1000 ${isLoading ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
          
          {/* Custom Visual Input Display (The "Sparkles") */}
          <div 
             className="absolute inset-0 flex items-center justify-center pointer-events-none"
             aria-hidden="true"
          >
             <div className="flex flex-wrap justify-center max-w-full overflow-hidden h-full items-center">
               {sparkleChars.map(c => (
                 <span 
                    key={c.id}
                    className="text-2xl md:text-3xl font-light text-white transition-opacity duration-75 mx-[1px]"
                    style={{ 
                      opacity: c.opacity,
                      textShadow: `0 0 ${10 * c.opacity}px rgba(255,255,255,0.8)`
                    }}
                 >
                   {c.char === ' ' ? '\u00A0' : c.char}
                 </span>
               ))}
             </div>
          </div>

          {/* Actual Input (Invisible but interactive) */}
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            // Hide text color so we see sparkles underneath, but keep caret?
            // Actually, standard caret might look weird with fading text.
            // Let's make text transparent.
            style={{ color: 'transparent', caretColor: 'white' }}
            placeholder={sparkleChars.length === 0 ? "Whisper to the void..." : ""}
            disabled={isLoading}
            className={`
              w-full bg-transparent border-b border-white/20 
              text-2xl md:text-3xl text-center font-light
              placeholder-white/20 focus:outline-none focus:border-white/60
              py-4 transition-all duration-700
              ${isFocused ? 'tracking-widest' : 'tracking-normal'}
            `}
          />
          
          <div className={`
            absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent 
            bottom-0 transition-transform duration-1000 ease-out origin-center
            ${isFocused ? 'scale-x-100' : 'scale-x-0'}
          `} />
        </div>
        
        {isLoading && (
          <div className="absolute top-full left-0 w-full text-center mt-4 text-xs tracking-[0.3em] text-white/40 font-dream animate-pulse">
            DREAMING...
          </div>
        )}
      </form>
    </>
  );
};

export default WhisperInput;