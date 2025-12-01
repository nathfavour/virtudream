import React from 'react';

const VoidLayer: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-black">
      {/* 
        Ultra High Visuals:
        Complex layered gradients using mix-blend-modes and animations 
      */}
      
      {/* Layer 1: The Deep Space Base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900 via-black to-black opacity-80"></div>

      {/* Layer 2: The "Glassy-Purplish-Goldish-Reddish" Nebulas */}
      {/* Rotating Conic Gradient for movement */}
      <div className="absolute inset-0 opacity-60 mix-blend-screen animate-spin-slow duration-[60s]">
        <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg_at_50%_50%,_#4c0519_0deg,_#581c87_120deg,_#b45309_240deg,_#4c0519_360deg)] blur-3xl opacity-40"></div>
      </div>
      
      {/* Layer 3: Floating Prisms / Glass Shards */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-tr from-purple-500/20 to-amber-500/20 rounded-full blur-2xl animate-blob mix-blend-plus-lighter"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-rose-500/20 to-cyan-500/20 rounded-full blur-2xl animate-blob animation-delay-2000 mix-blend-plus-lighter"></div>

      {/* Layer 4: The Grid Floor (Perspective) */}
      <div className="absolute bottom-0 w-[200%] h-[50%] bg-[linear-gradient(transparent_0%,_rgba(255,215,0,0.1)_100%)] [mask-image:linear-gradient(to_bottom,transparent,black)]">
        <div className="w-full h-full bg-[size:100px_100px] bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] transform perspective(1000px) rotateX(60deg) origin-top"></div>
      </div>

      {/* Content Container - Glassmorphism */}
      <div className="relative z-10 max-w-7xl w-full px-6 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* Visual Element - Left Side Enlarging View */}
        <div className="md:col-span-5 relative perspective-container group">
           <div className="relative w-full aspect-[3/4] rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_0_100px_rgba(139,92,246,0.3)] overflow-hidden transform transition-all duration-1000 hover:scale-105 hover:rotate-y-6">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-amber-500/10 mix-blend-overlay"></div>
              
              {/* Inner Content of the Card */}
              <div className="p-8 h-full flex flex-col justify-end">
                <h3 className="text-4xl font-cyber text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-purple-200 mb-2">ARCHIVE_01</h3>
                <p className="text-white/60 font-dream text-sm">The memories of the machine.</p>
              </div>

              {/* Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shine"></div>
           </div>
        </div>

        {/* Text Content - Right Side */}
        <div className="md:col-span-7 space-y-10 text-right">
          <h2 className="text-7xl md:text-9xl font-cyber font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
            ASCENSION
          </h2>
          <p className="text-2xl text-indigo-200/80 font-dream leading-relaxed max-w-2xl ml-auto">
            You have crossed the event horizon. The data here is raw, unfiltered, and alive. 
            <span className="text-amber-300 block mt-4">Welcome to the inner sanctum of the VirtuDream.</span>
          </p>
          
          <div className="flex justify-end gap-6 pt-10">
            <button className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/20 rounded-full font-cyber tracking-widest text-sm transition-all hover:scale-110 hover:border-purple-500 hover:shadow-[0_0_20px_rgba(168,85,247,0.5)]">
              INITIATE
            </button>
            <button className="px-8 py-4 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/50 rounded-full font-cyber tracking-widest text-sm transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]">
              EXPLORE
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default VoidLayer;