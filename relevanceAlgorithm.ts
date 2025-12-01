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
  const cycle = Math.abs(Math.floor(z / 8000));
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
      // Balanced text density - readable but present
      if (r > 0.92) { 
        type = EntityType.WHISPER;
        const pool = aiPool.length > 0 ? aiPool : WHISPER_DATA;
        content = pool[Math.floor(r * 100) % pool.length];
        scale = 2; 
      } else if (r > 0.3) {
        // High density stars/dust to prevent empty screen
        type = EntityType.FLICKER; 
        scale = 0.5 + r * 3; // Varied sizes
      } else {
        // Background noise
        type = EntityType.FLICKER; 
        scale = 0.5;
      }
      break;

    case 'STAR_FIELD':
      // Denser Star Field
      if (r > 0.95) { // Suns
        type = EntityType.GALAXY; 
        scale = 5 + r * 5; 
        hue = (r * 360) % 360;
        detailLevel = 2; 
      } else if (r > 0.8) {
        type = EntityType.BLOB; 
        hue = (r * 360) % 360;
      } else if (r > 0.3) {
        type = EntityType.FLICKER; // Much more stars
        scale = 0.5 + r;
      } else {
        type = EntityType.FLICKER;
      }
      break;

    case 'NEBULA':
      // Denser Nebula
      if (r > 0.9) { 
        type = EntityType.GALAXY; 
        scale = 10 + r * 10;
        hue = 200 + (r * 100); 
      } else if (r > 0.95) {
        type = EntityType.PORTAL;
        scale = 3 + r * 2;
      } else if (r > 0.4) {
        type = EntityType.FLICKER; // Space dust
        scale = r * 2;
      } else {
        type = EntityType.FLICKER;
      }
      break;
      
    case 'DATA_STREAM':
      // Denser Matrix
      if (r > 0.8) {
        type = EntityType.WIDGET_INPUT; 
      } else if (r > 0.85) { // Moderate text (was 0.95)
        type = EntityType.WHISPER;
        content = "01010101..."; 
      } else if (r > 0.2) { // High density bits
        type = EntityType.FLICKER; 
        scale = 1 + r;
      } else {
        type = EntityType.FLICKER;
      }
      break;

    case 'ORGANIC':
      // Blobs and Cells
      if (r > 0.8) {
        type = EntityType.BLOB;
        scale = 2 + r * 4;
        hue = (r * 100) % 100; 
      } else if (r > 0.2) { // High density particles
        type = EntityType.FLICKER;
        scale = r * 3;
      } else {
        type = EntityType.FLICKER;
      }
      break;
  }

  // "Mistakenly zoom into any of those balls" logic
  // We place some objects DIRECTLY in the center path (x=50, y=50)
  // so the user inevitably flies through them.
  let x = (randomAt(z, 1, 1) - 0.5) * 150 + 50;
  let y = (randomAt(1, z, 1) - 0.5) * 150 + 50;
  
  if (r > 0.92) {
    // Center alignment for potential "world entry"
    x = 50 + (randomAt(z,z,2) - 0.5) * 10; // Tight cluster near center
    y = 50 + (randomAt(z,z,3) - 0.5) * 10;
    scale *= 2; // Make it big enough to enter
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

