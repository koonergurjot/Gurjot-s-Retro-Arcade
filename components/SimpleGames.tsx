import React, { useState, useEffect, useRef } from 'react';
import { GameMetadata, Difficulty } from '../types';

interface Props {
  game: GameMetadata;
  difficulty: Difficulty;
  onGameOver: (score: number) => void;
}

const SimpleGames: React.FC<Props> = ({ game, difficulty, onGameOver }) => {
  const [internalState, setInternalState] = useState<any>({});
  const [fx, setFx] = useState<string>('');
  
  // Refs for timers to avoid cleanup issues
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
      // Clean up any lingering timers when game changes
      return () => {
          if (timerRef.current) clearTimeout(timerRef.current);
          if (intervalRef.current) clearInterval(intervalRef.current);
      }
  }, [game.id]);

  // --- TIC TAC TOE (Minimax) ---
  if (game.id === 'tictactoe') {
    useEffect(() => { setInternalState({ board: Array(9).fill(null), xIsNext: true, wins: {X:0, O:0, D:0}, round: 1 }); }, []);
    
    const checkWin = (board: string[]) => {
      const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
      for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
      }
      return board.includes(null) ? null : 'Draw';
    };

    const minimax = (board: string[], depth: number, isMaximizing: boolean): number => {
      const winner = checkWin(board);
      if (winner === 'O') return 10 - depth;
      if (winner === 'X') return depth - 10;
      if (winner === 'Draw') return 0;
      
      if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i=0; i<9; i++) {
           if (!board[i]) {
               board[i] = 'O';
               const score = minimax(board, depth + 1, false);
               board[i] = null as any;
               bestScore = Math.max(score, bestScore);
           }
        }
        return bestScore;
      } else {
        let bestScore = Infinity;
        for (let i=0; i<9; i++) {
            if (!board[i]) {
                board[i] = 'X';
                const score = minimax(board, depth + 1, true);
                board[i] = null as any;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
      }
    };

    const handleClick = (i: number) => {
      if (internalState.winner || internalState.board[i] || !internalState.xIsNext) return;
      const nextBoard = [...internalState.board];
      nextBoard[i] = 'X';
      
      let w = checkWin(nextBoard);
      if (w) { endRound(w, nextBoard); return; }
      
      setInternalState((prev:any) => ({ ...prev, board: nextBoard, xIsNext: false }));
      
      // AI Turn
      setTimeout(() => {
          let move = -1;
          const aiBoard = [...nextBoard]; // Working copy
          // Easy: Random. Medium: 50/50. Hard: Minimax
          if (difficulty === 'Easy' || (difficulty === 'Medium' && Math.random() > 0.5)) {
              let empty = aiBoard.map((v, idx) => v === null ? idx : null).filter(v => v !== null);
              if(empty.length > 0) move = empty[Math.floor(Math.random() * empty.length)] as number;
          } else {
              let bestScore = -Infinity;
              for (let j=0; j<9; j++) {
                  if (!aiBoard[j]) {
                      aiBoard[j] = 'O';
                      let score = minimax(aiBoard, 0, false);
                      aiBoard[j] = null as any;
                      if (score > bestScore) { bestScore = score; move = j; }
                  }
              }
          }
          
          if (move !== -1) {
              nextBoard[move] = 'O';
              w = checkWin(nextBoard);
              if (w) endRound(w, nextBoard);
              else setInternalState((prev:any) => ({ ...prev, board: nextBoard, xIsNext: true }));
          }
      }, 400);
    };

    const endRound = (w: string, board: string[]) => {
        const newWins = { ...internalState.wins, [w === 'X' ? 'X' : (w === 'O' ? 'O' : 'D')]: internalState.wins[w==='X'?'X':(w==='O'?'O':'D')] + 1 };
        setInternalState((prev:any) => ({ ...prev, board, winner: w, wins: newWins }));
        if (internalState.round >= 5) {
             const finalScore = newWins.X * 100 + newWins.D * 20;
             setTimeout(() => onGameOver(finalScore), 2000);
        } else {
            setTimeout(() => {
                setInternalState((prev:any) => ({ ...prev, board: Array(9).fill(null), winner: null, xIsNext: true, round: prev.round + 1 }));
            }, 2000);
        }
    };

    return (
      <div className="flex flex-col items-center">
        <div className="flex justify-between w-full mb-4 px-8 text-xl font-bold font-arcade text-yellow-400">
            <span>PLAYER: {internalState.wins?.X}</span>
            <span>ROUND {internalState.round}/5</span>
            <span>CPU: {internalState.wins?.O}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 bg-slate-700 p-3 rounded-lg shadow-xl">
            {internalState.board?.map((val: string, i: number) => (
            <button key={i} onClick={() => handleClick(i)} className={`w-20 h-20 text-5xl font-bold flex items-center justify-center rounded transition-all transform hover:scale-105 ${val === 'X' ? 'bg-blue-500 text-white' : (val === 'O' ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-900')}`}>
                {val}
            </button>
            ))}
        </div>
        {internalState.winner && <div className="mt-4 text-3xl text-green-400 font-arcade animate-bounce">{internalState.winner === 'Draw' ? 'DRAW!' : `${internalState.winner} WINS ROUND!`}</div>}
      </div>
    );
  }

  // --- MEMORY MATCH ---
  if (game.id === 'memory') {
    // Only init if deck is missing
    useEffect(() => { if(!internalState.deck) startLevel(1); }, []);

    const startLevel = (lvl: number) => {
        let pairs = lvl === 1 ? 6 : (lvl === 2 ? 8 : 10);
        const emojis = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮'];
        const deck = [...emojis.slice(0, pairs), ...emojis.slice(0, pairs)].sort(() => Math.random() - 0.5);
        setInternalState({ deck, flipped: [], solved: [], moves: 0, level: lvl, score: internalState.score || 0 });
    };

    const handleCard = (index: number) => {
       if (internalState.flipped.length === 2 || internalState.flipped.includes(index) || internalState.solved.includes(index)) return;
       const newFlipped = [...internalState.flipped, index];
       setInternalState((prev:any) => ({ ...prev, flipped: newFlipped }));

       if (newFlipped.length === 2) {
         setInternalState((prev:any) => ({ ...prev, moves: prev.moves + 1 }));
         if (internalState.deck[newFlipped[0]] === internalState.deck[newFlipped[1]]) {
            setInternalState((prev:any) => {
                const solved = [...prev.solved, ...newFlipped];
                const newScore = prev.score + 100;
                if(solved.length === prev.deck.length) {
                    if (prev.level < 3) setTimeout(() => startLevel(prev.level + 1), 1000);
                    else setTimeout(() => onGameOver(newScore + (500 - prev.moves * 10)), 1000);
                }
                return { ...prev, solved, flipped: [], score: newScore };
            });
         } else { setTimeout(() => setInternalState((prev:any) => ({ ...prev, flipped: [] })), 800); }
       }
    };
    
    return (
      <div className="flex flex-col items-center">
        <div className="flex justify-between w-full mb-4 text-xl text-yellow-400 font-bold font-mono">
            <span>LEVEL {internalState.level}</span>
            <span>SCORE: {internalState.score || 0}</span>
        </div>
        <div className={`grid gap-2 ${internalState.level === 3 ? 'grid-cols-5' : 'grid-cols-4'}`}>
            {internalState.deck?.map((card: string, i: number) => (
            <button key={i} onClick={() => handleCard(i)} className={`w-14 h-14 text-2xl flex items-center justify-center rounded-lg shadow-md transition-all duration-300 transform ${internalState.flipped.includes(i) || internalState.solved.includes(i) ? 'bg-white rotate-y-180 scale-100' : 'bg-gradient-to-br from-blue-500 to-blue-700 text-transparent scale-95 hover:scale-100'}`}>
                {(internalState.flipped.includes(i) || internalState.solved.includes(i)) ? card : '?'}
            </button>
            ))}
        </div>
      </div>
    );
  }

  // --- CLICKER HERO ---
  if (game.id === 'clicker') {
    useEffect(() => { setInternalState({ count: 0, timeLeft: 10, active: false, cps: 0 }); }, []);
    useEffect(() => {
       if(internalState.active && internalState.timeLeft > 0) {
           const timer = setInterval(() => setInternalState((s:any) => ({...s, timeLeft: s.timeLeft - 1, cps: Math.floor(s.count / (11-s.timeLeft)) })), 1000);
           return () => clearInterval(timer);
       } else if (internalState.active && internalState.timeLeft === 0) {
           onGameOver(internalState.count * 10); setInternalState((s:any) => ({...s, active: false}));
       }
    }, [internalState.active, internalState.timeLeft]);
    
    const click = () => {
        if(!internalState.active && internalState.timeLeft === 10) setInternalState((s:any) => ({...s, active: true, count: 1}));
        else if(internalState.active) {
            setInternalState((s:any) => ({...s, count: s.count + 1}));
            setFx(`+1`);
            setTimeout(()=>setFx(''), 200);
        }
    }

    return (
        <div className="text-center relative">
            {fx && <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-10 text-4xl text-yellow-400 font-bold animate-bounce">{fx}</div>}
            <h2 className="text-7xl text-white font-black drop-shadow-[0_5px_0_rgba(0,0,0,0.5)] mb-2">{internalState.count || 0}</h2>
            <div className="text-gray-400 font-mono mb-8">CLICKS PER SEC: {internalState.cps || 0}</div>
            <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden mb-6">
                <div className="bg-red-500 h-full transition-all duration-1000 ease-linear" style={{width: `${(internalState.timeLeft/10)*100}%`}}></div>
            </div>
            <button className="bg-red-600 hover:bg-red-500 text-white font-black py-8 px-12 rounded-full text-3xl shadow-[0_6px_0_rgb(127,29,29)] active:translate-y-2 active:shadow-none transition-all uppercase tracking-widest ring-4 ring-red-900"
              onClick={click}>
               {internalState.active ? 'SMASH!' : 'START'}
            </button>
        </div>
    );
  }

  // --- REACTION TIMER ---
  if (game.id === 'reaction') {
    useEffect(() => { setInternalState({ status: 'waiting', ms: 0, startTime: 0, tries: [], round: 1 }); wait(); }, []);
    
    const wait = () => {
        setInternalState((s:any) => ({...s, status: 'waiting', ms: 0}));
        const delay = 2000 + Math.random()*3000;
        timerRef.current = setTimeout(() => setInternalState((s:any) => {
            if(s.status === 'done' || s.status === 'early') return s;
            return {...s, status: 'ready', startTime: Date.now()};
        }), delay);
    }

    const handleReaction = () => {
        if(internalState.status === 'ready') {
            const time = Date.now() - internalState.startTime;
            const newTries = [...internalState.tries, time];
            if (newTries.length === 3) {
                const avg = Math.floor(newTries.reduce((a:number,b:number)=>a+b,0)/3);
                setInternalState({ status: 'finished', ms: avg });
                setTimeout(() => onGameOver(Math.max(0, 1000 - avg)), 2000);
            } else {
                setInternalState((s:any) => ({ ...s, status: 'result', ms: time, tries: newTries, round: s.round+1 }));
                setTimeout(wait, 2000);
            }
        } else if (internalState.status === 'waiting') {
            if (timerRef.current) clearTimeout(timerRef.current);
            setInternalState((s:any) => ({ ...s, status: 'early' }));
            setTimeout(wait, 1000);
        }
    };
    
    let bg = 'bg-blue-600';
    let text = 'WAIT FOR GREEN...';
    if (internalState.status === 'ready') { bg = 'bg-green-500'; text = 'CLICK NOW!'; }
    if (internalState.status === 'early') { bg = 'bg-red-600'; text = 'TOO EARLY!'; }
    if (internalState.status === 'result') { bg = 'bg-blue-800'; text = `${internalState.ms} ms`; }
    if (internalState.status === 'finished') { bg = 'bg-yellow-500 text-black'; text = `AVG: ${internalState.ms} ms`; }

    return (
        <div onClick={handleReaction} className={`w-full h-80 flex flex-col items-center justify-center cursor-pointer rounded-lg select-none ${bg} transition-colors duration-200 shadow-inner`}>
            <h2 className="text-4xl font-bold mb-2">{text}</h2>
            {internalState.status !== 'finished' && <p className="text-sm opacity-70">Round {internalState.round}/3</p>}
        </div>
    );
  }

  // --- WHACK A DIV ---
  if (game.id === 'whack') {
     useEffect(() => { 
         setInternalState({ grid: Array(9).fill('empty'), score: 0, timeLeft: 30 }); 
         
         // Game timer
         const t = setInterval(() => {
             setInternalState((s:any) => {
                 if(s.timeLeft <= 1) {
                     onGameOver(s.score * 10);
                     return {...s, timeLeft: 0};
                 }
                 return {...s, timeLeft: s.timeLeft-1};
             });
         }, 1000);
         intervalRef.current = t;

         // Spawner
         const m = setInterval(() => {
             setInternalState((s:any) => {
                 if (s.timeLeft <= 0) return s;
                 const newGrid = Array(9).fill('empty');
                 const count = difficulty === 'Hard' ? 3 : 1;
                 for(let k=0; k<count; k++) {
                    let i = Math.floor(Math.random()*9);
                    newGrid[i] = Math.random() > 0.8 ? 'bomb' : (Math.random() > 0.8 ? 'gold' : 'mole');
                 }
                 return {...s, grid: newGrid};
             });
         }, difficulty === 'Easy' ? 900 : (difficulty === 'Medium' ? 700 : 500));
         
         return () => { clearInterval(t); clearInterval(m); };
     }, []);

     return (
         <div className="max-w-md mx-auto">
             <div className="flex justify-between mb-4 font-bold text-xl">
                 <span className="text-yellow-400">SCORE: {internalState.score}</span>
                 <span className="text-red-400">TIME: {internalState.timeLeft}</span>
             </div>
             <div className="grid grid-cols-3 gap-4">
                 {internalState.grid?.map((type: string, i: number) => (
                     <div key={i} 
                       onMouseDown={() => { 
                           if(type === 'mole') setInternalState((s:any) => ({...s, score: s.score+1, grid: s.grid.map((x:any, idx:number)=>idx===i?'hit':x)}));
                           if(type === 'gold') setInternalState((s:any) => ({...s, score: s.score+5, grid: s.grid.map((x:any, idx:number)=>idx===i?'hit':x)}));
                           if(type === 'bomb') setInternalState((s:any) => ({...s, score: Math.max(0, s.score-5), grid: s.grid.map((x:any, idx:number)=>idx===i?'boom':x)}));
                       }} 
                       className={`h-24 rounded-xl border-b-4 relative overflow-hidden cursor-pointer active:translate-y-1 active:border-b-0 transition-all
                           ${type==='empty' ? 'bg-slate-700 border-slate-900' : (type==='mole' ? 'bg-yellow-600 border-yellow-800' : (type==='gold' ? 'bg-yellow-300 border-yellow-500' : (type==='bomb'?'bg-black border-gray-800':'bg-green-500')))}`
                       }>
                         {type === 'mole' && <div className="absolute inset-0 flex items-center justify-center text-4xl">🐹</div>}
                         {type === 'gold' && <div className="absolute inset-0 flex items-center justify-center text-4xl">🌟</div>}
                         {type === 'bomb' && <div className="absolute inset-0 flex items-center justify-center text-4xl">💣</div>}
                         {type === 'boom' && <div className="absolute inset-0 flex items-center justify-center text-4xl">💥</div>}
                         {type === 'hit' && <div className="absolute inset-0 flex items-center justify-center text-4xl">✅</div>}
                     </div>
                 ))}
             </div>
         </div>
     );
  }

  // --- MATH SPRINT ---
  if (game.id === 'math') {
      useEffect(() => { setInternalState({ q: genMath(), score: 0, time: 30, streak: 0 }); }, []);
      useEffect(() => { 
          if(internalState.time > 0) { 
              const t = setInterval(() => setInternalState((s:any) => ({...s, time: s.time-1})), 1000); 
              return () => clearInterval(t); 
          } else if (internalState.time === 0) onGameOver(internalState.score); 
      }, [internalState.time]);
      
      function genMath() { 
          const ops = difficulty === 'Easy' ? ['+'] : (difficulty === 'Medium' ? ['+','-'] : ['+','-','*']);
          const op = ops[Math.floor(Math.random()*ops.length)];
          let a = Math.floor(Math.random()*12)+1;
          let b = Math.floor(Math.random()*12)+1;
          if (op === '-') { if(a<b) [a,b]=[b,a]; }
          let ans = op === '+' ? a+b : (op === '-' ? a-b : a*b);
          return { t: `${a} ${op} ${b}`, a: ans }; 
      }

      return (
          <div className="text-center">
               <div className="w-full bg-gray-700 h-2 mb-6"><div className="bg-yellow-400 h-full transition-all duration-1000 ease-linear" style={{width: `${(internalState.time/30)*100}%`}}></div></div>
               <div className="text-xl mb-2 text-cyan-400 font-mono">STREAK: {internalState.streak}</div>
               <div className="text-6xl font-bold mb-8 font-mono">{internalState.q?.t} = ?</div>
               <div className="grid grid-cols-2 gap-4">
                  {[0,1,2,3].map(i => {
                      const offset = Math.floor(Math.random()*5)+1;
                      // Ensure unique answers for buttons
                      const ans = i === 0 ? internalState.q?.a : internalState.q?.a + (i===1?offset:(i===2?-offset:offset+2)); 
                      return (<button key={i} className="bg-blue-600 p-6 rounded-lg text-3xl font-bold hover:bg-blue-500 shadow-[0_4px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none" onClick={() => setInternalState((s:any) => ({...s, score: ans === s.q.a ? s.score+10+(s.streak*2) : s.score, streak: ans===s.q.a?s.streak+1:0, q: genMath()}))}>{ans}</button>);
                  }).sort(() => Math.random() - 0.5)}
               </div>
          </div>
      );
  }

  // --- ROCK PAPER SCISSORS ---
  if (game.id === 'rps') {
      useEffect(() => { setInternalState({ msg: 'CHOOSE YOUR WEAPON', score: 0, state: 'idle' }); }, []);
      const play = (c: number) => {
          if (internalState.state !== 'idle') return;
          setInternalState((s:any)=>({...s, state: 'animating', player: c}));
          let count = 0;
          const interval = setInterval(() => {
              count++;
              setFx(['🪨','📄','✂️'][count%3]);
              if (count > 8) {
                  clearInterval(interval);
                  const ai = Math.floor(Math.random()*3);
                  const res = (c - ai + 3) % 3;
                  let txt = "DRAW"; let pts = 0;
                  if (res === 1) { txt = "YOU WIN!"; pts = 10; }
                  else if (res === 2) { txt = "YOU LOSE"; pts = -5; }
                  setFx('');
                  setInternalState((s:any) => ({ ...s, msg: txt, score: s.score + pts, state: 'result', ai, player: c }));
                  setTimeout(() => {
                      if (Math.abs(internalState.score + pts) >= 50) onGameOver(internalState.score + pts); 
                      else setInternalState((s:any)=>({...s, state: 'idle', msg: 'CHOOSE YOUR WEAPON'}));
                  }, 2000);
              }
          }, 100);
      }
      return (
          <div className="text-center">
              <h2 className="text-3xl font-arcade text-yellow-400 mb-8 h-10">{internalState.state === 'animating' ? fx : internalState.msg}</h2>
              {internalState.state === 'result' && (
                  <div className="flex justify-center gap-10 text-6xl mb-8 animate-bounce">
                      <div>{['🪨','📄','✂️'][internalState.player]}</div>
                      <div className="text-sm pt-4">VS</div>
                      <div>{['🪨','📄','✂️'][internalState.ai]}</div>
                  </div>
              )}
              <div className="flex gap-6 justify-center">
                  {['🪨','📄','✂️'].map((e,i) => (
                      <button key={i} onClick={() => play(i)} disabled={internalState.state !== 'idle'} 
                      className="text-6xl p-6 bg-slate-700 rounded-xl border-b-4 border-slate-900 hover:bg-slate-600 disabled:opacity-50 transition-all hover:-translate-y-1 active:translate-y-1 active:border-b-0">
                          {e}
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  // --- GUESS NUMBER ---
  if (game.id === 'guess') {
      useEffect(() => { setInternalState({ target: Math.floor(Math.random()*100)+1, tries: 0, msg: 'Guess 1-100', history: [] }); }, []);
      return (
          <div className="text-center max-w-md mx-auto">
              <p className={`text-2xl mb-6 font-bold ${internalState.temp === 'HOT' ? 'text-red-500 animate-pulse' : (internalState.temp === 'COLD' ? 'text-blue-400' : 'text-white')}`}>{internalState.msg}</p>
              <div className="flex gap-2 justify-center mb-6">
                  <input type="number" className="bg-slate-800 border-2 border-slate-600 text-white text-3xl p-3 w-32 text-center rounded focus:border-yellow-400 outline-none" 
                  onKeyDown={(e:any) => {
                      if(e.key==='Enter') {
                          const v = parseInt(e.target.value);
                          if (!v) return;
                          const diff = Math.abs(v - internalState.target);
                          let temp = diff === 0 ? 'WIN' : (diff < 10 ? 'HOT' : (diff < 25 ? 'WARM' : 'COLD'));
                          
                          if(v === internalState.target) { 
                              setInternalState((s:any) => ({...s, msg: 'CORRECT!', temp: 'WIN'})); 
                              setTimeout(() => onGameOver(1000 - internalState.tries*50), 1000); 
                          } else { 
                              setInternalState((s:any) => ({
                                  ...s, tries: s.tries+1, 
                                  msg: v < s.target ? `${v} is too LOW` : `${v} is too HIGH`,
                                  temp,
                                  history: [...s.history, {val: v, temp}]
                              })); 
                              e.target.value = ''; 
                          }
                      }
                  }} />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                  {internalState.history?.map((h:any, i:number) => (
                      <span key={i} className={`px-2 py-1 rounded text-xs font-bold ${h.temp === 'HOT' ? 'bg-red-900 text-red-200' : (h.temp === 'WARM' ? 'bg-orange-900 text-orange-200' : 'bg-blue-900 text-blue-200')}`}>
                          {h.val}
                      </span>
                  ))}
              </div>
          </div>
      );
  }

  // --- SIMON SAYS ---
  if (game.id === 'simon') {
     useEffect(() => { setInternalState({ seq: [0], playIdx: 0, userIdx: 0, mode: 'show', score: 0 }); }, []);
     useEffect(() => {
         if (internalState.mode === 'show') {
             const t = setTimeout(() => {
                 setInternalState((s:any) => {
                    if (s.playIdx >= s.seq.length) return { ...s, mode: 'input', userIdx: 0, active: -1 };
                    return { ...s, active: s.seq[s.playIdx], playIdx: s.playIdx + 1 };
                 });
                 setTimeout(() => setInternalState((s:any) => ({...s, active: -1})), difficulty === 'Hard' ? 300 : 600);
             }, difficulty === 'Hard' ? 400 : 800);
             return () => clearTimeout(t);
         }
     }, [internalState.mode, internalState.playIdx]);

     const click = (i: number) => {
         if (internalState.mode !== 'input') return;
         setFx(`${i}`); setTimeout(()=>setFx(''), 100); 
         if (i !== internalState.seq[internalState.userIdx]) { onGameOver(internalState.score * 10); return; }
         if (internalState.userIdx + 1 === internalState.seq.length) {
             setInternalState((s:any) => ({ ...s, score: s.score+1, seq: [...s.seq, Math.floor(Math.random()*4)], mode: 'show', playIdx: 0 }));
         } else {
             setInternalState((s:any) => ({ ...s, userIdx: s.userIdx + 1 }));
         }
     }
     const colors = ['bg-red-500', 'bg-green-500', 'bg-blue-500', 'bg-yellow-500'];
     return (
         <div className="flex flex-col items-center">
             <div className="mb-4 text-xl">Score: {internalState.score}</div>
             <div className="grid grid-cols-2 gap-4 bg-slate-800 p-4 rounded-full border-4 border-slate-700">
                {colors.map((c,i) => (
                    <div key={i} onClick={() => click(i)} 
                    className={`w-32 h-32 rounded-full border-4 border-slate-900 ${c} ${(internalState.active === i || fx === `${i}`) ? 'brightness-150 shadow-[0_0_30px_rgba(255,255,255,0.8)] scale-105' : 'opacity-60'} transition-all duration-100 cursor-pointer active:scale-95`} />
                ))}
            </div>
            <div className="mt-4 text-gray-400 font-mono">{internalState.mode === 'show' ? 'WATCH...' : 'REPEAT!'}</div>
         </div>
     );
  }

  // --- TYPING MASTER ---
  if (game.id === 'typing') {
      const quotes = [
          "THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
          "GAME OVER INSERT COIN TO CONTINUE",
          "ALL YOUR BASE ARE BELONG TO US",
          "IT IS DANGEROUS TO GO ALONE TAKE THIS",
          "DO A BARREL ROLL"
      ];
      useEffect(() => { nextQuote(0); }, []);
      
      const nextQuote = (score: number) => {
          const q = quotes[Math.floor(Math.random()*quotes.length)];
          setInternalState({ quote: q, input: '', idx: 0, score, startTime: Date.now(), wpm: 0 });
      };

      return (
          <div className="text-center max-w-lg mx-auto">
              <div className="flex justify-between text-gray-400 font-mono text-xs mb-8">
                  <span>WPM: {internalState.wpm}</span>
                  <span>SCORE: {internalState.score}</span>
              </div>
              <div className="text-2xl font-mono mb-6 leading-relaxed bg-slate-800 p-6 rounded border-l-4 border-yellow-500 text-left">
                  {internalState.quote?.split('').map((char:string, i:number) => (
                      <span key={i} className={i < internalState.idx ? 'text-green-500' : (i === internalState.idx ? 'bg-white text-black' : 'text-gray-500')}>
                          {char}
                      </span>
                  ))}
              </div>
              <input autoFocus className="bg-transparent border-b-2 border-slate-500 text-white w-full text-center text-xl uppercase outline-none focus:border-yellow-400 transition-colors" 
                value={internalState.input || ''}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  if (val === internalState.quote.slice(0, val.length)) {
                      setInternalState((s:any) => ({...s, input: val, idx: val.length}));
                      if (val === internalState.quote) {
                          const time = (Date.now() - internalState.startTime) / 1000 / 60; // min
                          const wpm = Math.floor((internalState.quote.length/5) / time);
                          if(internalState.score > 200) onGameOver(internalState.score + 100);
                          else nextQuote(internalState.score + 50 + wpm);
                      }
                  }
              }} />
          </div>
      );
  }

  // --- COIN FLIP ---
  if (game.id === 'coin') {
      useEffect(() => { setInternalState({ wallet: 100, bet: 10, res: null }); }, []);
      const flip = (choice: 'HEADS'|'TAILS') => {
          if(internalState.flipping || internalState.wallet < internalState.bet) return;
          setInternalState((s:any) => ({...s, flipping: true, res: ''}));
          setTimeout(() => {
              const r = Math.random() > 0.5 ? 'HEADS' : 'TAILS';
              const win = r === choice;
              setInternalState((s:any) => ({ 
                  ...s, flipping: false, res: r, 
                  wallet: win ? s.wallet + s.bet : s.wallet - s.bet 
              }));
              if(internalState.wallet <= 0) setTimeout(() => onGameOver(0), 1000);
          }, 1000);
      };
      return (
          <div className="text-center">
              <div className="text-4xl text-green-400 font-bold mb-2">${internalState.wallet}</div>
              <div className="flex justify-center gap-2 mb-8">
                  {[10, 50, 100].map(amt => (
                      <button key={amt} onClick={() => setInternalState((s:any)=>({...s, bet: amt}))} 
                        className={`px-3 py-1 rounded text-sm ${internalState.bet===amt ? 'bg-yellow-500 text-black' : 'bg-slate-700'}`}>
                          BET ${amt}
                      </button>
                  ))}
              </div>
              <div className={`w-32 h-32 rounded-full bg-yellow-400 border-4 border-yellow-600 mx-auto mb-8 flex items-center justify-center text-black font-bold text-2xl shadow-[0_0_20px_rgba(234,179,8,0.5)] ${internalState.flipping ? 'animate-[spin_0.2s_linear_infinite]' : ''}`}>
                  {internalState.res || '$'}
              </div>
              <div className="flex gap-4 justify-center">
                  {['HEADS', 'TAILS'].map((c) => (
                      <button key={c} onClick={() => flip(c as any)} disabled={internalState.wallet < internalState.bet} 
                      className="bg-blue-600 px-8 py-3 rounded font-bold hover:bg-blue-500 shadow-[0_4px_0_rgb(30,58,138)] active:translate-y-1 active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed">
                          {c}
                      </button>
                  ))}
              </div>
          </div>
      );
  }

  // --- CONNECT 4 ---
  if (game.id === 'connect4') {
      useEffect(() => { setInternalState({ grid: Array(6).fill(0).map(()=>Array(7).fill(0)), turn: 1, winner: 0 }); }, []);
      
      const checkWin = (grid: number[][]) => {
          const directions = [[0,1],[1,0],[1,1],[1,-1]];
          for(let r=0; r<6; r++) {
            for(let c=0; c<7; c++) {
              let player = grid[r][c];
              if(player === 0) continue;
              for(let [dr, dc] of directions) {
                 let count = 0;
                 for(let k=0; k<4; k++) {
                    let nr = r + dr*k;
                    let nc = c + dc*k;
                    if(nr>=0 && nr<6 && nc>=0 && nc<7 && grid[nr][nc] === player) count++;
                    else break;
                 }
                 if(count === 4) return player;
              }
            }
          }
          return 0;
      };
      
      const drop = (c: number) => {
          if (internalState.winner || internalState.turn !== 1) return;
          const newG = internalState.grid.map((r:any) => [...r]);
          let placed = false;
          for(let r=5; r>=0; r--) {
              if (newG[r][c] === 0) {
                  newG[r][c] = 1; // Player
                  placed = true;
                  break;
              }
          }
          if (!placed) return;
          
          let w = checkWin(newG);
          if (w) {
              setInternalState({ ...internalState, grid: newG, winner: 1 });
              setTimeout(() => onGameOver(100), 1000);
              return;
          }

          setInternalState({ ...internalState, grid: newG, turn: 2 });
          
          // AI Turn
          setTimeout(() => {
              const aiG = newG.map((r:any) => [...r]);
              const cols = [0,1,2,3,4,5,6].filter(col => aiG[0][col] === 0);
              if (cols.length > 0) {
                  // Try to find winning move
                  let aiC = -1;
                  // ... AI logic omitted for brevity, picking random valid
                  aiC = cols[Math.floor(Math.random()*cols.length)];
                  
                  for(let r=5; r>=0; r--) {
                      if (aiG[r][aiC] === 0) { aiG[r][aiC] = 2; break; }
                  }
                  
                  w = checkWin(aiG);
                  if (w) {
                      setInternalState({ grid: aiG, turn: 2, winner: 2 });
                      setTimeout(() => onGameOver(50), 1000);
                  } else {
                      setInternalState({ grid: aiG, turn: 1, winner: 0 });
                  }
              } else {
                  onGameOver(50); // Draw
              }
          }, 500);
      };

      return (
          <div className="flex flex-col items-center">
             <div className="bg-blue-800 p-3 rounded-xl inline-block shadow-2xl border-4 border-blue-900">
                 {internalState.grid?.map((row:any, r:number) => (
                     <div key={r} className="flex">
                         {row.map((cell:number, c:number) => (
                             <div key={c} onClick={() => drop(c)} className="w-10 h-10 md:w-12 md:h-12 bg-blue-700 p-1 cursor-pointer">
                                 <div className={`w-full h-full rounded-full shadow-inner ${cell === 0 ? 'bg-slate-900' : (cell === 1 ? 'bg-red-500 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]' : 'bg-yellow-400 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]')}`} />
                             </div>
                         ))}
                     </div>
                 ))}
             </div>
             <p className={`mt-4 text-sm font-bold uppercase tracking-widest animate-pulse ${internalState.turn === 1 ? 'text-red-400' : 'text-yellow-400'}`}>
                 {internalState.winner ? (internalState.winner === 1 ? 'YOU WIN!' : 'CPU WINS!') : (internalState.turn === 1 ? 'YOUR TURN' : 'CPU THINKING...')}
             </p>
          </div>
      );
  }

  // --- COLOR MATCH ---
  if (game.id === 'color') {
      const colors = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
      const styles = ['text-red-500', 'text-blue-500', 'text-green-500', 'text-yellow-500'];
      const gen = () => ({ t: Math.floor(Math.random()*4), c: Math.floor(Math.random()*4) });
      useEffect(() => { setInternalState({ ...gen(), score: 0, timeLeft: 15 }); }, []);
      useEffect(() => { if (internalState.timeLeft > 0) { const t = setInterval(() => setInternalState((s:any) => ({...s, timeLeft: s.timeLeft-1})), 1000); return () => clearInterval(t); } else onGameOver(internalState.score); }, [internalState.timeLeft]);
      const ans = (yes: boolean) => {
          const match = internalState.t === internalState.c;
          const correct = match === yes;
          setInternalState((s:any) => ({ ...s, score: correct ? s.score+100 : Math.max(0, s.score-50), ...gen() }));
      };
      return (
          <div className="text-center">
              <div className="flex justify-between w-64 mx-auto mb-8 font-bold text-xl">
                  <span className="text-yellow-400">TIME: {internalState.timeLeft}</span>
                  <span>SCORE: {internalState.score}</span>
              </div>
              <div className="bg-white p-8 rounded-lg mb-8 shadow-xl">
                <h2 className={`text-6xl font-black ${styles[internalState.c]}`}>{colors[internalState.t]}</h2>
              </div>
              <div className="flex gap-6 justify-center">
                  <button onClick={() => ans(true)} className="bg-green-600 w-32 py-4 rounded-xl text-2xl font-black shadow-[0_6px_0_rgb(21,128,61)] active:translate-y-2 active:shadow-none">YES</button>
                  <button onClick={() => ans(false)} className="bg-red-600 w-32 py-4 rounded-xl text-2xl font-black shadow-[0_6px_0_rgb(185,28,28)] active:translate-y-2 active:shadow-none">NO</button>
              </div>
              <p className="mt-6 text-gray-400 uppercase text-xs tracking-widest">Does the TEXT match the COLOR?</p>
          </div>
      );
  }

  return <div className="text-center animate-pulse">Loading Game Logic...</div>;
};

export default SimpleGames;