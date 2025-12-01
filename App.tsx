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

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [fragments]);

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
    <main className="relative min-h-screen w-full flex flex-col items-center overflow-hidden perspective-container">
      {/* 3D Warp Background */}
      <LivingBackground mood={currentMood} />

      {/* Main Content with 3D Preserves */}
      <div className="relative z-10 w-full max-w-5xl px-6 py-12 flex flex-col min-h-screen transform-style-3d">
        
        {/* Spatial Header */}
        <header className="text-center mb-20 breathing">
          <h1 className="text-6xl md:text-8xl font-cyber text-white tracking-widest drop-shadow-[0_0_25px_rgba(255,255,255,0.5)]">
            <span className="font-thin">VIRTU</span><span className="font-bold">DREAM</span>
          </h1>
          <p className="mt-4 text-base text-cyan-400/80 tracking-[0.8em] uppercase font-bold text-shadow-glow">
            VirtuWorld Metaverse
          </p>
        </header>

        {/* 3D Stream */}
        <div className="flex-1 w-full space-y-32 mb-40">
          {fragments.length === 0 && (
            <div className="text-center text-white/30 mt-20 fade-in spatial-card">
              <div className="border border-white/10 p-10 rounded-2xl bg-black/20 backdrop-blur-sm">
                <p className="text-xl font-light font-cyber">SYSTEM ONLINE.</p>
                <p className="mt-2 text-sm opacity-60">Awaiting neural input...</p>
              </div>
            </div>
          )}

          {fragments.map((fragment, index) => (
            <div 
              key={fragment.id} 
              className="flex flex-col items-center space-y-8 fade-in spatial-card"
            >
              {/* User Input - Glass Panel */}
              <div className="bg-white/5 backdrop-blur-md border-l-4 border-cyan-500/50 pl-6 pr-4 py-4 rounded-r-lg max-w-2xl w-full shadow-[0_0_30px_rgba(0,0,0,0.5)] transform translate-z-10">
                 <p className="text-cyan-100/80 text-lg font-light tracking-wide italic">
                  "{fragment.text}"
                 </p>
              </div>

              {/* Vision - Floating Hologram */}
              {fragment.imageUrl ? (
                <div className="relative group perspective-container w-full max-w-2xl">
                  <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 to-purple-600 opacity-20 blur-xl group-hover:opacity-40 transition duration-1000 rounded-full"></div>
                  <div className="relative transform transition-all duration-700 group-hover:rotate-y-6 group-hover:scale-105">
                     <img 
                      src={fragment.imageUrl} 
                      alt="VirtuDream Visualization" 
                      className="w-full rounded-lg shadow-2xl border border-white/10"
                    />
                    <div className="absolute inset-0 rounded-lg ring-1 ring-white/20"></div>
                    {/* Scanline overlay */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay pointer-events-none"></div>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-2xl h-80 bg-black/40 border border-white/10 rounded-lg flex flex-col items-center justify-center animate-pulse gap-4">
                  <div className="w-12 h-12 border-4 border-t-cyan-500 border-r-transparent border-b-purple-500 border-l-transparent rounded-full animate-spin"></div>
                  <span className="text-xs tracking-[0.5em] text-cyan-500/60 font-cyber">RENDERING REALITY</span>
                </div>
              )}

              {/* AI Echo - Floating Text */}
              <div className="text-center max-w-3xl relative">
                <div className="absolute -left-8 top-0 text-6xl text-white/5 font-serif select-none">"</div>
                <p className="font-dream text-2xl md:text-3xl text-white/90 leading-relaxed drop-shadow-lg mix-blend-screen">
                  <DreamText text={fragment.response} />
                </p>
                <div className="mt-8 flex justify-center items-center gap-4">
                  <div className="h-px w-20 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                  <div className="w-2 h-2 rotate-45 bg-purple-500/50"></div>
                  <div className="h-px w-20 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
                </div>
              </div>
            </div>
          ))}
          <div ref={scrollRef} />
        </div>

        {/* Input Dock */}
        <div className="fixed bottom-0 left-0 w-full pb-10 pt-32 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none z-50">
          <div className="pointer-events-auto px-6 container mx-auto perspective-container">
            <div className="transform rotate-x-12 origin-bottom transition-transform hover:rotate-x-0 duration-500">
               <WhisperInput onWhisper={handleWhisper} isLoading={isLoading} />
            </div>
          </div>
        </div>

      </div>

      {/* Metaverse Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.15] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(200px)_scale(2)]"></div>
      
    </main>
  );
};

export default App;