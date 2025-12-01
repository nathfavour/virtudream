import React, { useState, useEffect, useRef } from 'react';
import LivingBackground from './components/LivingBackground';
import DreamLayer from './components/DreamLayer';
import VoidLayer from './components/VoidLayer';
import GlobalInputHandler from './components/GlobalInputHandler';
import { DreamMood, DreamFragment } from './types';
import { consultTheDream, manifestVision } from './services/geminiService';

const App: React.FC = () => {
  const [currentMood, setCurrentMood] = useState<DreamMood>(DreamMood.NEUTRAL);
  const [fragments, setFragments] = useState<DreamFragment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chaosLevel, setChaosLevel] = useState(0); 

  // Infinite Zoom State
  const [zoomLevel, setZoomLevel] = useState(1);
  const ZOOM_SPEED = 0.001; // Sensitivity

  // Refs for tracking scroll delta to convert to zoom
  // We use a dummy scroll height to capture scroll events, but we don't actually scroll.
  // We just use the deltaY.
  
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent actual scrolling if we want to lock the view to zoom only
      // But maybe we want to allow scrolling for content access?
      // The user asked for "scroll zooms into the page itself... revealing another world... endless"
      
      // Let's hijack the scroll for zoom
      // e.preventDefault(); // Optional: might block standard scrolling behavior too much?
      
      const delta = e.deltaY;
      setZoomLevel(prev => Math.max(1, prev + delta * ZOOM_SPEED));
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  const handleWhisper = async (text: string) => {
    setIsLoading(true);
    const tempId = Date.now().toString();

    const response = await consultTheDream(text);
    setCurrentMood(response.sentiment);

    const newFragment: DreamFragment = {
      id: tempId,
      text,
      response: response.echo,
      mood: response.sentiment,
      timestamp: Date.now(),
      imageUrl: undefined 
    };

    setFragments(prev => [...prev, newFragment]);

    const visionBase64 = await manifestVision(response.visualPrompt);
    
    setFragments(prev => prev.map(f => 
      f.id === tempId ? { ...f, imageUrl: visionBase64 || undefined } : f
    ));
    
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

    if (chaosLevel > 5) {
       x = (Math.random() - 0.5) * (chaosLevel * 0.2);
       y = (Math.random() - 0.5) * (chaosLevel * 0.2);
    }
    
    if (chaosLevel > 50) {
      blur = (chaosLevel - 50) * 0.1;
    }
    
    return {
      transform: `translate(${x}px, ${y}px)`,
      filter: `blur(${blur}px)`,
      transition: 'transform 0.05s linear, filter 0.1s ease'
    };
  };

  // --- INFINITE ZOOM LOGIC ---
  // We have multiple "Worlds" or Layers.
  // 1. DreamLayer (Start)
  // 2. VoidLayer (Next)
  // 3. ... Recurring ...
  
  // Logic:
  // Zoom 1 -> 2: DreamLayer scales up and fades out. VoidLayer scales up from 0.5 to 1 and fades in.
  // Zoom 2 -> 3: VoidLayer scales up and fades out. Next layer...
  
  // Modulo arithmetic for endless layers
  // Layer Index = Math.floor(zoomLevel - 1)
  // Layer Progress = (zoomLevel - 1) % 1
  
  const layerIndex = Math.floor(zoomLevel - 1);
  const layerProgress = (zoomLevel - 1) % 1;
  
  // Calculate transforms for Current Layer (Exiting) and Next Layer (Entering)
  // Exiting Layer: Scale 1 -> 5, Opacity 1 -> 0
  const exitScale = 1 + layerProgress * 4;
  const exitOpacity = Math.max(0, 1 - layerProgress * 1.5);
  const exitBlur = layerProgress * 20;

  // Entering Layer: Scale 0.2 -> 1, Opacity 0 -> 1
  // It should appear from the deep distance
  const enterScale = 0.2 + layerProgress * 0.8; 
  const enterOpacity = Math.min(1, layerProgress * 2);
  const enterBlur = Math.max(0, 10 - layerProgress * 10); // Start blurry then focus

  // Alternate worlds based on index parity
  // Even: DreamLayer, Odd: VoidLayer (or we can add more)
  const isEvenLayer = layerIndex % 2 === 0;

  const renderLayer = (isCurrent: boolean, index: number) => {
    // If this is the current base layer (the one zooming out)
    if (index === layerIndex) {
      return {
        style: {
          transform: `scale(${exitScale})`,
          opacity: exitOpacity,
          filter: `blur(${exitBlur}px)`,
          zIndex: 10
        },
        component: isEvenLayer ? <DreamLayer fragments={fragments} isLoading={isLoading} /> : <VoidLayer />
      };
    }
    // If this is the next layer (the one zooming in)
    else if (index === layerIndex + 1) {
      return {
        style: {
          transform: `scale(${enterScale})`,
          opacity: enterOpacity,
          filter: `blur(${enterBlur}px)`,
          zIndex: 5
        },
        component: !isEvenLayer ? <DreamLayer fragments={fragments} isLoading={isLoading} /> : <VoidLayer />
      };
    }
    return null;
  };

  const currentLayerProps = renderLayer(true, layerIndex);
  const nextLayerProps = renderLayer(false, layerIndex + 1);

  return (
    <main className="relative w-full h-screen bg-black overflow-hidden perspective-container">
      
      {/* Background stays constant or shifts slowly */}
      <div className="fixed inset-0 z-0">
         <LivingBackground mood={currentMood} isDreaming={isLoading} />
      </div>

      {/* Global Chaos Container - Shakes everything */}
      <div className="relative w-full h-full" style={getChaosStyle()}>
        
        {/* Render Active Layers */}
        {currentLayerProps && (
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75 origin-center will-change-transform" style={currentLayerProps.style}>
            <div className="w-full max-w-7xl">
              {currentLayerProps.component}
            </div>
          </div>
        )}
        
        {nextLayerProps && (
          <div className="absolute inset-0 flex items-center justify-center transition-transform duration-75 origin-center will-change-transform" style={nextLayerProps.style}>
             <div className="w-full max-w-7xl">
              {nextLayerProps.component}
            </div>
          </div>
        )}

        {/* Global Input Overlay - Always on top, never scales (HUD) */}
        <div className="fixed inset-0 z-50 pointer-events-none">
           <div className="pointer-events-auto w-full h-full">
               <GlobalInputHandler 
                  onWhisper={handleWhisper} 
                  isLoading={isLoading} 
                  onTypingActivity={handleTypingActivity}
               />
           </div>
        </div>

        {/* Zoom Guide */}
        <div className="fixed bottom-10 left-0 w-full text-center pointer-events-none mix-blend-difference z-40">
           <p className="text-white/40 font-cyber text-xs tracking-[0.5em] animate-pulse">
             SCROLL TO DIVE DEEPER [DEPTH: {zoomLevel.toFixed(2)}]
           </p>
        </div>

      </div>

      {/* Grid Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.1] bg-[linear-gradient(rgba(0,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.1)_1px,transparent_1px)] bg-[size:100px_100px] [transform:perspective(500px)_rotateX(60deg)_translateY(200px)_scale(2)] z-40 mix-blend-overlay"></div>
      
    </main>
  );
};

export default App;