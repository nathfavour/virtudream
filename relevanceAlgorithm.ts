import { EntityType, WorldEntity, WHISPER_DATA } from './worldTypes';

// Context for the current world state
export interface WorldContext {
  seed: number;
  depth: number;
  velocity: number;
  zoomScale: number; // Global zoom level
  biome: 'VOID' | 'NEBULA' | 'STAR_FIELD' | 'DATA_STREAM' | 'ORGANIC';
}

// Helper for deterministic randomness based on position
const randomAt = (x: number, y: number, z: number) => {
  const sin = Math.sin(x * 12.9898 + y * 78.233 + z * 0.5);
  return (sin * 43758.5453) - Math.floor(sin * 43758.5453);
};

export const getBiomeAtDepth = (z: number): WorldContext['biome'] => {
  // Reduced biome length from 8000 to 3000 for faster variety
  const cycle = Math.abs(Math.floor(z / 3000));
  const biomes: WorldContext['biome'][] = ['VOID', 'STAR_FIELD', 'NEBULA', 'DATA_STREAM', 'ORGANIC'];
  return biomes[cycle % biomes.length];
};

export const generateRelevantEntity = (
  z: number, 
  velocity: number, 
  aiPool: string[] = [] // Optional AI-generated text pool
): WorldEntity => {
  const biome = getBiomeAtDepth(z);
  const r = randomAt(z, z, z);
  
  let type = EntityType.FLICKER;
  let scale = 1;
  let content = undefined;
  let hue = 0;
  let detailLevel = 0; // 0 = low, 1 = med, 2 = high (sun/world)

  // Velocity affects generation: High speed = simpler shapes (streaks), Low speed = complex worlds
  const speedFactor = Math.min(1, Math.abs(velocity) / 100);

  switch (biome) {
    case 'VOID':
      // ZERO EMPTY SPACE RULE
      // Ensure something is ALWAYS generated
      if (r > 0.85) { // Increased Text Frequency (was 0.94)
        type = EntityType.WHISPER;
        const pool = aiPool.length > 0 ? aiPool : WHISPER_DATA;
        content = pool[Math.floor(r * 100) % pool.length];
        scale = 2.5; 
      } else if (r > 0.6) {
        // High density background blobs for "waves" feeling
        type = EntityType.BLOB;
        scale = 0.5 + r * 1.5;
        hue = (z * 0.1) % 360; // Gradient shift based on depth
      } else {
        // High density particles
        type = EntityType.FLICKER; 
        scale = 0.5 + r * 4; 
      }
      break;

    case 'STAR_FIELD':
      if (r > 0.96) { 
        type = EntityType.GALAXY; 
        scale = 6 + r * 5; 
        hue = (r * 360) % 360;
        detailLevel = 2; 
      } else if (r > 0.90) { // Added Text to Starfield
        type = EntityType.WHISPER;
        const pool = aiPool.length > 0 ? aiPool : WHISPER_DATA;
        content = pool[Math.floor(r * 100) % pool.length];
        scale = 2;
      } else if (r > 0.7) {
        type = EntityType.BLOB; 
        hue = (r * 360) % 360;
        scale = 1 + r * 2;
      } else {
        type = EntityType.FLICKER; 
        scale = 0.5 + r * 3;
      }
      break;

    case 'NEBULA':
      if (r > 0.92) { 
        type = EntityType.GALAXY; 
        scale = 12 + r * 10;
        hue = 200 + (r * 100); 
      } else if (r > 0.88) { 
        type = EntityType.PORTAL;
        scale = 4 + r * 2;
      } else if (r > 0.82) { // Added Text to Nebula
        type = EntityType.WHISPER;
        const pool = aiPool.length > 0 ? aiPool : WHISPER_DATA;
        content = pool[Math.floor(r * 100) % pool.length];
        scale = 2.2;
      } else if (r > 0.5) {
        // Colored Gas Clouds (Blobs)
        type = EntityType.BLOB;
        scale = 5 + r * 5; // Large clouds
        hue = 240 + (r * 60); 
      } else {
        type = EntityType.FLICKER; 
        scale = r * 3;
      }
      break;
      
    case 'DATA_STREAM':
      if (r > 0.85) {
        type = EntityType.WIDGET_INPUT; 
      } else if (r > 0.75) { // Increased Text (was 0.9)
        type = EntityType.WHISPER;
        content = "01010101..."; 
      } else if (r > 0.4) {
        type = EntityType.FLICKER; 
        scale = 1 + r * 3;
      } else {
         // Background data rain
        type = EntityType.FLICKER;
        scale = 0.5;
      }
      break;

    case 'ORGANIC':
      if (r > 0.9) { // Added Text to Organic
        type = EntityType.WHISPER;
        const pool = aiPool.length > 0 ? aiPool : WHISPER_DATA;
        content = pool[Math.floor(r * 100) % pool.length];
        scale = 2;
      } else if (r > 0.6) { // frequent blobs
        type = EntityType.BLOB;
        scale = 2 + r * 6;
        hue = (z * 0.2) % 360; // Rainbow shift
      } else {
        type = EntityType.FLICKER; 
        scale = r * 8; // Large spots
      }
      break;
  }

  // "Mistakenly zoom into any of those balls" logic
  // Update: We now support MULTIPLE POIs/Clusters per scene, not just center
  // Cycle between 3 lanes: Center, Top-Left, Bottom-Right
  
  const laneCycle = Math.floor(z / 1000) % 3;
  let baseX = 50;
  let baseY = 50;
  
  if (laneCycle === 1) {
     baseX = 30; baseY = 30; // Top-Left Cluster
  } else if (laneCycle === 2) {
     baseX = 70; baseY = 70; // Bottom-Right Cluster
  }
  
  // Drift logic
  let x = (randomAt(z, 1, 1) - 0.5) * 150 + 50;
  let y = (randomAt(1, z, 1) - 0.5) * 150 + 50;
  
  if (r > 0.92 || type === EntityType.PORTAL || type === EntityType.GALAXY) { 
    // Force alignment to current active lane/cluster
    x = baseX + (randomAt(z,z,2) - 0.5) * 10; 
    y = baseY + (randomAt(z,z,3) - 0.5) * 10;
    
    if (type === EntityType.PORTAL) scale = 5; 
    else scale *= 2; 
  }

  return {
    id: `z-${Math.floor(z)}-${r.toString(36).substr(2, 5)}`,
    type,
    x,
    y,
    z,
    scale,
    content,
    hue,
    velocity: { x: 0, y: 0 } // Could add lateral movement here
  };
};

