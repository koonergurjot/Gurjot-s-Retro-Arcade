import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_GAMES } from '../services/gameLogic';
import { GameMetadata, Difficulty } from '../types';

interface Props {
  game: GameMetadata;
  difficulty: Difficulty;
  onGameOver: (score: number) => void;
}

const GameCanvas: React.FC<Props> = ({ game, difficulty, onGameOver }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const requestRef = useRef<number>(0);
  
  // Input State
  const keys = useRef<{ [key: string]: boolean }>({});
  const mouse = useRef({ x: 0, y: 0, clicked: false });

  // Game Logic State
  const gameState = useRef<any>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => { keys.current[e.key] = true; if(['ArrowUp','ArrowDown',' '].includes(e.key)) e.preventDefault(); }, []);
  const handleKeyUp = useCallback((e: KeyboardEvent) => { keys.current[e.key] = false; }, []);
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if(!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouse.current.x = e.clientX - rect.left;
      mouse.current.y = e.clientY - rect.top;
  }, []);
  const handleMouseDown = useCallback(() => { mouse.current.clicked = true; }, []);
  const handleMouseUp = useCallback(() => { mouse.current.clicked = false; }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [handleKeyDown, handleKeyUp]);

  useEffect(() => {
    const logic = CANVAS_GAMES[game.id];
    if (!logic || !canvasRef.current) return;

    gameState.current = logic.init(difficulty);
    const ctx = canvasRef.current.getContext('2d');
    if(!ctx) return;

    const loop = () => {
      if (!gameState.current) return;
      
      const width = canvasRef.current!.width;
      const height = canvasRef.current!.height;

      // Update
      const newState = logic.update(gameState.current, { keys: keys.current, mouse: mouse.current }, width, height);
      gameState.current = newState;
      setScore(logic.getScore(newState));

      // Draw
      ctx.clearRect(0, 0, width, height);
      logic.draw(ctx, newState, width, height);

      if (logic.isGameOver(newState)) {
        onGameOver(logic.getScore(newState));
      } else {
        requestRef.current = requestAnimationFrame(loop);
      }
    };

    requestRef.current = requestAnimationFrame(loop);
  }, [game, difficulty, onGameOver]);

  return (
    <div className="relative flex flex-col items-center justify-center p-4 bg-gray-900 rounded-lg shadow-xl border-4 border-yellow-500">
      <div className="absolute top-2 right-4 text-yellow-400 font-arcade text-xl">Score: {score}</div>
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        className="bg-black rounded border border-gray-700 cursor-crosshair"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      />
      <p className="mt-2 text-gray-400 text-sm font-mono">{game.instructions}</p>
    </div>
  );
};

export default GameCanvas;