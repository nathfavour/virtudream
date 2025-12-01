import React from 'react';

const VoidLayer: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
      {/* Dynamic Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-red-900/40 backdrop-blur-3xl animate-pulse"></div>
      
      {/* Content Container */}
      <div className="relative z-10 max-w-6xl w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        
        {/* Left: Text Content */}
        <div className="space-y-8">
          <h2 className="text-5xl md:text-7xl font-cyber text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-cyan-200">
            THE DEEP ARCHIVE
          </h2>
          <p className="font-dream text-xl text-purple-100/80 leading-relaxed border-l-2 border-purple-500/50 pl-6">
            Beyond the veil of conscious thought lies the raw data of the universe. 
            Here, dreams are not just rendered; they are stored in the eternal crystal lattice of the metaverse.
          </p>
          
          <div className="grid grid-cols-2 gap-6 mt-12">
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition duration-500 cursor-pointer group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🔮</div>
              <h3 className="font-cyber text-lg text-cyan-300">Origin</h3>
              <p className="text-sm text-white/50 mt-2">The source code of reality.</p>
            </div>
            <div className="p-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition duration-500 cursor-pointer group">
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">🌌</div>
              <h3 className="font-cyber text-lg text-purple-300">Entropy</h3>
              <p className="text-sm text-white/50 mt-2">Chaos manifested as art.</p>
            </div>
          </div>
        </div>

        {/* Right: Visual Abstract */}
        <div className="relative h-[600px] w-full perspective-container flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-black/20 rounded-full blur-3xl"></div>
          
          {/* Floating Monoliths */}
          <div className="w-64 h-96 bg-gradient-to-b from-white/10 to-transparent border border-white/20 backdrop-blur-md rounded-2xl transform rotate-y-12 hover:rotate-y-0 transition duration-1000 shadow-[0_0_50px_rgba(128,0,255,0.2)] flex items-center justify-center">
            <span className="font-cyber text-6xl text-white/10">01</span>
          </div>
          
          <div className="absolute w-64 h-96 bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/20 backdrop-blur-md rounded-2xl transform -translate-x-12 translate-z-10 rotate-y-[-12deg] hover:translate-x-[-3rem] transition duration-1000 flex items-center justify-center">
             <span className="font-cyber text-6xl text-purple-500/10">02</span>
          </div>
        </div>

      </div>
      
      {/* Footer / Connection */}
      <div className="absolute bottom-10 w-full text-center">
        <p className="text-xs tracking-[0.5em] text-white/20 font-cyber">SCROLL TO ASCEND</p>
      </div>
    </div>
  );
};

export default VoidLayer;
