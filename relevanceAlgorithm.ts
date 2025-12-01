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
      // Text heavy, minimal lights
      if (r > 0.6) {
        type = EntityType.WHISPER;
        // Prioritize AI text if available
        const pool = aiPool.length > 0 ? aiPool : WHISPER_DATA;
        content = pool[Math.floor(r * 100) % pool.length];
        scale = 1 + r;
      } else {
        type = EntityType.FLICKER;
      }
      break;

    case 'STAR_FIELD':
      // Suns and planets
      if (r > 0.9) {
        type = EntityType.GALAXY; // Acts as a "Sun" here
        scale = 5 + r * 5; // Massive
        hue = (r * 360) % 360;
        detailLevel = 2; // Render as blazing sun
      } else if (r > 0.5) {
        type = EntityType.FLICKER; // Distant stars
        scale = 0.5 + r;
      } else {
        type = EntityType.BLOB; // Planetary bodies
        hue = (r * 360) % 360;
      }
      break;

    case 'NEBULA':
      // Clouds and Portals
      if (r > 0.8) {
        type = EntityType.GALAXY; // Nebula clouds
        scale = 10 + r * 10;
        hue = 200 + (r * 100); // Blues/Purples
      } else if (r > 0.95) {
        type = EntityType.PORTAL;
        scale = 3 + r * 2;
      }
      break;
      
    case 'DATA_STREAM':
      // Matrix-like
      if (r > 0.4) {
        type = EntityType.WIDGET_INPUT; // Tech fragments
      } else {
        type = EntityType.WHISPER;
        content = "01010101..."; 
      }
      break;

    case 'ORGANIC':
      // Blobs and Cells
      type = EntityType.BLOB;
      scale = 2 + r * 4;
      hue = (r * 100) % 100; // Reds/Oranges
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

