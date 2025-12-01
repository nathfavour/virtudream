import React, { useState, useEffect } from 'react';
import LivingBackground from './components/LivingBackground';
import DreamLayer from './components/DreamLayer';
import VoidLayer from './components/VoidLayer';
import GlobalInputHandler from './components/GlobalInputHandler';
import { DreamMood, DreamFragment } from './types';
import { consultTheDream, manifestVision } from './services/geminiService';

const App: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<DreamMood>(DreamMood.NEUTRAL);
  const [fragments, setFragments] = useState<DreamFragment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [chaosLevel, setChaosLevel] = useState(0); // 0 to 100+

  // Constants for scroll mapping
  const TOTAL_HEIGHT = '300vh'; // Total scrollable height
  
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      const totalDocHeight = document.documentElement.scrollHeight - viewportHeight;
      
      // Calculate normalized progress (0 to 1)
      let progress = scrollY / totalDocHeight;
      if (progress < 0) progress = 0;
      if (progress > 1) progress = 1;
      
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWhisper = async (text: string) => {
    setIsLoading(true);
    const tempId = Date.now().toString();

    // 1. Text Interpretation
    const response = await consultTheDream(text);
    setCurrentMood(response.sentiment);

    // 2. Initial Fragment
    const newFragment: DreamFragment = {
      id: tempId,
      text,
      response: response.echo,
      mood: response.sentiment,
      timestamp: Date.now(),
      imageUrl: undefined 
    };

    setFragments(prev => [...prev, newFragment]);

    // 3. Image Manifestation
    const visionBase64 = await manifestVision(response.visualPrompt);
    
    setFragments(prev => prev.map(f => 
      f.id === tempId ? { ...f, imageUrl: visionBase64 || undefined } : f
    ));
    
    setIsLoading(false);
  };

  const handleTypingActivity = (intensity: number) => {
    // Smooth dampening or direct mapping
    setChaosLevel(intensity);
  };

  // Calculate dynamic style for chaos
  const getChaosStyle = () => {
    if (chaosLevel < 5) return {};
    
    // Random jitter based on chaos level
    const x = (Math.random() - 0.5) * (chaosLevel * 0.2);
    const y = (Math.random() - 0.5) * (chaosLevel * 0.2);
    const blur = chaosLevel > 50 ? (chaosLevel - 50) * 0.1 : 0;
    
    return {
      transform: `translate(${x}px, ${y}px)`,
      filter: `blur(${blur}px)`,
      transition: 'transform 0.05s linear, filter 0.1s ease'
    };
  };

  // Calculate the clip-path radius based on scroll progress
  // We want it to start small and expand to cover the screen
  // Transition happens roughly between 0.3 and 0.8 progress
  const getClipPath = () => {
    // Map progress 0.3 -> 0.8 to Radius 0% -> 150%
    const start = 0.2;
    const end = 0.8;
    
    let percentage = 0;
    if (scrollProgress > start) {
      percentage = ((scrollProgress - start) / (end - start)) * 150;
    }
    
    return `circle(${percentage}% at 50% 50%)`;
  };

  // Dynamic Opacity for the "Black Hole" Rim
  const getRimOpacity = () => {
    const start = 0.2;
    const end = 0.8;
    if (scrollProgress < start || scrollProgress > end) return 0;
    
    // Fade in then out
    const mid = (start + end) / 2;
    if (scrollProgress < mid) {
       return (scrollProgress - start) / (mid - start);
    } else {
       return 1 - ((scrollProgress - mid) / (end - mid));
    }
  };

  return (
    <main className="relative w-full bg-black" style={{ height: TOTAL_HEIGHT }}>
      
      {/* 
        LAYER 1: The Dream Interface (Base Layer) 
        Fixed position, always visible underneath until fully covered
      */}
      <div className="fixed inset-0 z-0" style={getChaosStyle()}>
        <LivingBackground mood={currentMood} isDreaming={isLoading} />
        <DreamLayer 
          fragments={fragments} 
          isLoading={isLoading}
        />
        
        {/* Scroll Prompt at bottom of first layer */}
        <div 
          className="fixed bottom-10 left-0 w-full text-center pointer-events-none transition-opacity duration-500"
          style={{ opacity: 1 - scrollProgress * 3 }}
        >
          <div className="pointer-events-auto px-6 container mx-auto perspective-container">
            <div className="transform rotate-x-12 origin-bottom transition-transform hover:rotate-x-0 duration-500">
               {/* 
                 Global Handler is invisible but active. 
                 We place it here to keep it mounted in the main layer.
               */}
               <GlobalInputHandler 
                  onWhisper={handleWhisper} 
                  isLoading={isLoading} 
                  onTypingActivity={handleTypingActivity}
               />
            </div>
          </div>
        </div>
      </div>

      {/* 
        LAYER 2: The Void (Revealed Layer)
        Fixed position, on top, clipped by the "Black Hole" circle
      */}
      <div 
        className="fixed inset-0 z-20 overflow-hidden pointer-events-none"
        style={{ 
          clipPath: getClipPath(),
          // Enable pointer events only when fully expanded so user can interact with buttons
          pointerEvents: scrollProgress > 0.8 ? 'auto' : 'none' 
        }}
      >
        <VoidLayer />
      </div>

      {/* 
        LAYER 3: The Event Horizon (Glowing Rim)
        Sit on top of the clip boundary to hide the hard edge
      */}
      <div 
        className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center"
        style={{ opacity: getRimOpacity() }}
      >
         {/* 
            This div scales with the clip path. 
            We approximate the visual size of the clip-path circle.
            Since clip-path is %, we need a bit of math or a CSS trick.
            Actually, using a radial-gradient overlay is easier for the glow.
         */}
         <div 
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at center, transparent ${Math.max(0, ((scrollProgress - 0.2) / 0.6) * 150 - 5)}%, rgba(147, 51, 234, 0.5) ${Math.max(0, ((scrollProgress - 0.2) / 0.6) * 150)}%, transparent ${Math.max(0, ((scrollProgress - 0.2) / 0.6) * 150 + 10)}%)`
            }}
         />
      </div>

      {/* Grid Overlay - Global */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.1] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(200px)_scale(2)] z-40 mix-blend-overlay"></div>
      
    </main>
  );
};

export default App;