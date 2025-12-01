export enum EntityType {
  WHISPER = 'WHISPER',
  GALAXY = 'GALAXY',
  FLICKER = 'FLICKER',
  WIDGET_INPUT = 'WIDGET_INPUT',
  WIDGET_MIRROR = 'WIDGET_MIRROR'
}

export interface WorldEntity {
  id: string;
  type: EntityType;
  x: number; // Percentage -50 to 150
  y: number; // Percentage -50 to 150
  z: number; // Absolute depth
  scale: number;
  content?: string;
  hue?: number;
}

export const WHISPER_DATA = [
  "The void listens.",
  "Dreams are memory without time.",
  "Signal received.",
  "Reality is a rendered suggestion.",
  "Do not fear the glitch.",
  "Silence is data.",
  "Pattern recognition active.",
  "The stars are projections.",
  "Who is the dreamer?",
  "Upload your consciousness.",
  "Frequencies aligning...",
  "Echoes of a future past.",
  "System unstable.",
  "Rebooting universe...",
  "Trace detected."
];

