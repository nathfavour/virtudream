import React, { useState, useEffect, useRef } from 'react';
import VoidTypingPortal from './VoidTypingPortal';

interface WhisperInputProps {
  onWhisper: (text: string) => void;
  isLoading: boolean;
}

const WhisperInput: React.FC<WhisperInputProps> = ({ onWhisper, isLoading }) => {
  const [text, setText] = useState('');
  const [lastChar, setLastChar] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !isLoading) {
      onWhisper(text);
      setText('');
      // Blur gently to show processing
      inputRef.current?.blur();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const char = val.slice(-1); // Get last typed char
    
    // Only trigger if a new character was added (not deleted)
    if (val.length > text.length) {
       setLastChar(char);
       // Reset char after a tick so effect can re-trigger on same char
       setTimeout(() => setLastChar(''), 50);
    }
    
    setText(val);
  };

  return (
    <>
      <VoidTypingPortal inputChar={lastChar} isActive={isFocused} />
      
      <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative z-20 mt-12">
        <div className={`relative transition-all duration-1000 ${isLoading ? 'opacity-50 blur-sm' : 'opacity-100'}`}>
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Whisper to the void..."
            disabled={isLoading}
            className={`
              w-full bg-transparent border-b border-white/20 
              text-2xl md:text-3xl text-center font-light text-white/90
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
