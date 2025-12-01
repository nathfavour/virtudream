import React, { useMemo } from 'react';
import { EntityType, WorldEntity } from '../worldTypes';

interface EntityRendererProps {
  entity: WorldEntity;
  cameraZ: number; 
}

const EntityRenderer: React.FC<EntityRendererProps> = ({ entity, cameraZ }) => {
  // Calculate relative distance for LOD (Level of Detail)
  const dist = entity.z - cameraZ;
  
  // LOD Thresholds
  const isClose = dist < 800 && dist > -200;
  
  // Opacity fade as we pass through
  let opacity = 1;
  if (dist < 100 && dist > -500) {
     opacity = Math.max(0, (dist + 500) / 600); // Fade out as we pass
  }

  // Clean translation style
  const style: React.CSSProperties = {
    transform: `translate3d(${entity.x - 50}vw, ${entity.y - 50}vh, ${entity.z}px) scale(${entity.scale})`,
    position: 'absolute',
    left: '50%',
    top: '50%',
    willChange: 'transform', 
    backfaceVisibility: 'hidden',
    opacity
  };

  switch (entity.type) {
    case EntityType.WHISPER:
      return (
        <div style={style} className="text-center pointer-events-none select-none">
          <p className="text-4xl md:text-6xl font-dream text-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] tracking-widest mix-blend-screen whitespace-nowrap">
            {entity.content}
          </p>
        </div>
      );
      
    case EntityType.GALAXY:
      // LOD: Distant = Blur, Close = Blazing Sun
      if (isClose) {
        return (
          <div style={style} className="pointer-events-none">
             {/* BLAZING SUN LOD */}
             <div className="w-[1200px] h-[1200px] rounded-full relative animate-spin-slow">
                {/* Core */}
                <div className="absolute inset-[10%] bg-white rounded-full shadow-[0_0_100px_white] blur-md"></div>
                {/* Corona */}
                <div className="absolute inset-0 rounded-full blur-xl opacity-80" 
                     style={{ background: `radial-gradient(circle, hsla(${entity.hue}, 100%, 70%, 1) 0%, transparent 70%)` }}>
                </div>
                {/* Solar Flares / Spots (Animated CSS) */}
                <div className="absolute inset-0 rounded-full overflow-hidden mix-blend-overlay">
                   <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 animate-pulse-fast"></div>
                </div>
             </div>
          </div>
        );
      }
      // Distant Blob
      return (
        <div style={style} className="pointer-events-none">
          <div 
            className="w-[1000px] h-[1000px] rounded-full blur-3xl opacity-30 animate-spin-slow"
            style={{
              background: `radial-gradient(circle, hsla(${entity.hue}, 80%, 60%, 0.6) 0%, transparent 60%)`
            }}
          />
        </div>
      );

    case EntityType.FLICKER:
      return (
        <div style={style} className="pointer-events-none">
           <div 
             className="bg-white rounded-full shadow-[0_0_10px_white] animate-pulse" 
             style={{ 
               width: `${2 + Math.random() * 6}px`, 
               height: `${2 + Math.random() * 6}px`,
               opacity: 0.3 + Math.random() * 0.7
             }}
           />
        </div>
      );

    case EntityType.PORTAL:
      // A "Sub-Scene" Portal: A window into another world
      // It must look like a complete miniature environment
      return (
        <div style={style} className="pointer-events-none group">
           {/* The Container / Window */}
           <div className="w-[800px] h-[800px] rounded-full border-[20px] border-double border-white/20 shadow-[0_0_200px_rgba(255,255,255,0.4)] overflow-hidden relative animate-spin-very-slow backdrop-blur-sm">
              
              {/* The "World" Inside - Distinct Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black opacity-90"></div>
              
              {/* Inner Scene Elements (The "Website within a website" feel) */}
              <div className="absolute inset-0 animate-pulse-slow">
                 {/* Mini Suns */}
                 <div className="absolute top-[20%] left-[30%] w-32 h-32 bg-yellow-300 rounded-full blur-xl animate-float"></div>
                 <div className="absolute bottom-[20%] right-[30%] w-48 h-48 bg-pink-500 rounded-full blur-2xl animate-float" style={{ animationDelay: '1s' }}></div>
                 
                 {/* Mini Grid/Structure */}
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 mix-blend-overlay"></div>
                 
                 {/* Swirling Vapors */}
                 <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,cyan_90deg,transparent_180deg)] animate-spin-slow opacity-30 mix-blend-screen"></div>
              </div>

              {/* The Rim/Frame */}
              <div className="absolute inset-0 rounded-full border-[40px] border-white/5 opacity-50"></div>
           </div>
        </div>
      );

    case EntityType.BLOB:
      // Formless Blob Logic:
      // Using SVG filter for turbulent displacement would be ideal but complex to inject here per element.
      // Instead, we use multiple layered organic shapes with rapid independent animations to simulate "roiling" formless fluid.
      
      const seed = entity.id.charCodeAt(0) % 5;
      
      return (
        <div style={style} className="pointer-events-none">
           <div className="relative w-96 h-96 opacity-70 mix-blend-screen">
             {/* Core turbulence */}
             <div 
               className="absolute inset-0 bg-gradient-to-tr from-cyan-400 to-purple-500 blur-xl animate-blob" 
               style={{ 
                  borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                  animationDuration: '3s',
                  transform: `rotate(${Math.random()*360}deg)`
               }}
             />
             {/* Secondary roiling layer */}
             <div 
               className="absolute inset-4 bg-gradient-to-bl from-pink-500 to-transparent blur-lg animate-blob"
               style={{ 
                  borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                  animationDuration: '4s', 
                  animationDirection: 'reverse',
                  opacity: 0.8
               }}
             />
             {/* "Defects" - Sharp erratic sparks inside */}
             <div className="absolute inset-0 animate-spin-slow opacity-50">
                <div className="w-full h-full border-t-2 border-white/40 rounded-full skew-x-12 blur-sm"></div>
             </div>
           </div>
        </div>
      );

    case EntityType.WIDGET_INPUT:
      return (
        <div style={style} className="pointer-events-auto">
           <div className="border border-white/20 px-6 py-3 bg-black/50 backdrop-blur-md rounded-full shadow-[0_0_30px_rgba(147,51,234,0.3)] animate-float">
              <span className="font-cyber text-xs tracking-[0.3em] text-cyan-300 whitespace-nowrap">NEURAL LINK ACTIVE</span>
           </div>
        </div>
      );

    default:
      return null;
  }
};

export default React.memo(EntityRenderer, (prev, next) => {
  // CRITICAL: We MUST re-render if cameraZ changes significantly
  const distPrev = prev.entity.z - prev.cameraZ;
  const distNext = next.entity.z - next.cameraZ;
  
  const wasClose = distPrev < 800;
  const isClose = distNext < 800;
  
  if (wasClose !== isClose) return false;
  return prev.entity.id === next.entity.id && prev.cameraZ === next.cameraZ;
});