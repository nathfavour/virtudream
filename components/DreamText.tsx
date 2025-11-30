import React, { useEffect, useState } from 'react';

interface DreamTextProps {
  text: string;
}

const DreamText: React.FC<DreamTextProps> = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  // Random animation delay for the float effect so elements aren't synced
  const [delay] = useState(() => Math.random() * 5); 

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    // Reset state when text changes
    setDisplayedText('');

    const type = () => {
      setDisplayedText((prev) => {
        if (prev.length < text.length) {
          const nextChar = text.charAt(prev.length);
          
          // Organic typing speed: mix of fast bursts and thought pauses
          const speed = Math.random() > 0.9 ? 150 : 30 + Math.random() * 40;
          
          timeoutId = setTimeout(type, speed);
          return prev + nextChar;
        }
        return prev;
      });
    };

    // Initial start delay
    timeoutId = setTimeout(type, 100);

    return () => clearTimeout(timeoutId);
  }, [text]);

  return (
    <span 
      className="inline-block animate-float" 
      style={{ animationDelay: `${delay}s` }}
    >
      {displayedText}
      <span 
        className={`ml-1 inline-block w-1.5 h-5 bg-white/60 align-middle ${
          displayedText.length < text.length ? 'animate-pulse' : 'opacity-0'
        } transition-opacity duration-500`} 
      />
    </span>
  );
};

export default DreamText;