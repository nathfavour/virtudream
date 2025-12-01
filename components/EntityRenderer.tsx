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
             className="bg-white rounded-full shadow-[0_0_20px_white] animate-pulse" 
             style={{ 
               width: `${4 + Math.random() * 8}px`, 
               height: `${4 + Math.random() * 8}px`,
               opacity: 0.5 + Math.random() * 0.5
             }}
           />
        </div>
      );

    case EntityType.PORTAL:
      return (
        <div style={style} className="pointer-events-none group">
           <div className="w-96 h-96 rounded-full border-4 border-white/80 shadow-[0_0_100px_rgba(255,255,255,0.8)] overflow-hidden animate-pulse-slow relative">
              <div className="absolute inset-0 bg-black opacity-90"></div>
              {/* Internal swirl - High Detail */}
              <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#ff00ff_180deg,transparent_360deg)] animate-spin-fast opacity-80 mix-blend-screen"></div>
              {/* Inner Event Horizon */}
              <div className="absolute inset-[10%] bg-black rounded-full border border-purple-500/50"></div>
           </div>
        </div>
      );

    case EntityType.BLOB:
      return (
        <div style={style} className="pointer-events-none">
           {/* CSS Morphing Blob - Randomized colors */}
           <div 
             className="w-64 h-64 opacity-60 backdrop-blur-md animate-blob mix-blend-screen"
             style={{
               background: `linear-gradient(${Math.random() * 360}deg, cyan, purple, pink)`,
               borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
               transition: 'border-radius 5s ease-in-out',
               animationDelay: `${Math.random() * 2}s`
             }}
           ></div>
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