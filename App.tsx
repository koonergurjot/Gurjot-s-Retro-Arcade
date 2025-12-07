import React, { useState, useEffect } from 'react';
import { GAMES, CATEGORIES } from './constants';
import GameCanvas from './components/GameCanvas';
import SimpleGames from './components/SimpleGames';
import { getGuruCommentary } from './services/geminiService';
import { GameMetadata, Difficulty } from './types';

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeGame, setActiveGame] = useState<GameMetadata | null>(null);
  const [previewGame, setPreviewGame] = useState<GameMetadata | null>(null);
  const [scores, setScores] = useState<{[key:string]: number}>({});
  const [guruMsg, setGuruMsg] = useState<string>("Pick a game, champion!");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isGameLoading, setIsGameLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('Medium');
  const [isGuruLoading, setIsGuruLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // New Features
  const [totalXp, setTotalXp] = useState(0);
  const [gamerLevel, setGamerLevel] = useState(1);
  const [dailyChallengeId, setDailyChallengeId] = useState('');

  // XP to next level formula
  const xpForNextLevel = gamerLevel * 1000;
  const progressPercent = (totalXp / xpForNextLevel) * 100;

  useEffect(() => {
      // Pick random daily challenge on mount
      const randomGame = GAMES[Math.floor(Math.random() * GAMES.length)];
      setDailyChallengeId(randomGame.id);

      // Fullscreen listener
      const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
      if (totalXp >= xpForNextLevel) {
          setTotalXp(totalXp - xpForNextLevel);
          setGamerLevel(l => l + 1);
          setGuruMsg("LEVEL UP! YOU ARE A LEGEND!");
      }
  }, [totalXp, xpForNextLevel]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const filteredGames = GAMES.filter(g => {
    const matchesCategory = selectedCategory === 'All' || g.category === selectedCategory;
    const matchesSearch = g.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleGameOver = async (score: number) => {
    if (!activeGame) return;
    
    // XP Calculation
    let xpGain = Math.floor(score / 2); // Base XP
    if (activeGame.id === dailyChallengeId) xpGain *= 2; // Daily Bonus
    setTotalXp(x => x + xpGain);

    const oldHigh = scores[activeGame.id] || 0;
    const isNewHigh = score > oldHigh;
    if (isNewHigh) {
      setScores(prev => ({ ...prev, [activeGame.id]: score }));
    }

    setIsGuruLoading(true);
    const advice = await getGuruCommentary(activeGame.title, 'end', score, isNewHigh ? "New High Score!" : "Tried hard.");
    setGuruMsg(advice);
    setIsGuruLoading(false);
  };

  const loadGame = async (game: GameMetadata) => {
    setActiveGame(game);
    setPreviewGame(null);
    setGuruMsg(`Loading info for ${game.title}...`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setIsGameLoading(true);
    
    // Fetch start advice
    setIsGuruLoading(true);
    getGuruCommentary(game.title, 'start').then(msg => {
        setGuruMsg(msg);
        setIsGuruLoading(false);
    });

    setTimeout(() => {
        setIsGameLoading(false);
    }, 1000);
  };

  const handleGetHint = async () => {
      if (!activeGame) return;
      setIsGuruLoading(true);
      const hint = await getGuruCommentary(activeGame.title, 'playing');
      setGuruMsg(hint);
      setIsGuruLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 flex flex-col font-sans relative overflow-x-hidden selection:bg-yellow-500 selection:text-black">
      
      {/* GLOBAL RETRO STYLES */}
      <style>{`
        @keyframes move-grid {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }
        @keyframes crt-turn-on {
          0% { transform: scale(1, 0.002); opacity: 0; }
          35% { transform: scale(1, 0.002); opacity: 1; }
          60% { transform: scale(1, 1); opacity: 1; }
          100% { transform: scale(1, 1); opacity: 1; }
        }
        .retro-grid-bg {
          background-image: 
            linear-gradient(to right, rgba(6, 182, 212, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: move-grid 2s linear infinite;
        }
        .retro-card {
          clip-path: polygon(
            0 15px, 15px 0, 
            calc(100% - 15px) 0, 100% 15px, 
            100% calc(100% - 15px), calc(100% - 15px) 100%, 
            15px 100%, 0 calc(100% - 15px)
          );
        }
        .scanlines {
            background: linear-gradient(
                to bottom,
                rgba(255,255,255,0),
                rgba(255,255,255,0) 50%,
                rgba(0,0,0,0.2) 50%,
                rgba(0,0,0,0.2)
            );
            background-size: 100% 4px;
        }
        .animate-crt {
            animation: crt-turn-on 0.2s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
      `}</style>

      {/* BACKGROUND EFFECTS */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-slate-900">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/30 via-slate-950 to-black"></div>
         <div className="absolute -inset-[100%] top-0 retro-grid-bg opacity-20 transform origin-top perspective-1000 rotate-x-12 scale-150"></div>
      </div>

      {/* HEADER */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b-4 border-yellow-500 p-4 sticky top-0 z-40 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
        <div className="container mx-auto flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveGame(null)}>
            <div className="w-12 h-12 bg-yellow-400 rounded-lg retro-card flex items-center justify-center text-blue-900 font-bold text-2xl border-2 border-white group-hover:bg-yellow-300 transition-colors shadow-lg shadow-yellow-500/50">G</div>
            <div className="flex flex-col">
                <h1 className="text-2xl md:text-3xl font-arcade text-white tracking-wider neon-text drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                GURJOT'S
                </h1>
                <span className="text-xs tracking-[0.3em] text-cyan-400 font-bold uppercase">Retro Arcade</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* FULLSCREEN TOGGLE */}
            <button 
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center bg-slate-800 border border-slate-600 rounded hover:border-cyan-400 hover:text-cyan-400 text-gray-400 transition-all active:scale-95"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                 </svg>
              ) : (
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                 </svg>
              )}
            </button>

            {/* LEVEL BADGE */}
            <div className="hidden md:flex items-center gap-4 bg-slate-800/80 px-4 py-1.5 rounded-full border border-slate-600 shadow-lg">
                <div className="text-right">
                    <div className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">Gamer Level</div>
                    <div className="text-cyan-400 font-bold font-arcade leading-none">{gamerLevel}</div>
                </div>
                <div className="w-9 h-9 rounded-full border-2 border-slate-700 flex items-center justify-center relative bg-slate-900">
                    <svg className="w-10 h-10 absolute -top-0.5 -left-0.5 transform -rotate-90">
                        <circle cx="20" cy="20" r="18" stroke="rgba(255,255,255,0.1)" strokeWidth="3" fill="none" />
                        <circle cx="20" cy="20" r="18" stroke="#06b6d4" strokeWidth="3" fill="none" strokeDasharray="113" strokeDashoffset={113 - (113 * progressPercent / 100)} className="transition-all duration-1000" />
                    </svg>
                    <span className="text-[10px] font-bold text-white relative z-10">{Math.floor(progressPercent)}%</span>
                </div>
            </div>

            <button 
                className="md:hidden text-white bg-blue-600 p-2 rounded retro-card active:scale-95 text-xs font-bold"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
                MENU
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 container mx-auto p-4 gap-6 relative z-10">
        
        {/* SIDEBAR */}
        <aside className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-72 bg-slate-800/80 backdrop-blur p-5 rounded-none retro-card border border-slate-600 h-fit sticky top-28 shadow-2xl`}>
          <div className="mb-8">
             <div className="flex justify-between items-center mb-3">
                 <h3 className="text-yellow-400 font-arcade text-xs uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    AI Game Guru
                 </h3>
                 {isGuruLoading && <div className="animate-spin h-3 w-3 border-2 border-slate-600 border-t-yellow-400 rounded-full"></div>}
             </div>
             
             <div className={`bg-black/50 p-4 rounded retro-card border-l-4 border-cyan-500 min-h-[80px] flex items-center mb-3 transition-all ${isGuruLoading ? 'opacity-50 blur-[1px]' : 'opacity-100'}`}>
               <p className="text-sm font-mono text-cyan-100 leading-relaxed"><span className="text-cyan-500 mr-2">{">"}</span>{guruMsg}</p>
             </div>
             
             {activeGame && (
                 <button 
                    onClick={handleGetHint}
                    disabled={isGuruLoading}
                    className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-gray-500 text-white text-xs font-bold py-3 rounded-none retro-card flex items-center justify-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(37,99,235,0.5)] active:translate-y-0.5"
                 >
                    <span>💡</span> ASK GURU FOR HELP
                 </button>
             )}
          </div>

          <div>
            <h3 className="text-yellow-400 font-arcade mb-3 text-xs uppercase tracking-widest">High Scores</h3>
            <div className="bg-black/40 p-1 rounded">
                <ul className="space-y-1 max-h-60 overflow-y-auto pr-1 scanlines">
                {Object.keys(scores).length === 0 && <li className="text-gray-500 text-xs font-mono p-2">INSERT COIN TO START...</li>}
                {Object.entries(scores).map(([id, score]) => {
                    const g = GAMES.find(x => x.id === id);
                    return (
                    <li key={id} className="flex justify-between text-xs font-mono border-b border-white/10 p-2 hover:bg-white/5">
                        <span className="truncate w-32 text-gray-300">{g?.title}</span>
                        <span className="font-bold text-yellow-400">{score.toString().padStart(6, '0')}</span>
                    </li>
                    );
                })}
                </ul>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 min-w-0">
          
          {/* GAME RUNNER */}
          {activeGame ? (
             <div className="bg-slate-800/90 backdrop-blur rounded-none retro-card p-1 shadow-2xl border-2 border-slate-600 animate-crt">
                <div className="bg-slate-900 p-6 rounded-inner">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b border-slate-700 pb-4">
                        <div>
                            <h2 className="text-3xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 filter drop-shadow-[0_2px_0_rgba(234,179,8,0.5)]">{activeGame.title}</h2>
                            <span className="text-xs font-mono text-gray-400 uppercase tracking-widest mt-1 block">Playing Now</span>
                        </div>
                        <button onClick={() => setActiveGame(null)} className="text-red-500 hover:text-red-400 font-bold font-mono border border-red-500/50 hover:bg-red-500/10 px-4 py-2 rounded uppercase text-xs transition-all">
                            Exit Game [ESC]
                        </button>
                    </div>
                    
                    <div className="flex justify-center items-center bg-black rounded border-4 border-slate-800 overflow-hidden min-h-[480px] relative shadow-[inset_0_0_20px_rgba(0,0,0,1)]">
                        <div className="absolute inset-0 pointer-events-none scanlines opacity-10 z-10"></div>
                        {isGameLoading ? (
                            <div className="flex flex-col items-center animate-fade-in z-20">
                                <div className="w-16 h-16 border-4 border-t-yellow-400 border-r-transparent border-b-yellow-400 border-l-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-yellow-400 font-arcade text-sm animate-pulse tracking-widest">LOADING ROM...</p>
                            </div>
                        ) : (
                            <div className="relative z-0 w-full h-full flex justify-center">
                                {activeGame.type === 'canvas' ? (
                                    <GameCanvas game={activeGame} difficulty={selectedDifficulty} onGameOver={handleGameOver} />
                                ) : (
                                    <div className="p-8 w-full flex items-center justify-center">
                                    <SimpleGames game={activeGame} difficulty={selectedDifficulty} onGameOver={handleGameOver} />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
             </div>
          ) : (
             /* GAME LIBRARY */
             <div className="space-y-8">
               
               {/* Controls Bar */}
               <div className="flex flex-col xl:flex-row gap-6 justify-between items-center bg-slate-800/80 p-5 rounded-none retro-card border-2 border-slate-700/50 backdrop-blur-sm shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-cyan-500"></div>
                 
                 {/* Categories */}
                 <div className="flex flex-wrap gap-3 justify-center xl:justify-start">
                   {CATEGORIES.map(cat => (
                     <button 
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-5 py-2 rounded-sm text-xs font-bold font-arcade tracking-wider transition-all uppercase border-b-2 active:translate-y-0.5 ${selectedCategory === cat ? 'bg-yellow-500 border-yellow-700 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-slate-700 border-slate-900 text-gray-400 hover:text-white hover:bg-slate-600'}`}
                     >
                       {cat}
                     </button>
                   ))}
                 </div>

                 {/* Search */}
                 <div className="relative w-full xl:w-72">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      className="block w-full pl-10 pr-3 py-3 border-2 border-slate-600 bg-black/50 text-cyan-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:shadow-[0_0_10px_rgba(6,182,212,0.3)] sm:text-sm font-mono transition-all retro-card"
                      placeholder="SEARCH_GAMES_"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
               </div>

               {/* Grid */}
               {filteredGames.length > 0 ? (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                   {filteredGames.map(game => (
                     <div 
                        key={game.id}
                        className="group relative bg-slate-800 retro-card overflow-hidden border-2 border-slate-700 hover:border-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:z-10 transition-all duration-200 ease-out cursor-pointer"
                        onClick={() => { setPreviewGame(game); setSelectedDifficulty('Medium'); }}
                     >
                       <div className="relative h-44 overflow-hidden bg-black border-b-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors">
                         <div className="absolute inset-0 scanlines opacity-30 z-10 pointer-events-none"></div>
                         <img 
                            src={game.thumbnail} 
                            alt={game.title} 
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110 opacity-90 group-hover:opacity-100" 
                         />
                         <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80" />
                         <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                            <span className="bg-black/80 backdrop-blur text-cyan-400 text-[10px] font-bold px-2 py-1 border border-cyan-500/30 rounded-sm font-mono uppercase">
                                {game.category}
                            </span>
                         </div>
                       </div>
                       
                       <div className="p-4 bg-gradient-to-b from-slate-800 to-slate-900">
                         <h3 className="font-bold text-base text-white mb-2 truncate group-hover:text-cyan-300 font-arcade leading-tight tracking-wide">{game.title}</h3>
                         <div className="flex justify-between items-center mt-3">
                           <span className="text-[10px] text-gray-500 group-hover:text-yellow-400 font-mono transition-colors">CLICK TO START</span>
                           <div className="w-6 h-6 rounded-sm bg-slate-700 group-hover:bg-cyan-500 flex items-center justify-center transition-all group-hover:shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                              <svg className="w-3 h-3 text-gray-400 group-hover:text-black" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-500 opacity-60">
                      <div className="text-6xl mb-4 font-arcade animate-bounce">?</div>
                      <p className="text-xl font-mono uppercase">System Error: No Games Found</p>
                      <button onClick={() => {setSearchQuery(''); setSelectedCategory('All')}} className="mt-6 text-cyan-400 hover:text-cyan-300 underline font-mono">REBOOT SEARCH SYSTEM</button>
                  </div>
               )}
             </div>
          )}
        </main>
      </div>

      {/* GAME PREVIEW MODAL */}
      {previewGame && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setPreviewGame(null)}>
           <div className="animate-crt bg-slate-900 border-2 border-yellow-500 rounded-none retro-card max-w-2xl w-full shadow-[0_0_50px_rgba(234,179,8,0.2)] relative overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
              
              <div className="absolute inset-0 scanlines opacity-10 pointer-events-none z-20"></div>

              <button 
                onClick={() => setPreviewGame(null)}
                className="absolute top-3 right-3 text-red-500 hover:text-red-400 z-30 bg-black/60 border border-red-500/50 hover:bg-red-500/20 w-8 h-8 flex items-center justify-center transition-all font-mono font-bold"
              >✕</button>

              <div className="flex flex-col md:flex-row h-full">
                 {/* Image Side */}
                 <div className="w-full md:w-5/12 h-48 md:h-auto relative bg-black border-b md:border-b-0 md:border-r border-slate-700 group">
                    <img src={previewGame.thumbnail} alt={previewGame.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                 </div>

                 {/* Content Side */}
                 <div className="w-full md:w-7/12 p-6 md:p-8 flex flex-col justify-between bg-slate-900 relative">
                    <div>
                      <h2 className="text-3xl font-arcade text-yellow-400 mb-2 leading-none drop-shadow-md tracking-wide">{previewGame.title}</h2>
                      <div className="flex gap-2 mb-4">
                         <span className="bg-slate-800 text-cyan-400 text-[10px] px-2 py-0.5 border border-cyan-500/30 uppercase font-mono">{previewGame.category}</span>
                         <span className="bg-slate-800 text-purple-400 text-[10px] px-2 py-0.5 border border-purple-500/30 uppercase font-mono">{previewGame.type}</span>
                      </div>
                      <p className="text-gray-300 text-sm mb-6 leading-relaxed font-mono border-l-2 border-slate-700 pl-3">{previewGame.description}</p>
                      
                      <div className="bg-black/30 p-3 border border-slate-700/50 rounded-sm">
                        <h4 className="text-[10px] uppercase text-green-500 font-bold mb-1 tracking-wider font-arcade">Mission Objectives</h4>
                        <p className="text-xs text-gray-400 font-mono">{previewGame.instructions}</p>
                      </div>
                    </div>

                    <div className="mt-8">
                       {previewGame.type === 'canvas' && (
                         <div className="mb-5">
                           <label className="text-[10px] text-gray-500 uppercase font-bold block mb-2 font-mono tracking-widest">Select Difficulty Mode</label>
                           <div className="flex gap-2">
                              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                                <button
                                  key={d}
                                  onClick={() => setSelectedDifficulty(d)}
                                  className={`flex-1 py-2 text-xs font-bold border-2 transition-all uppercase font-arcade ${selectedDifficulty === d ? 'bg-yellow-500 border-yellow-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.4)]' : 'bg-transparent text-gray-500 border-gray-700 hover:border-gray-500'}`}
                                >
                                  {d}
                                </button>
                              ))}
                           </div>
                         </div>
                       )}

                       <button 
                         onClick={() => loadGame(previewGame)}
                         className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold py-4 text-xl shadow-[0_4px_0_rgb(21,128,61)] hover:shadow-[0_2px_0_rgb(21,128,61)] hover:translate-y-0.5 active:translate-y-1 active:shadow-none transition-all uppercase tracking-widest font-arcade border-2 border-green-400/50 relative overflow-hidden group"
                       >
                         <span className="relative z-10 drop-shadow-md">Insert Coin & Play</span>
                         <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                       </button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      <footer className="bg-slate-900 border-t border-slate-800 p-8 mt-12 text-center text-gray-600 text-xs font-mono relative z-10">
        <p className="mb-2 uppercase tracking-widest">&copy; 2024 Gurjot's Games. All rights reserved.</p>
        <p className="text-slate-700">POWERED BY GEMINI AI • REACT • TAILWIND</p>
      </footer>
    </div>
  );
}