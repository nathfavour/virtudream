import React, { useState, useEffect, useRef, useCallback } from 'react';
import LivingBackground from './components/LivingBackground';
import GlobalInputHandler from './components/GlobalInputHandler';
import EntityRenderer from './components/EntityRenderer';
import { DreamMood, DreamFragment } from './types';
import { WorldEntity, EntityType, WHISPER_DATA } from './worldTypes';
import { consultTheDream, manifestVision } from './services/geminiService';

const App: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<DreamMood>(DreamMood.NEUTRAL);
  const [isLoading, setIsLoading] = useState(false);
  const [chaosLevel, setChaosLevel] = useState(0); 

  // --- INFINITE WORLD STATE ---
  // Start at a random "deep" coordinate to ensure no two loads are identical
  const [cameraZ, setCameraZ] = useState(() => Math.random() * 5000 + 1000);
  const [entities, setEntities] = useState<WorldEntity[]>([]);
  
  // Generation boundaries
  const RENDER_DISTANCE = 3000;
  const GENERATION_CHUNK = 1000;
  const lastGenZ = useRef(0);

  // Initial Generation on Mount
  useEffect(() => {
    // Generate initial world around the random start point
    const initialEntities: WorldEntity[] = [];
    // Generate range: cameraZ - 1000 to cameraZ + 3000
    for (let z = cameraZ - 1000; z < cameraZ + 3000; z += Math.random() * 300 + 200) {
       initialEntities.push(generateRandomEntity(z));
    }
    setEntities(initialEntities);
    lastGenZ.current = cameraZ;
  }, []);

  const generateRandomEntity = (z: number): WorldEntity => {
    const r = Math.random();
    let type = EntityType.FLICKER;
    let scale = 1;
    let content = undefined;
    let hue = 0;

    if (r > 0.8) {
      type = EntityType.WHISPER;
      content = WHISPER_DATA[Math.floor(Math.random() * WHISPER_DATA.length)];
      scale = 1 + Math.random();
    } else if (r > 0.6) {
      type = EntityType.GALAXY;
      hue = Math.random() * 360;
      scale = 2 + Math.random() * 3;
    } else if (r > 0.95) {
      type = EntityType.WIDGET_INPUT;
    }

    // Spread X/Y widely (-100 to 200%) to create a tunnel feel
    return {
      id: Math.random().toString(36).substr(2, 9),
      type,
      x: (Math.random() - 0.5) * 150 + 50, // Center bias? No, random spread
      y: (Math.random() - 0.5) * 150 + 50,
      z: z,
      scale,
      content,
      hue
    };
  };

  // Procedural Generation Loop
  useEffect(() => {
    // Check if we need to generate more in front or behind
    // For simplicity, let's just keep a buffer ahead of the camera
    // If camera moves past lastGenZ + threshold, generate more
    
    // NOTE: This assumes mostly forward travel. For bidirectional, we'd need min/max checks.
    // Let's implement simple "horizon" check.
    
    const horizon = cameraZ + RENDER_DISTANCE;
    
    setEntities(prev => {
      const next = [...prev];
      let changed = false;
      
      // 1. Remove entities too far behind (cameraZ - 1500)
      const keepThreshold = cameraZ - 1500;
      const filtered = next.filter(e => e.z > keepThreshold);
      if (filtered.length !== next.length) changed = true;
      
      // 2. Add entities if horizon is empty
      // Find max Z
      let maxZ = filtered.length > 0 ? Math.max(...filtered.map(e => e.z)) : cameraZ;
      
      if (maxZ < horizon) {
        while (maxZ < horizon) {
          maxZ += Math.random() * 400 + 200; // Step size
          filtered.push(generateRandomEntity(maxZ));
          changed = true;
        }
      }
      
      // Also handle BACKWARDS scrolling (generating behind)
      let minZ = filtered.length > 0 ? Math.min(...filtered.map(e => e.z)) : cameraZ;
      const rearHorizon = cameraZ - 1000;
      if (minZ > rearHorizon) {
         while (minZ > rearHorizon) {
           minZ -= Math.random() * 400 + 200;
           filtered.push(generateRandomEntity(minZ));
           changed = true;
         }
      }

      return changed ? filtered : prev;
    });
    
  }, [cameraZ]);

  // Scroll Handling (Zoom)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      const delta = e.deltaY;
      // Move cameraZ. Positive delta (scroll down) = Move forward (+Z)
      // Speed multiplier
      setCameraZ(prev => prev + delta * 2);
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleWhisper = async (text: string) => {
    setIsLoading(true);
    // Add a specific whisper entity right in front of the camera
    const newEntity: WorldEntity = {
      id: Date.now().toString(),
      type: EntityType.WHISPER,
      x: 50,
      y: 50,
      z: cameraZ + 500, // Just ahead
      scale: 2,
      content: text
    };
    
    setEntities(prev => [...prev, newEntity]);
    
    // AI Processing (Side effect, doesn't block UI anymore)
    const response = await consultTheDream(text);
    setCurrentMood(response.sentiment);
    
    // Spawn response echo further down
    setTimeout(() => {
       setEntities(prev => [...prev, {
         id: Date.now() + 'echo',
         type: EntityType.WHISPER,
         x: 50 + (Math.random()-0.5)*20,
         y: 50 + (Math.random()-0.5)*20,
         z: cameraZ + 1200,
         scale: 3,
         content: response.echo
       }]);
    }, 1000);

    setIsLoading(false);
  };

  const handleTypingActivity = (intensity: number) => {
    setChaosLevel(intensity);
  };

  const getChaosStyle = () => {
    const active = chaosLevel > 0;
    let x = active ? (Math.random() - 0.5) * 1 : 0;
    let y = active ? (Math.random() - 0.5) * 1 : 0;
    let blur = 0;
    let scale = 1;

    if (chaosLevel > 5) {
       x = (Math.random() - 0.5) * (chaosLevel * 0.2);
       y = (Math.random() - 0.5) * (chaosLevel * 0.2);
    }
    
    if (chaosLevel > 10) {
       scale = 1 + Math.sin(Date.now() * 0.05) * 0.005 * chaosLevel; 
    }
    
    if (chaosLevel > 50) {
      blur = (chaosLevel - 50) * 0.1;
    }
    
    return {
      transform: `translate(${x}px, ${y}px) scale(${scale})`,
      filter: `blur(${blur}px)`,
      transition: 'transform 0.05s linear, filter 0.1s ease',
      transformOrigin: 'center center'
    };
  };

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden">
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
         <LivingBackground mood={currentMood} isDreaming={isLoading} />
      </div>

      {/* 3D Perspective Container */}
      <div 
        className="relative w-full h-full perspective-container"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {/* World Transform Wrapper (Moves opposite to camera to simulate travel) */}
        <div 
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{ 
            transform: `translateZ(${-cameraZ}px)`, // Move the world!
            transformStyle: 'preserve-3d',
            ...getChaosStyle() // Apply chaos to the world container
          }}
        >
           {entities.map(entity => (
             <EntityRenderer 
               key={entity.id} 
               entity={entity} 
               cameraZ={cameraZ} 
             />
           ))}
        </div>
      </div>

      {/* Global Input HUD (Fixed on screen, separate from world space) */}
      <div className="fixed inset-0 z-50 pointer-events-none">
         <div className="pointer-events-auto w-full h-full">
             <GlobalInputHandler 
                onWhisper={handleWhisper} 
                isLoading={isLoading} 
                onTypingActivity={handleTypingActivity}
             />
         </div>
      </div>

      {/* Depth Indicator */}
      <div className="fixed bottom-10 right-10 text-right pointer-events-none z-40">
         <p className="text-white/20 font-cyber text-xs tracking-[0.2em]">
           COORD_Z: {Math.floor(cameraZ)}
         </p>
      </div>

      {/* Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.1] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(200px)_scale(2)] z-40 mix-blend-overlay"></div>
      
    </main>
  );
};

export default App;