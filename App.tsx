import React, { useState, useEffect, useRef } from 'react';
import LivingBackground from './components/LivingBackground';
import GlobalInputHandler from './components/GlobalInputHandler';
import EntityRenderer from './components/EntityRenderer';
import LiquidCursor from './components/LiquidCursor';
import PhysicsBubbles from './components/PhysicsBubbles';
import { DreamMood, DreamFragment } from './types';
import { WorldEntity, EntityType, WHISPER_DATA } from './worldTypes';
import { consultTheDream, manifestVision } from './services/geminiService';
import { generateRelevantEntity, getBiomeAtDepth } from './relevanceAlgorithm';

const App: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<DreamMood>(DreamMood.NEUTRAL);
  const [isLoading, setIsLoading] = useState(false);
  const [chaosLevel, setChaosLevel] = useState(0); 
  const [currentBiome, setCurrentBiome] = useState<string>('VOID');

  // --- INFINITE WORLD STATE ---
  const cameraZRef = useRef(Math.random() * 5000 + 1000);
  const targetCameraZRef = useRef(cameraZRef.current);
  const worldContainerRef = useRef<HTMLDivElement>(null);
  
  const [entities, setEntities] = useState<WorldEntity[]>([]);
  
  // Generation boundaries
  const RENDER_DISTANCE = 4000;
  const lastGenZ = useRef(0);

  // Initial Generation
  useEffect(() => {
    const initialEntities: WorldEntity[] = [];
    const startZ = cameraZRef.current;
    // Generate deeper range for smoothness
    for (let z = startZ - 2000; z < startZ + 4000; z += Math.random() * 300 + 200) {
       initialEntities.push(generateRelevantEntity(z, 0));
    }
    setEntities(initialEntities);
    lastGenZ.current = startZ;
  }, []);

  // Mouse tracking for perspective steering
  const mouseRef = useRef({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Normalize -1 to 1
      mouseRef.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Scroll / Zoom Loop (RequestAnimationFrame)
  useEffect(() => {
    let animId: number;

    const loop = () => {
      // Smooth Lerp Camera Z
      const diff = targetCameraZRef.current - cameraZRef.current;
      const velocity = diff * 0.05;
      
      cameraZRef.current += velocity; 

      // MOUSE STEERING
      // Shift the vanishing point opposite to mouse to look around
      const steerX = mouseRef.current.x * -500; // Pixels shift
      const steerY = mouseRef.current.y * -500;

      // Update DOM directly for zero-latency scroll
      if (worldContainerRef.current) {
        // Combined Z-travel and XY-steering
        worldContainerRef.current.style.transform = `translate3d(${steerX}px, ${steerY}px, ${-cameraZRef.current}px)`;
      }

      // Procedural Generation Check
      const currentZ = cameraZRef.current;
      const horizon = currentZ + RENDER_DISTANCE;
      const rearHorizon = currentZ - 2000;

      // Update global biome state for background
      // Debounce or only update if changed
      // getBiomeAtDepth is cheap
      // We can use a ref to track and set state only on change
      const newBiome = getBiomeAtDepth(currentZ);
      // We can't access state 'currentBiome' inside this closure safely without deps or ref
      // Just emit event or use another ref if we want to avoid re-renders loop
      // But we can trigger a state update if needed.
      // Let's rely on an effect outside the loop or update a Ref that LivingBackground reads?
      // LivingBackground takes props. State update is needed.
      // Only set if different (React handles this check but calling setState in loop is bad)
      
      // Let's store biome in a ref for the loop, and sync to state throttled?
      // Actually, we can just update it in the interval check below
      
      // Only trigger React state update if we crossed a threshold to avoid stutter
      if (Math.abs(currentZ - lastGenZ.current) > 500) {
         // Update Biome UI
         setCurrentBiome(newBiome);

         setEntities(prev => {
            const next = [...prev];
            const filtered = next.filter(e => e.z > rearHorizon);
            
            let maxZ = filtered.length > 0 ? Math.max(...filtered.map(e => e.z)) : currentZ;
            let added = false;
            
            while (maxZ < horizon) {
              maxZ += Math.random() * 400 + 200;
              // Pass velocity to generation algorithm for context awareness
              filtered.push(generateRelevantEntity(maxZ, velocity));
              added = true;
            }
            
            let minZ = filtered.length > 0 ? Math.min(...filtered.map(e => e.z)) : currentZ;
            while (minZ > rearHorizon) {
               minZ -= Math.random() * 400 + 200;
               filtered.push(generateRelevantEntity(minZ, velocity));
               added = true;
            }

            if (added || filtered.length !== next.length) {
               lastGenZ.current = currentZ;
               return filtered;
            }
            return prev;
         });
      }

      animId = requestAnimationFrame(loop);
    };
    
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Event Listener for Wheel (Updates Target, not State)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Zoom Sensitivity
      const speed = 2.5; 
      targetCameraZRef.current += e.deltaY * speed;
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleWhisper = async (text: string) => {
    setIsLoading(true);
    const newEntity: WorldEntity = {
      id: Date.now().toString(),
      type: EntityType.WHISPER,
      x: 50,
      y: 50,
      z: cameraZRef.current + 800, 
      scale: 2,
      content: text
    };
    
    setEntities(prev => [...prev, newEntity]);
    
    const response = await consultTheDream(text);
    setCurrentMood(response.sentiment);
    
    setTimeout(() => {
       setEntities(prev => [...prev, {
         id: Date.now() + 'echo',
         type: EntityType.WHISPER,
         x: 50 + (Math.random()-0.5)*30,
         y: 50 + (Math.random()-0.5)*30,
         z: cameraZRef.current + 1500, // Further out
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
    <main className="relative w-full h-screen bg-black overflow-hidden cursor-none">
      <LiquidCursor />
      
      {/* Background */}
      <div className="fixed inset-0 z-0 transition-colors duration-[2000ms]">
         <LivingBackground mood={currentMood} isDreaming={isLoading} />
         <div className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-[3000ms] ${
            currentBiome === 'STAR_FIELD' ? 'bg-indigo-900' :
            currentBiome === 'NEBULA' ? 'bg-purple-900' :
            currentBiome === 'ORGANIC' ? 'bg-amber-900' :
            currentBiome === 'DATA_STREAM' ? 'bg-emerald-900' : 'bg-black'
         }`}></div>
      </div>

      {/* Physics Overlay Layer - Bubbles falling/bouncing */}
      <PhysicsBubbles />

      {/* 3D Perspective Container */}
      <div 
        className="relative w-full h-full perspective-container"
        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
      >
        {/* World Transform Wrapper (Ref-driven for performance) */}
        <div 
          ref={worldContainerRef}
          className="absolute inset-0 w-full h-full will-change-transform"
          style={{ 
            transformStyle: 'preserve-3d',
            ...getChaosStyle() 
          }}
        >
           {entities.map(entity => (
             <EntityRenderer 
               key={entity.id} 
               entity={entity} 
               cameraZ={0} 
             />
           ))}
        </div>
      </div>

      {/* Global Input HUD */}
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
      <div className="fixed bottom-10 right-10 text-right pointer-events-none z-40 mix-blend-difference">
         <p className="text-white/40 font-cyber text-xs tracking-[0.2em]">
           SECTOR: {currentBiome} // Z: {Math.floor(cameraZRef.current)}
         </p>
      </div>

      {/* Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.1] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(200px)_scale(2)] z-40 mix-blend-overlay"></div>
      
    </main>
  );
};

export default App;