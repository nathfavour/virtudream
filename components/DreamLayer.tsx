import React, { useRef, useEffect } from 'react';
import DreamText from './DreamText';
import { DreamMood, DreamFragment } from '../types';

interface DreamLayerProps {
  fragments: DreamFragment[];
  isLoading: boolean;
}

const DreamLayer: React.FC<DreamLayerProps> = ({ fragments, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [fragments]);

  return (
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
          <div className="text-center text-white/30 mt-20 fade-in spatial-card relative z-50">
            <div className="border border-white/20 p-16 rounded-2xl bg-black/40 backdrop-blur-xl shadow-[0_0_50px_rgba(255,255,255,0.1)] animate-pulse-slow">
              <p className="text-3xl font-light font-cyber tracking-widest text-cyan-200">SYSTEM ONLINE</p>
              <p className="mt-6 text-lg text-purple-300/80 font-dream animate-pulse">
                Awaiting neural input...
                <span className="block text-xs mt-2 text-white/40 font-mono tracking-normal uppercase opacity-70">
                  [ Type anywhere to transmit signal ]
                </span>
              </p>
            </div>
          </div>
        )}

        {fragments.map((fragment) => (
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

      {/* Input Dock (Removed here as it is lifted to App for layout/z-index reasons with chaos effects, or keep if preferred) */}
      {/* 
         NOTE: We removed the WhisperInput from here because we moved it to App.tsx 
         to better control its position relative to the scroll prompt and chaos effects.
      */}
    </div>
  );
};

export default DreamLayer;
