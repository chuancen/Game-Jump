
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import Shop from './components/Shop.tsx';
import LevelEditor from './components/LevelEditor.tsx';
import Leaderboard from './components/Leaderboard.tsx';
import AchievementsList from './components/AchievementsList.tsx';
import { GameState, GameMode, CustomLevel, LeaderboardEntry, UserStats } from './types.ts';
import { COSMETICS, ACHIEVEMENTS } from './constants.ts';
import { sfx } from './services/audioService.ts';

const LEVEL_TARGETS = [1000, 1500, 2000, 2500, 3500, 5000, 7500, 10000];

const INITIAL_LEADERBOARD: LeaderboardEntry[] = [
  { username: 'V0ID_WALKER', score: 154200, rank: 'SPECTRE', skinId: 'glitch', timestamp: Date.now() - 100000 },
  { username: 'NE0_ZEN', score: 98550, rank: 'ELITE', skinId: 'gold', timestamp: Date.now() - 200000 },
  { username: 'CYB3R_PUNK', score: 72100, rank: 'ELITE', skinId: 'robot', timestamp: Date.now() - 300000 },
];

const App: React.FC = () => {
  const [username, setUsername] = useState<string>(localStorage.getItem('neon_user') || '');
  const [loginInput, setLoginInput] = useState<string>('');
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.CLASSIC);
  const [highScore, setHighScore] = useState<number>(0);
  const [rushProgress, setRushProgress] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [coins, setCoins] = useState<number>(0);
  const [lives, setLives] = useState<number>(1);
  
  const [unlockedLevel, setUnlockedLevel] = useState<number>(1);
  const [selectedLevelIdx, setSelectedLevelIdx] = useState<number>(0);
  const [sessionSeed, setSessionSeed] = useState<number>(0);

  const [customLevels, setCustomLevels] = useState<CustomLevel[]>([]);
  const [activeCustomLevel, setActiveCustomLevel] = useState<CustomLevel | null>(null);

  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [showLevelSelect, setShowLevelSelect] = useState(false);
  const [selectedCheckpointInterval, setSelectedCheckpointInterval] = useState(200);

  const [showSecretTerminal, setShowSecretTerminal] = useState(false);
  const [secretInput, setSecretInput] = useState('');
  const terminalInputRef = useRef<HTMLInputElement>(null);

  const [extraLivesBought, setExtraLivesBought] = useState(0);
  const [jumpLevel, setJumpLevel] = useState(0);
  const [meterLevel, setMeterLevel] = useState(0);
  const [unlockedCosmetics, setUnlockedCosmetics] = useState<Record<string, string[]>>({
    SKINS: ['default'],
    TRAILS: ['none'],
    DEATH_FX: ['poof'],
    PAD_THEMES: ['classic']
  });
  const [activeCosmetics, setActiveCosmetics] = useState<Record<string, string>>({
    SKINS: 'default',
    TRAILS: 'none',
    DEATH_FX: 'poof',
    PAD_THEMES: 'classic'
  });

  const [totalAltitude, setTotalAltitude] = useState(0);
  const [spentLevelPoints, setSpentLevelPoints] = useState(0);
  const [doubleCreditsNextRound, setDoubleCreditsNextRound] = useState(false);
  const [doubleJumpNextRound, setDoubleJumpNextRound] = useState(false);
  const [isBuffActiveThisRound, setIsBuffActiveThisRound] = useState(false);
  const [isDoubleJumpActiveThisRound, setIsDoubleJumpActiveThisRound] = useState(false);
  const [activeLevelBoosts, setActiveLevelBoosts] = useState<string[]>([]);
  const [boostsThisRound, setBoostsThisRound] = useState<string[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [leaderboardEntries, setLeaderboardEntries] = useState<LeaderboardEntry[]>([]);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    totalMeters: 0,
    totalJumps: 0,
    totalDeaths: 0,
    sectorsBeat: 0,
    killPadsSurvived: 0,
    coinsEarned: 0
  });

  const userPrefix = username ? `neon_${username}_` : 'neon_';

  useEffect(() => {
    if (!username) return;
    setHighScore(parseInt(localStorage.getItem(userPrefix + 'hs') || '0'));
    setRushProgress(parseInt(localStorage.getItem(userPrefix + 'rush_progress') || '0'));
    setUnlockedLevel(parseInt(localStorage.getItem(userPrefix + 'unlocked_level') || '1'));
    setCoins(parseInt(localStorage.getItem(userPrefix + 'cr') || '0'));
    setExtraLivesBought(parseInt(localStorage.getItem(userPrefix + 'lives') || '0'));
    setJumpLevel(parseInt(localStorage.getItem(userPrefix + 'jump') || '0'));
    setMeterLevel(parseInt(localStorage.getItem(userPrefix + 'meter') || '0'));
    setTotalAltitude(parseInt(localStorage.getItem(userPrefix + 'total_alt') || '0'));
    setSpentLevelPoints(parseInt(localStorage.getItem(userPrefix + 'spent_pts') || '0'));
    
    const savedCosmetics = localStorage.getItem(userPrefix + 'unlocked_cosmetics');
    if (savedCosmetics) setUnlockedCosmetics(JSON.parse(savedCosmetics));
    
    const savedActive = localStorage.getItem(userPrefix + 'active_cosmetics');
    if (savedActive) setActiveCosmetics(JSON.parse(savedActive));

    const savedLevels = localStorage.getItem(userPrefix + 'custom_levels');
    if (savedLevels) setCustomLevels(JSON.parse(savedLevels));

    const savedStats = localStorage.getItem(userPrefix + 'stats');
    if (savedStats) setUserStats(JSON.parse(savedStats));

    const savedAch = localStorage.getItem(userPrefix + 'achievements');
    if (savedAch) setUnlockedAchievements(JSON.parse(savedAch));

    const savedLeaderboard = localStorage.getItem('neon_global_leaderboard');
    if (savedLeaderboard) {
      setLeaderboardEntries(JSON.parse(savedLeaderboard));
    } else {
      setLeaderboardEntries(INITIAL_LEADERBOARD);
    }
  }, [username, userPrefix]);

  const levelData = useMemo(() => {
    const level = Math.floor(Math.sqrt(totalAltitude / 150)) + 1;
    const currentLevelXP = Math.pow(level - 1, 2) * 150;
    const nextLevelXP = Math.pow(level, 2) * 150;
    const progress = Math.min(100, Math.max(0, ((totalAltitude - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));
    const availablePoints = Math.max(0, (level - 1) - spentLevelPoints);
    let rank = 'NOVICE';
    if (level >= 5) rank = 'OPERATIVE';
    if (level >= 15) rank = 'VANGUARD';
    if (level >= 30) rank = 'ELITE';
    if (level >= 50) rank = 'SPECTRE';
    return { level, progress, rank, nextLevelXP, availablePoints };
  }, [totalAltitude, spentLevelPoints]);

  const checkAchievements = useCallback((newStats: UserStats) => {
    ACHIEVEMENTS.forEach(ach => {
      if (unlockedAchievements.includes(ach.id)) return;
      
      let val = 0;
      if (ach.id.includes('meters')) val = newStats.totalMeters;
      else if (ach.id.includes('sectors')) val = newStats.sectorsBeat;
      else if (ach.id.includes('coins')) val = newStats.coinsEarned;
      else if (ach.id.includes('deaths')) val = newStats.totalDeaths;

      if (val >= ach.goal) {
        setUnlockedAchievements(prev => {
          const next = [...prev, ach.id];
          localStorage.setItem(userPrefix + 'achievements', JSON.stringify(next));
          return next;
        });
        
        if (ach.rewardType === 'COINS') {
          setCoins(c => {
            const next = c + ach.rewardAmount;
            localStorage.setItem(userPrefix + 'cr', next.toString());
            return next;
          });
        } else {
          setTotalAltitude(a => {
            const next = a + ach.rewardAmount;
            localStorage.setItem(userPrefix + 'total_alt', next.toString());
            return next;
          });
        }
        sfx.playPowerup();
      }
    });
  }, [unlockedAchievements, userPrefix]);

  const updateLeaderboard = useCallback((score: number) => {
    const entry: LeaderboardEntry = {
      username: username || 'UNKNOWN',
      score,
      rank: levelData.rank,
      skinId: activeCosmetics.SKINS,
      timestamp: Date.now()
    };
    
    setLeaderboardEntries(prev => {
      const existingIndex = prev.findIndex(e => e.username === entry.username);
      let next;
      if (existingIndex !== -1) {
        if (score > prev[existingIndex].score) {
          next = [...prev];
          next[existingIndex] = entry;
        } else {
          return prev;
        }
      } else {
        next = [...prev, entry];
      }
      const sorted = next.sort((a, b) => b.score - a.score).slice(0, 15);
      localStorage.setItem('neon_global_leaderboard', JSON.stringify(sorted));
      return sorted;
    });
  }, [username, levelData.rank, activeCosmetics.SKINS]);

  const handleStart = (mode: GameMode = GameMode.CLASSIC, interval: number = 200, level?: CustomLevel, levelIdx?: number, isReboot: boolean = false) => {
    sfx.playClick();
    setIsTransitioning(true);
    
    setTimeout(async () => {
      setGameMode(mode);
      setSelectedCheckpointInterval(interval);
      setActiveCustomLevel(level || null);
      if (levelIdx !== undefined) setSelectedLevelIdx(levelIdx);
      
      if (mode === GameMode.LEVELS && levelIdx !== undefined) {
        setSessionSeed(levelIdx + 1); 
      } else {
        setSessionSeed(Math.floor(Math.random() * 1000000)); 
      }

      let startingLives = (mode === GameMode.RUSH) ? Infinity : (1 + extraLivesBought);
      if (mode === GameMode.LEVELS) startingLives = 1;
      if (activeLevelBoosts.includes('overdrive') && mode === GameMode.CLASSIC) startingLives += 3;
      
      setLives(startingLives);
      setIsBuffActiveThisRound(doubleCreditsNextRound);
      setIsDoubleJumpActiveThisRound(doubleJumpNextRound);
      setBoostsThisRound([...activeLevelBoosts]);
      
      setDoubleCreditsNextRound(false); 
      setDoubleJumpNextRound(false);
      setActiveLevelBoosts([]); 
      setGameState(GameState.PLAYING);
      setShowDifficultySelect(false);
      setShowLevelSelect(false);
      setIsTransitioning(false);
      
      sfx.startMusic();
    }, 400);
  };

  const handleCheckpointReached = useCallback((altitude: number) => {
    if (gameMode === GameMode.RUSH) {
      setRushProgress(altitude);
      localStorage.setItem(userPrefix + 'rush_progress', altitude.toString());
    }
  }, [gameMode, userPrefix]);

  const handleLevelComplete = useCallback((score: number) => {
    setCurrentScore(score);
    setIsTransitioning(true);
    sfx.stopMusic();
    setTimeout(() => {
      if (gameMode === GameMode.LEVELS) {
        const nextLvl = selectedLevelIdx + 2;
        if (nextLvl > unlockedLevel) {
          setUnlockedLevel(nextLvl);
          localStorage.setItem(userPrefix + 'unlocked_level', nextLvl.toString());
        }
        setUserStats(prev => {
          const next = { ...prev, sectorsBeat: prev.sectorsBeat + 1, totalMeters: prev.totalMeters + score };
          localStorage.setItem(userPrefix + 'stats', JSON.stringify(next));
          checkAchievements(next);
          return next;
        });
      }
      const newTotal = totalAltitude + score;
      setTotalAltitude(newTotal);
      localStorage.setItem(userPrefix + 'total_alt', newTotal.toString());
      setGameState(GameState.GAMEOVER);
      setIsTransitioning(false);
      sfx.playPowerup();
      updateLeaderboard(score);
    }, 500);
  }, [gameMode, selectedLevelIdx, unlockedLevel, totalAltitude, userPrefix, updateLeaderboard, checkAchievements]);

  const handleGameOver = useCallback((score: number) => {
    setCurrentScore(score);
    setIsTransitioning(true);
    sfx.stopMusic();
    setTimeout(async () => {
      if (gameMode === GameMode.CLASSIC && score > highScore) {
        setHighScore(score);
        localStorage.setItem(userPrefix + 'hs', score.toString());
      } else if (gameMode === GameMode.RUSH && score > rushProgress) {
        setRushProgress(score);
        localStorage.setItem(userPrefix + 'rush_progress', score.toString());
      }
      
      const altitudeGain = boostsThisRound.includes('xp_surge') ? score * 2 : score;
      const newTotal = totalAltitude + altitudeGain;
      setTotalAltitude(newTotal);
      localStorage.setItem(userPrefix + 'total_alt', newTotal.toString());
      
      setUserStats(prev => {
        const next = { ...prev, totalMeters: prev.totalMeters + score, totalDeaths: prev.totalDeaths + 1 };
        localStorage.setItem(userPrefix + 'stats', JSON.stringify(next));
        checkAchievements(next);
        return next;
      });

      setGameState(GameState.GAMEOVER);
      setIsTransitioning(false);
      updateLeaderboard(score);
    }, 500);
  }, [highScore, rushProgress, totalAltitude, boostsThisRound, gameMode, userPrefix, updateLeaderboard, checkAchievements]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      sfx.playClick();
      localStorage.setItem('neon_user', loginInput.trim());
      setUsername(loginInput.trim());
    }
  };

  const handleLogout = () => {
    sfx.playClick();
    sfx.stopMusic();
    localStorage.removeItem('neon_user');
    setUsername('');
    setLoginInput('');
  };

  const handleSecretAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (secretInput === "jokeysin4430") {
      const bonus = 999999;
      setCoins(prev => {
        const next = prev + bonus;
        localStorage.setItem(userPrefix + 'cr', next.toString());
        return next;
      });
      sfx.playPowerup();
      alert("Clearance confirmed. Neural link saturated with tokens.");
      setShowSecretTerminal(false);
      setSecretInput('');
    } else {
      sfx.playDeath();
      alert("Invalid Clearance Key.");
      setSecretInput('');
    }
  };

  const openSecretTerminal = () => {
    sfx.playClick();
    setShowSecretTerminal(true);
    setTimeout(() => terminalInputRef.current?.focus(), 100);
  };

  const goHome = () => {
    sfx.playClick();
    sfx.stopMusic();
    setIsTransitioning(true);
    setTimeout(() => {
      setGameState(GameState.START);
      setShowDifficultySelect(false);
      setShowLevelSelect(false);
      setIsTransitioning(false);
    }, 300);
  };

  const persistCoins = (newVal: number) => {
    localStorage.setItem(userPrefix + 'cr', newVal.toString());
  };

  const handleBuyCosmetic = (type: string, id: string, cost: number) => {
    sfx.playPowerup();
    setCoins(c => {
      const newVal = c - cost;
      persistCoins(newVal);
      return newVal;
    });
    setUnlockedCosmetics(prev => {
      const currentList = prev[type] || [];
      const next = { ...prev, [type]: [...currentList, id] };
      localStorage.setItem(userPrefix + 'unlocked_cosmetics', JSON.stringify(next));
      return next;
    });
  };

  const handleEquipCosmetic = (type: string, id: string) => {
    sfx.playClick();
    setActiveCosmetics(prev => {
      const next = { ...prev, [type]: id };
      localStorage.setItem(userPrefix + 'active_cosmetics', JSON.stringify(next));
      return next;
    });
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="bg-black/60 border-2 border-cyan-500 p-10 rounded-3xl shadow-[0_0_60px_rgba(0,255,255,0.3)] max-w-md w-full text-center space-y-8 animate-in zoom-in">
          <h1 className="text-6xl font-orbitron font-bold text-cyan-400 italic">ASCENT</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input autoFocus value={loginInput} onChange={(e) => setLoginInput(e.target.value)} placeholder="CODENAME" className="w-full bg-black border-2 border-cyan-500/30 p-4 font-orbitron text-cyan-400 text-center outline-none focus:border-cyan-500 transition-all rounded-xl" />
            <button type="submit" className="w-full bg-cyan-500 text-black py-4 font-orbitron font-bold uppercase tracking-widest hover:bg-white transition-all rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.4)]">Connect</button>
          </form>
        </div>
      </div>
    );
  }

  const equippedSkinValue = COSMETICS.SKINS.find(s => s.id === activeCosmetics.SKINS)?.value || '#00ffaa';

  return (
    <div className="h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-2 md:p-4 relative overflow-hidden">
      <div className={`fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm pointer-events-none transition-opacity duration-500 ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}></div>

      {showSecretTerminal && (
        <div className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-black border-2 border-green-500 p-8 rounded-2xl w-full max-w-sm shadow-[0_0_50px_rgba(34,197,94,0.2)] animate-in zoom-in">
             <div className="text-green-500 font-orbitron text-[10px] mb-4 uppercase tracking-[0.5em] flex justify-between">
                <span>Secret Terminal v4.4.3</span>
                <button onClick={() => setShowSecretTerminal(false)} className="hover:text-white transition-colors"><i className="fas fa-times"></i></button>
             </div>
             <form onSubmit={handleSecretAccessSubmit} className="space-y-4">
                <div className="text-green-500 font-mono text-sm mb-2">> ENTER_AUTH_CODE:</div>
                <input ref={terminalInputRef} value={secretInput} onChange={e => setSecretInput(e.target.value)} className="w-full bg-black border border-green-500/30 p-4 font-mono text-green-400 outline-none focus:border-green-500 transition-all rounded" spellCheck={false} />
                <button type="submit" className="w-full bg-green-500 text-black py-3 font-orbitron font-bold uppercase tracking-widest hover:bg-white transition-all rounded">Override</button>
             </form>
          </div>
        </div>
      )}

      {gameState === GameState.EDITOR && <LevelEditor onSave={(level) => { sfx.playPowerup(); setCustomLevels([...customLevels, level]); localStorage.setItem(userPrefix + 'custom_levels', JSON.stringify([...customLevels, level])); setGameState(GameState.START); }} onClose={goHome} />}
      
      {gameState === GameState.LEADERBOARD && (
        <Leaderboard entries={leaderboardEntries} currentUser={username} onClose={goHome} />
      )}

      {gameState === GameState.ACHIEVEMENTS && (
        <AchievementsList stats={userStats} unlockedIds={unlockedAchievements} onClose={goHome} />
      )}

      {gameState === GameState.SHOP && (
        <Shop 
          coins={coins} extraLives={extraLivesBought} jumpLevel={jumpLevel} meterLevel={meterLevel}
          unlockedCosmetics={unlockedCosmetics} activeCosmetics={activeCosmetics}
          doubleCreditsActive={doubleCreditsNextRound} doubleJumpActive={doubleJumpNextRound}
          level={levelData.level} levelPoints={levelData.availablePoints} activeLevelBoosts={activeLevelBoosts}
          onBuyLife={cost => { sfx.playCoin(); setCoins(c => { const n=c-cost; persistCoins(n); return n; }); setExtraLivesBought(l => { const n=l+1; localStorage.setItem(userPrefix+'lives', n.toString()); return n; }); }}
          onBuyJump={cost => { sfx.playCoin(); setCoins(c => { const n=c-cost; persistCoins(n); return n; }); setJumpLevel(l => { const n=l+1; localStorage.setItem(userPrefix+'jump', n.toString()); return n; }); }}
          onBuyMeter={cost => { sfx.playCoin(); setCoins(c => { const n=c-cost; persistCoins(n); return n; }); setMeterLevel(l => { const n=l+1; localStorage.setItem(userPrefix+'meter', n.toString()); return n; }); }}
          onBuyCosmetic={handleBuyCosmetic}
          onEquipCosmetic={handleEquipCosmetic}
          onBuyBoost={(type, cost) => { sfx.playPowerup(); setCoins(c => { const n=c-cost; persistCoins(n); return n; }); if(type==='double_credits') setDoubleCreditsNextRound(true); if(type==='double_jump') setDoubleJumpNextRound(true); }}
          onSpendLevelPoints={(id, cost) => { sfx.playPowerup(); setSpentLevelPoints(p => { const n=p+cost; localStorage.setItem(userPrefix+'spent_pts', n.toString()); return n; }); setActiveLevelBoosts(p => [...p, id]); }}
          onClose={goHome}
        />
      )}

      <div className={`z-10 flex flex-col items-center w-full max-w-lg h-full justify-center transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        {gameState === GameState.START && !showDifficultySelect && !showLevelSelect && (
          <div className="text-center space-y-4 md:space-y-6 w-full animate-in fade-in zoom-in px-4">
            <div className="bg-black/40 border border-white/10 rounded-2xl p-3 flex flex-col space-y-2">
              <div className="flex justify-between items-end">
                <div className="text-left">
                  <div className="text-[9px] font-orbitron text-cyan-400 font-bold uppercase tracking-[0.2em]">{levelData.rank}</div>
                  <div className="text-lg font-orbitron text-white font-black italic">LEVEL {levelData.level}</div>
                </div>
                <div className="text-right text-[8px] font-orbitron text-gray-500 uppercase tracking-widest">
                  XP {Math.floor(totalAltitude).toLocaleString()} / {Math.floor(levelData.nextLevelXP).toLocaleString()}
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                <div className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000" style={{ width: `${levelData.progress}%` }}></div>
              </div>
            </div>

            <div className="flex justify-between items-center text-[8px] md:text-[10px] font-orbitron text-cyan-500/50 uppercase tracking-widest bg-black/40 p-2 rounded border border-cyan-500/20">
              <span className="flex items-center truncate max-w-[150px]"><i className="fas fa-user-astronaut mr-2"></i> {username}</span>
              <button onClick={handleLogout} className="hover:text-white transition-colors border-l border-cyan-500/20 pl-4 ml-4">Logout</button>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-orbitron font-bold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">NEON ASCENT</h1>
            
            <div className="grid grid-cols-2 gap-4 md:gap-5">
              <button onClick={() => { sfx.playClick(); setShowLevelSelect(true); }} className="py-5 md:py-6 bg-cyan-500 text-black font-orbitron font-bold uppercase hover:scale-105 transition-all rounded-xl shadow-[0_0_30px_rgba(0,255,255,0.3)] text-xs md:text-sm">Sector Ops</button>
              <div className="relative group">
                <button onClick={() => handleStart(GameMode.CLASSIC)} className="w-full py-5 md:py-6 bg-white/10 border-2 border-cyan-500/50 text-cyan-400 font-orbitron font-bold uppercase hover:scale-105 transition-all rounded-xl text-xs md:text-sm">Infinite</button>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black border border-cyan-500/30 px-2 py-0.5 rounded text-[8px] font-orbitron text-cyan-500 font-bold uppercase whitespace-nowrap">PB: {highScore}M</div>
              </div>
              <div className="relative group">
                <button onClick={() => { sfx.playClick(); setShowDifficultySelect(true); }} className="w-full py-5 md:py-6 bg-purple-600 text-white font-orbitron font-bold uppercase hover:scale-105 transition-all rounded-xl shadow-[0_0_30px_rgba(168,85,247,0.3)] text-xs md:text-sm">Rush Matrix</button>
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black border border-purple-500/30 px-2 py-0.5 rounded text-[8px] font-orbitron text-purple-400 font-bold uppercase whitespace-nowrap">Peak: {rushProgress}M</div>
              </div>
              <button onClick={() => { sfx.playClick(); setGameState(GameState.SHOP); }} className="py-4 md:py-5 border-2 border-magenta-500 text-magenta-500 font-orbitron font-bold uppercase hover:bg-magenta-500 hover:text-black transition-all rounded-xl text-xs">Market</button>
              
              <div className="col-span-2 grid grid-cols-2 gap-3">
                <button onClick={() => { sfx.playClick(); setGameState(GameState.LEADERBOARD); }} className="py-4 border-2 border-purple-500 text-purple-400 font-orbitron font-bold uppercase hover:bg-purple-500 hover:text-white transition-all rounded-xl text-[10px] tracking-widest"><i className="fas fa-list-ol mr-2"></i> Rankings</button>
                <button onClick={() => { sfx.playClick(); setGameState(GameState.ACHIEVEMENTS); }} className="py-4 border-2 border-yellow-500 text-yellow-400 font-orbitron font-bold uppercase hover:bg-yellow-500 hover:text-black transition-all rounded-xl text-[10px] tracking-widest"><i className="fas fa-medal mr-2"></i> Merits</button>
              </div>

              <button onClick={() => { sfx.playClick(); setGameState(GameState.EDITOR); }} className="col-span-2 py-4 border-2 border-blue-500 text-blue-500 font-orbitron font-bold uppercase hover:bg-blue-500 hover:text-white transition-all rounded-xl text-xs">Architect Tool</button>
            </div>
            
            <button onClick={openSecretTerminal} className="mt-8 text-[8px] text-white/5 uppercase tracking-[1em] hover:text-cyan-500/20 transition-all font-orbitron">Neural Override</button>
          </div>
        )}

        {gameState === GameState.START && showLevelSelect && (
          <div className="text-center space-y-6 bg-black/90 p-8 md:p-10 border-2 border-cyan-500 rounded-3xl animate-in zoom-in w-full shadow-[0_0_50px_rgba(0,255,255,0.2)] mx-4 flex flex-col max-h-[70vh]">
            <h2 className="text-2xl md:text-3xl font-orbitron text-cyan-400 italic font-bold tracking-tighter">SECTOR OPERATIONS</h2>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {LEVEL_TARGETS.map((target, idx) => {
                const isLocked = (idx + 1) > unlockedLevel;
                return (
                  <button key={idx} disabled={isLocked} onClick={() => handleStart(GameMode.LEVELS, 200, undefined, idx)} className={`w-full text-left p-4 rounded-xl text-xs font-orbitron flex justify-between items-center transition-all group ${isLocked ? 'bg-white/5 border border-white/5 opacity-40 cursor-not-allowed' : 'bg-white/5 hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/50 text-white'}`}>
                    <span className={isLocked ? '' : 'group-hover:text-cyan-400'}>Sector {idx + 1} - {target}M</span>
                    {isLocked ? <i className="fas fa-lock text-[10px]"></i> : <i className="fas fa-play text-[10px]"></i>}
                  </button>
                );
              })}
            </div>
            <button onClick={() => { sfx.playClick(); setShowLevelSelect(false); }} className="py-4 text-[10px] font-orbitron text-gray-500 hover:text-white uppercase tracking-[0.3em] border-t border-white/10">Return to Grid</button>
          </div>
        )}

        {gameState === GameState.START && showDifficultySelect && (
          <div className="text-center space-y-6 bg-black/90 p-8 md:p-10 border-2 border-purple-500 rounded-3xl animate-in zoom-in w-full shadow-[0_0_50px_rgba(168,85,247,0.2)] mx-4 flex flex-col">
            <h2 className="text-2xl md:text-3xl font-orbitron text-purple-400 italic font-bold tracking-tighter uppercase">Rush Matrix Configuration</h2>
            <p className="text-[10px] text-gray-500 font-orbitron uppercase tracking-widest leading-relaxed">Choose your checkpoint density. Closer checkpoints are safer but harder to master.</p>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Density: HIGH', val: 100, desc: 'Every 100M - Tactical Safety' },
                { label: 'Density: MED', val: 250, desc: 'Every 250M - Standard Matrix' },
                { label: 'Density: LOW', val: 500, desc: 'Every 500M - Hardcore Flux' },
                { label: 'Density: NULL', val: 1000, desc: 'Every 1000M - Vanguard Only' },
              ].map((diff) => (
                <button key={diff.val} onClick={() => handleStart(GameMode.RUSH, diff.val)} className="w-full text-left p-5 bg-white/5 hover:bg-purple-500/10 border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all group">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-xs font-orbitron font-bold text-white group-hover:text-purple-400 transition-colors uppercase tracking-widest">{diff.label}</div>
                    <i className="fas fa-microchip text-[10px] text-purple-500"></i>
                  </div>
                  <div className="text-[8px] text-gray-500 uppercase font-orbitron">{diff.desc}</div>
                </button>
              ))}
            </div>
            <button onClick={() => { sfx.playClick(); setShowDifficultySelect(false); }} className="py-4 text-[10px] font-orbitron text-gray-500 hover:text-white uppercase tracking-[0.3em] border-t border-white/10 mt-4">Abort Config</button>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <div className="h-full w-full flex items-center justify-center p-2 animate-in fade-in duration-700">
            <GameCanvas 
              gameState={gameState} lives={lives} highScore={highScore} rushProgress={rushProgress} mode={gameMode}
              checkpointInterval={selectedCheckpointInterval} 
              levelTarget={gameMode === GameMode.LEVELS ? LEVEL_TARGETS[selectedLevelIdx] : undefined}
              customLevel={activeCustomLevel}
              jumpMultiplier={1 + (jumpLevel * 0.1)} meterMultiplier={1 + (meterLevel * 0.2)}
              gravityMultiplier={boostsThisRound.includes('gravity_null') ? 0.85 : 1.0}
              playerColor={equippedSkinValue} 
              doubleCredits={isBuffActiveThisRound} doubleJumpActive={isDoubleJumpActiveThisRound}
              sessionSeed={sessionSeed}
              onGameOver={handleGameOver} onLevelComplete={handleLevelComplete} onCheckpointReached={handleCheckpointReached}
              onLifeLost={() => setLives(prev => Math.max(0, prev - 1))}
              onCoinEarned={() => {
                setCoins(prev => { const n = prev + 1; localStorage.setItem(userPrefix+'cr', n.toString()); return n; });
                setUserStats(prev => {
                  const next = { ...prev, coinsEarned: prev.coinsEarned + 1 };
                  localStorage.setItem(userPrefix + 'stats', JSON.stringify(next));
                  checkAchievements(next);
                  return next;
                });
              }}
              onAbort={goHome}
              activeCosmetics={activeCosmetics}
            />
          </div>
        )}

        {gameState === GameState.GAMEOVER && (
          <div className="text-center space-y-6 md:space-y-8 bg-black/90 border-2 border-red-500 p-8 md:p-12 rounded-3xl animate-in zoom-in w-full shadow-[0_0_80px_rgba(239,68,68,0.4)] mx-4">
            <h2 className="text-4xl md:text-6xl font-orbitron text-red-500 italic uppercase font-bold tracking-tighter">{gameMode === GameMode.LEVELS && currentScore >= (LEVEL_TARGETS[selectedLevelIdx] || 0) ? 'Sector Beat' : 'System Crash'}</h2>
            <div className="text-6xl md:text-8xl font-orbitron text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{currentScore}M</div>
            <div className="flex space-x-3 md:space-x-4">
              <button onClick={() => { sfx.playClick(); handleStart(gameMode, selectedCheckpointInterval, activeCustomLevel || undefined, selectedLevelIdx, true); }} className="flex-1 py-5 md:py-6 bg-red-600/20 border-2 border-red-500 text-red-500 font-orbitron text-lg font-bold uppercase hover:bg-red-500 hover:text-white transition-all rounded-xl">REBOOT</button>
              <button onClick={() => { sfx.playClick(); goHome(); }} className="flex-1 py-5 md:py-6 bg-gray-600/20 border-2 border-gray-500 text-gray-400 font-orbitron text-lg font-bold uppercase hover:bg-gray-500 hover:text-white transition-all rounded-xl">HOME</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
