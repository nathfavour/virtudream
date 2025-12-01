import React, { useMemo } from 'react';
import { EntityType, WorldEntity } from '../worldTypes';
import GlobalInputHandler from './GlobalInputHandler';

interface EntityRendererProps {
  entity: WorldEntity;
  cameraZ: number;
  onWhisper?: (text: string) => void;
  isLoading?: boolean;
}

const EntityRenderer: React.FC<EntityRendererProps> = ({ entity, cameraZ, onWhisper, isLoading }) => {
  // Calculate relative distance
  const dist = entity.z - cameraZ;
  
  // Perspective math (CSS handles most, but we might want to fade out if too close/behind)
  // If dist < -500, it's behind us.
  
  const style: React.CSSProperties = {
    transform: `translate3d(${entity.x - 50}vw, ${entity.y - 50}vh, ${entity.z}px) scale(${entity.scale})`,
    position: 'absolute',
    left: '50%',
    top: '50%',
    willChange: 'transform, opacity',
  };

  // Fade out if very close to camera or behind
  // const opacity = dist < 200 ? Math.max(0, (dist + 500) / 700) : 1;
  // style.opacity = opacity;

  switch (entity.type) {
    case EntityType.WHISPER:
      return (
        <div style={style} className="text-center pointer-events-none">
          <p className="text-3xl md:text-5xl font-dream text-white/80 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] tracking-widest mix-blend-screen animate-pulse-slow">
            {entity.content}
          </p>
        </div>
      );
      
    case EntityType.GALAXY:
      return (
        <div style={style} className="pointer-events-none">
          <div 
            className="w-[800px] h-[800px] rounded-full blur-3xl opacity-40 animate-spin-slow"
            style={{
              background: `radial-gradient(circle, hsla(${entity.hue}, 70%, 50%, 0.8) 0%, transparent 70%)`
            }}
          />
        </div>
      );

    case EntityType.FLICKER:
      return (
        <div style={style} className="pointer-events-none">
           <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_20px_white] animate-ping" />
        </div>
      );

    case EntityType.WIDGET_INPUT:
      // A floating input portal
      return (
        <div style={style} className="pointer-events-auto">
           {/* We use GlobalInputHandler visually or logically? 
               User asked for "random widgets". Let's put a visual anchor here.
           */}
           <div className="border border-white/20 p-8 bg-black/50 backdrop-blur-md rounded-full shadow-[0_0_50px_rgba(147,51,234,0.3)] animate-float">
              <span className="font-cyber text-xs tracking-[0.5em] text-cyan-300">NEURAL LINK ACTIVE</span>
           </div>
        </div>
      );

    default:
      return null;
  }
};

export default React.memo(EntityRenderer);
