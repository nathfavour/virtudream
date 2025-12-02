import React, { useState, useEffect, useRef } from 'react';
import LivingBackground from './components/LivingBackground';
import GlobalInputHandler from './components/GlobalInputHandler';
import EntityRenderer from './components/EntityRenderer';
import LiquidCursor from './components/LiquidCursor';
import PhysicsBubbles from './components/PhysicsBubbles';
import { GravityProvider, useGravity } from './contexts/GravityContext'; // Import Context
import { DreamMood } from './types';
import { WorldEntity, EntityType, WHISPER_DATA } from './worldTypes';
import { consultTheDream } from './services/geminiService';
import { generateRelevantEntity, getBiomeAtDepth } from './relevanceAlgorithm';

// Inner App Component to consume Context
const World: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<DreamMood>(DreamMood.NEUTRAL);
  const [isLoading, setIsLoading] = useState(false);
  const [chaosLevel, setChaosLevel] = useState(0); 
  const [currentBiome, setCurrentBiome] = useState<string>('VOID');

  // --- INFINITE WORLD STATE ---
  const cameraZRef = useRef(Math.random() * 5000 + 1000);
  const targetCameraZRef = useRef(cameraZRef.current);
  const worldContainerRef = useRef<HTMLDivElement>(null);
  
  const [entities, setEntities] = useState<WorldEntity[]>([]);
  const gravityRef = useGravity(); // Access Gravity State
  
  // Generation boundaries
  const RENDER_DISTANCE = 4000;
  const lastGenZ = useRef(0);
  
  const handleEntityConsumed = (id: string) => {
     // Remove entity and spawn immediate replacement
     setEntities(prev => {
        const filtered = prev.filter(e => e.id !== id);
        // Instant replacement to maintain density
        const replacementZ = cameraZRef.current + 2000 + Math.random() * 1000;
        filtered.push(generateRelevantEntity(replacementZ, 0));
        return filtered;
     });
  };

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
      
      // Apply momentum
      cameraZRef.current += velocity; 

      // MOUSE STEERING
      // Shift the vanishing point opposite to mouse to look around
      const steerX = mouseRef.current.x * -500; // Pixels shift
      const steerY = mouseRef.current.y * -500;
      
      // SHAKE EFFECT
      const speed = Math.abs(velocity);
      let shakeX = (Math.random() - 0.5) * speed * 0.5; // Base speed shake
      let shakeY = (Math.random() - 0.5) * speed * 0.5;

      // UPDATE GRAVITY SOURCES (Portals near camera)
      // Filter for portals within interaction range
      const activePortals = entities.filter(e => 
         e.type === EntityType.PORTAL &&
         Math.abs(e.z - cameraZRef.current) < 1500 // Only close portals pull
      );
      gravityRef.current.portals = activePortals;

      // Check for nearby massive entities to simulate "shockwave"
      const nearby = entities.find(e => 
         e.z > cameraZRef.current && 
         e.z < cameraZRef.current + 400 && 
         (e.scale > 3 || e.type === EntityType.PORTAL || e.type === EntityType.GALAXY)
      );

      if (nearby) {
         const proximity = 400 - (nearby.z - cameraZRef.current);
         const intensity = (proximity / 400) * (nearby.scale * 2); // Closer + Bigger = More Shake
         shakeX += (Math.random() - 0.5) * intensity;
         shakeY += (Math.random() - 0.5) * intensity;
      }

      // Update DOM directly for zero-latency scroll
      if (worldContainerRef.current) {
        // Combined Z-travel, XY-steering, and Shake
        worldContainerRef.current.style.transform = `translate3d(${steerX + shakeX}px, ${steerY + shakeY}px, ${-cameraZRef.current}px)`;
      }

      // Procedural Generation Check
      const currentZ = cameraZRef.current;
      const horizon = currentZ + RENDER_DISTANCE;
      const rearHorizon = currentZ - 2000;

      // Update global biome state for background
      const newBiome = getBiomeAtDepth(currentZ);
      
      // Only trigger React state update if we crossed a threshold to avoid stutter
      if (Math.abs(currentZ - lastGenZ.current) > 500) {
         // Update Biome UI
         setCurrentBiome(newBiome);

         setEntities(prev => {
            const next = [...prev];
            const filtered = next.filter(e => e.z > rearHorizon);
            
            let maxZ = filtered.length > 0 ? Math.max(...filtered.map(e => e.z)) : currentZ;
            let added = false;
            
            // Tighter Generation Loop: Smaller steps to prevent "dead spots" or color voids
            while (maxZ < horizon) {
              // Reduced step size from 200-600 to 100-250
              maxZ += Math.random() * 150 + 100; 
              
              // Pass velocity to generation algorithm for context awareness
              filtered.push(generateRelevantEntity(maxZ, velocity));
              added = true;
            }
            
            let minZ = filtered.length > 0 ? Math.min(...filtered.map(e => e.z)) : currentZ;
            while (minZ > rearHorizon) {
               minZ -= Math.random() * 150 + 100;
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
  }, [entities]); // Dep on entities to filter portals

  const handleWhisper = (text: string) => {
    // Spawn whisper entity in front of camera
    const newEntity: WorldEntity = {
      id: Date.now().toString(),
      type: EntityType.WHISPER,
      x: 50 + (Math.random() - 0.5) * 20,
      y: 50 + (Math.random() - 0.5) * 20,
      z: cameraZRef.current + 800,
      scale: 1,
      content: text
    };
    setEntities(prev => [...prev, newEntity]);
    setIsLoading(true);
    
    // AI Interpretation
    consultTheDream(text).then(response => {
       setIsLoading(false);
       setCurrentMood(response.mood);
       // Spawn response echo
       setTimeout(() => {
         setEntities(prev => [...prev, {
            id: Date.now().toString() + 'echo',
            type: EntityType.WHISPER,
            x: 50,
            y: 50,
            z: cameraZRef.current + 1200,
            scale: 2,
            content: response.interpretation.split('.')[0]
         }]);
       }, 2000);
    });
  };

  const handleTypingActivity = (intensity: number) => {
    setChaosLevel(intensity);
  };

  // Scroll Handler
  const handleScroll = (e: React.WheelEvent) => {
    // Adjust target camera Z
    const scrollSpeed = 2 + (chaosLevel * 0.1);
    targetCameraZRef.current += e.deltaY * scrollSpeed;
  };

  return (
    <main 
      className="relative w-full h-screen bg-black overflow-hidden cursor-none"
      onWheel={handleScroll}
    >
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
         <div ref={worldContainerRef} className="absolute w-full h-full pointer-events-none">
            {entities.map(entity => (
              <EntityRenderer 
                key={entity.id} 
                entity={entity} 
                cameraZ={cameraZRef.current} // This causes re-renders every frame? 
                // Optimization: Actually, passing cameraZ here triggers React reconciler every frame.
                // But EntityRenderer is memoized.
                // We should rely on requestAnimationFrame in EntityRenderer for position updates if possible, 
                // OR accept that React handles 100 elements at 60fps okay-ish.
                // Better: pass a ref or mutable object? 
                // For now, let's keep it simple. If laggy, we refactor to direct DOM.
                onConsumed={() => handleEntityConsumed(entity.id)}
              />
            ))}
         </div>
      </div>

      {/* HUD Layers */}
      <GlobalInputHandler 
        onWhisper={handleWhisper} 
        onTypingActivity={handleTypingActivity}
        isLoading={isLoading}
      />
      
      {/* Depth Indicator */}
      <div className="fixed bottom-10 right-10 text-right pointer-events-none z-40 mix-blend-difference">
         <p className="text-white/40 font-cyber text-xs tracking-[0.2em]">
           SECTOR: {currentBiome} // Z: {Math.floor(cameraZRef.current)}
         </p>
      </div>

    </main>
  );
};

const App: React.FC = () => {
  return (
    <GravityProvider>
      <World />
    </GravityProvider>
  );
};

export default App;