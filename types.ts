export enum DreamMood {
  NEUTRAL = 'NEUTRAL',
  EUPHORIA = 'EUPHORIA',
  NIGHTMARE = 'NIGHTMARE',
  MELANCHOLY = 'MELANCHOLY',
  MYSTERY = 'MYSTERY'
}

export interface DreamResponse {
  echo: string;
  sentiment: DreamMood;
  visualPrompt: string;
}

export interface DreamFragment {
  id: string;
  text: string;
  response: string;
  mood: DreamMood;
  imageUrl?: string;
  timestamp: number;
}
