import React, { useMemo } from 'react';
import { EntityType, WorldEntity } from '../worldTypes';

interface EntityRendererProps {
  entity: WorldEntity;
  cameraZ: number; // We might not need this prop if we rely on CSS 3D, but helpful for culling logic if needed
}

const EntityRenderer: React.FC<EntityRendererProps> = ({ entity }) => {
  
  // Clean translation style
  const style: React.CSSProperties = {
    transform: `translate3d(${entity.x - 50}vw, ${entity.y - 50}vh, ${entity.z}px) scale(${entity.scale})`,
    position: 'absolute',
    left: '50%',
    top: '50%',
    willChange: 'transform', // optimizing hint
    backfaceVisibility: 'hidden', // Text fix?
    WebkitFontSmoothing: 'antialiased',
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
           <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_20px_white] animate-pulse" />
        </div>
      );

    case EntityType.PORTAL:
      return (
        <div style={style} className="pointer-events-none group">
           <div className="w-64 h-64 rounded-full border-2 border-white/50 shadow-[0_0_50px_rgba(255,255,255,0.5)] overflow-hidden animate-pulse-slow">
              <div className="absolute inset-0 bg-black opacity-80"></div>
              {/* Internal swirl */}
              <div className="absolute inset-[-50%] bg-[conic-gradient(from_0deg,transparent_0deg,#ff00ff_180deg,transparent_360deg)] animate-spin-fast opacity-50 mix-blend-screen"></div>
           </div>
        </div>
      );

    case EntityType.BLOB:
      return (
        <div style={style} className="pointer-events-none">
           {/* CSS Morphing Blob */}
           <div 
             className="w-48 h-48 bg-gradient-to-br from-cyan-500/40 to-purple-600/40 backdrop-blur-sm animate-blob mix-blend-plus-lighter"
             style={{
               borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
               transition: 'border-radius 5s ease-in-out'
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

// Optimization: memoize based on entity properties changes only
export default React.memo(EntityRenderer, (prev, next) => {
  return prev.entity.id === next.entity.id && 
         prev.entity.z === next.entity.z; // Re-render if Z changes? Actually CSS handles Z via parent container usually? 
         // Wait, the parent loop renders this with a style based on entity.z.
         // If entity.z is constant (world position), we don't need to re-render.
         // The CAMERA moves, not the entity (in world space).
         // So yes, aggressive memoization is key.
});