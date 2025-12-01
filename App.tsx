import React, { useState, useEffect, useRef } from 'react';
import LivingBackground from './components/LivingBackground';
import DreamLayer from './components/DreamLayer';
import VoidLayer from './components/VoidLayer';
import BlackHoleTransition from './components/BlackHoleTransition';
import { DreamMood, DreamFragment } from './types';
import { consultTheDream, manifestVision } from './services/geminiService';

const App: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<DreamMood>(DreamMood.NEUTRAL);
  const [fragments, setFragments] = useState<DreamFragment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  
  // Ref for the container to measure scroll
  const containerRef = useRef<HTMLDivElement>(null);

  // We need to manage scroll manually to create the "layers" effect
  useEffect(() => {
    const handleScroll = () => {
      // Logic: 
      // 0 - 100vh: DreamLayer (Normal scroll)
      // 100vh - 150vh: Black Hole Transition (Engulfing)
      // > 150vh: VoidLayer
      
      const scrollY = window.scrollY;
      const viewportHeight = window.innerHeight;
      
      // Calculate transition progress
      // Start transition after scrolling past the first screen + some content
      // Let's say the trigger point is when we scroll past the main content
      // For simplicity in this demo, let's trigger it based on total document height vs viewport
      
      const transitionStart = document.body.scrollHeight - viewportHeight * 2; // Rough estimate, needs refinement based on content
      
      // Better approach: Fixed ranges for this specific effect
      // Let's make the "Black Hole" a section in the middle
      
      const transitionZoneStart = viewportHeight * 1.5; 
      const transitionZoneEnd = viewportHeight * 2.5;
      
      if (scrollY > transitionZoneStart && scrollY < transitionZoneEnd) {
        const progress = (scrollY - transitionZoneStart) / (transitionZoneEnd - transitionZoneStart);
        setScrollProgress(progress);
      } else if (scrollY <= transitionZoneStart) {
        setScrollProgress(0);
      } else {
        setScrollProgress(1);
      }
    };

    window.addEventListener('scroll', handleScroll);
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

  return (
    <main className="relative min-h-[300vh] w-full bg-black">
      {/* 3D Warp Background - Visible mostly in first layer */}
      <div className={`fixed inset-0 z-0 transition-opacity duration-1000 ${scrollProgress > 0.8 ? 'opacity-0' : 'opacity-100'}`}>
         <LivingBackground mood={currentMood} isDreaming={isLoading} />
      </div>

      {/* Layer 1: Dream Interface */}
      {/* We wrap it in a container that fades out as blackhole grows */}
      <div 
        className="relative z-10 transition-opacity duration-500"
        style={{ opacity: 1 - scrollProgress * 2 }} // Fade out faster
      >
        <DreamLayer 
          fragments={fragments} 
          isLoading={isLoading} 
          onWhisper={handleWhisper} 
        />
      </div>

      {/* Spacer for Transition */}
      <div className="h-[100vh] flex items-center justify-center relative z-20">
         <p className="text-white/20 font-cyber tracking-[1em] animate-pulse">APPROACHING EVENT HORIZON</p>
      </div>

      {/* Transition Effect */}
      <BlackHoleTransition scrollProgress={scrollProgress} />

      {/* Layer 2: The Void (New World) */}
      <div className="relative z-30 bg-black min-h-screen">
         <VoidLayer />
      </div>

      {/* Metaverse Grid Overlay - Global but fades with layers */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.15] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(200px)_scale(2)] z-0"></div>
    </main>
  );
};

export default App;