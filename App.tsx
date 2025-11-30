import React, { useState, useEffect, useRef } from 'react';
import LivingBackground from './components/LivingBackground';
import WhisperInput from './components/WhisperInput';
import DreamText from './components/DreamText';
import { DreamMood, DreamFragment } from './types';
import { consultTheDream, manifestVision } from './services/geminiService';

const App: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<DreamMood>(DreamMood.NEUTRAL);
  const [fragments, setFragments] = useState<DreamFragment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll gently when new fragments appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [fragments]);

  const handleWhisper = async (text: string) => {
    setIsLoading(true);
    
    // Create a temporary ID
    const tempId = Date.now().toString();

    // 1. Get Text Interpretation
    const response = await consultTheDream(text);
    
    // Update Mood instantly for immediate feedback
    setCurrentMood(response.sentiment);

    // 2. Generate Vision (Image) in parallel with slight delay for dramatic effect
    // We update the fragment without image first, then add image when ready
    const newFragment: DreamFragment = {
      id: tempId,
      text,
      response: response.echo,
      mood: response.sentiment,
      timestamp: Date.now(),
      imageUrl: undefined // Loading state for image
    };

    setFragments(prev => [...prev, newFragment]);

    // Now fetch the image
    const visionBase64 = await manifestVision(response.visualPrompt);
    
    // Update the specific fragment with the image
    setFragments(prev => prev.map(f => 
      f.id === tempId ? { ...f, imageUrl: visionBase64 || undefined } : f
    ));
    
    setIsLoading(false);
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center overflow-hidden">
      {/* Dynamic Background */}
      <LivingBackground mood={currentMood} />

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-4xl px-6 py-12 flex flex-col min-h-screen">
        
        {/* Header */}
        <header className="text-center mb-16 breathing">
          <h1 className="text-5xl md:text-7xl font-dream text-white/80 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            ONEIRIC
          </h1>
          <p className="mt-4 text-sm text-white/40 tracking-[0.5em] uppercase">
            The Interface is Alive
          </p>
        </header>

        {/* Dream Stream */}
        <div className="flex-1 w-full space-y-24 mb-32">
          {fragments.length === 0 && (
            <div className="text-center text-white/20 mt-20 fade-in">
              <p className="text-lg font-light italic">"The silence is loud here. Speak, and let the dream take shape."</p>
            </div>
          )}

          {fragments.map((fragment, index) => (
            <div 
              key={fragment.id} 
              className={`flex flex-col items-center space-y-8 fade-in transition-all duration-1000 delay-100`}
            >
              {/* User's Whisper */}
              <div className="text-white/60 text-lg font-light tracking-wide italic border-l-2 border-white/10 pl-4 py-2">
                "{fragment.text}"
              </div>

              {/* The Manifestation (Image) */}
              {fragment.imageUrl ? (
                <div className="relative group cursor-none">
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/20 to-transparent opacity-30 blur-lg group-hover:opacity-60 transition duration-1000"></div>
                  <img 
                    src={fragment.imageUrl} 
                    alt="Dream manifestation" 
                    className="relative w-full max-w-md rounded-sm shadow-2xl opacity-90 hover:opacity-100 transition duration-700 hover:scale-[1.01] filter sepia-[0.3] contrast-125"
                  />
                  <div className="absolute inset-0 bg-black/10 mix-blend-overlay pointer-events-none"></div>
                </div>
              ) : (
                <div className="w-full max-w-md h-64 bg-white/5 animate-pulse rounded flex items-center justify-center">
                  <span className="text-xs tracking-widest text-white/20">MANIFESTING VISION...</span>
                </div>
              )}

              {/* The Echo (AI Response) */}
              <div className="text-center max-w-lg">
                <p className="font-dream text-2xl md:text-3xl text-white/90 leading-relaxed drop-shadow-md">
                  <DreamText text={fragment.response} />
                </p>
                <div className="mt-4 h-px w-12 bg-white/30 mx-auto"></div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Sticky Footer Input */}
        <div className="fixed bottom-0 left-0 w-full pb-12 pt-24 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
          <div className="pointer-events-auto px-6">
            <WhisperInput onWhisper={handleWhisper} isLoading={isLoading} />
          </div>
        </div>

      </div>

      {/* Decorative Overlays for "Glitch/Dream" feel */}
      <div className="fixed inset-0 pointer-events-none mix-blend-overlay opacity-[0.03]" 
           style={{ backgroundImage: `url('https://www.transparenttextures.com/patterns/noise.png')` }}></div>
      
    </main>
  );
};

export default App;