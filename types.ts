export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface GameMetadata {
  id: string;
  title: string;
  category: 'Arcade' | 'Puzzle' | 'Action' | 'Classic' | 'Quick' | 'Sports';
  description: string;
  thumbnail: string;
  type: 'canvas' | 'dom';
  instructions: string;
}

export interface ScoreEntry {
  gameId: string;
  score: number;
  date: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

// Canvas Game Engine Types
export interface GameState {
  particles?: Particle[];
  [key: string]: any;
}

export interface InputState {
  keys: { [key: string]: boolean };
  mouse: { x: number; y: number; clicked: boolean };
}

export interface CanvasGameDefinition {
  init: (difficulty: Difficulty) => GameState;
  update: (state: GameState, input: InputState, width: number, height: number) => GameState;
  draw: (ctx: CanvasRenderingContext2D, state: GameState, width: number, height: number) => void;
  getScore: (state: GameState) => number;
  isGameOver: (state: GameState) => boolean;
}