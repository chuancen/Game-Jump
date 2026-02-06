
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import GameCanvas from './components/GameCanvas.tsx';
import Shop from './components/Shop.tsx';
import Announcer from './components/Announcer.tsx';
import LevelEditor from './components/LevelEditor.tsx';
import { getAnnouncerCommentary } from './services/geminiService.ts';
import { GameState, GameMode, AnnouncerMessage, CustomLevel } from './types.ts';
import { SKINS } from './constants.ts';
import { sfx } from './services/audioService.ts';

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
  const [announcerMessage, setAnnouncerMessage] = useState<AnnouncerMessage | null>(null);
  
  const [customLevels, setCustomLevels] = useState<CustomLevel[]>([]);
  const [activeCustomLevel, setActiveCustomLevel] = useState<CustomLevel | null>(null);

  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [selectedCheckpointInterval, setSelectedCheckpointInterval] = useState(200);

  const [extraLivesBought, setExtraLivesBought] = useState(0);
  const [jumpLevel, setJumpLevel] = useState(0);
  const [meterLevel, setMeterLevel] = useState(0);
  const [unlockedSkins, setUnlockedSkins] = useState<string[]>(['default']);
  const [activeSkinId, setActiveSkinId] = useState<string>('default');
  const [totalAltitude, setTotalAltitude] = useState(0);
  const [spentLevelPoints, setSpentLevelPoints] = useState(0);
  
  const [doubleCreditsNextRound, setDoubleCreditsNextRound] = useState(false);
  const [isBuffActiveThisRound, setIsBuffActiveThisRound] = useState(false);
  const [activeLevelBoosts, setActiveLevelBoosts] = useState<string[]>([]);
  const [boostsThisRound, setBoostsThisRound] = useState<string[]>([]);

  const userPrefix = username ? `neon_${username}_` : 'neon_';

  useEffect(() => {
    if (!username) return;
    setHighScore(parseInt(localStorage.getItem(userPrefix + 'hs') || '0'));
    setRushProgress(parseInt(localStorage.getItem(userPrefix + 'rush_progress') || '0'));
    setCoins(parseInt(localStorage.getItem(userPrefix + 'cr') || '0'));
    setExtraLivesBought(parseInt(localStorage.getItem(userPrefix + 'lives') || '0'));
    setJumpLevel(parseInt(localStorage.getItem(userPrefix + 'jump') || '0'));
    setMeterLevel(parseInt(localStorage.getItem(userPrefix + 'meter') || '0'));
    setTotalAltitude(parseInt(localStorage.getItem(userPrefix + 'total_alt') || '0'));
    setSpentLevelPoints(parseInt(localStorage.getItem(userPrefix + 'spent_pts') || '0'));
    
    const savedSkins = localStorage.getItem(userPrefix + 'unlocked_skins');
    if (savedSkins) setUnlockedSkins(JSON.parse(savedSkins));
    
    const savedActive = localStorage.getItem(userPrefix + 'active_skin');
    if (savedActive) setActiveSkinId(savedActive);

    const savedLevels = localStorage.getItem(userPrefix + 'custom_levels');
    if (savedLevels) setCustomLevels(JSON.parse(savedLevels));
  }, [username, userPrefix]);

  const levelData = useMemo(() => {
    const level = Math.floor(Math.sqrt(totalAltitude / 500)) + 1;
    const currentLevelXP = Math.pow(level - 1, 2) * 500;
    const nextLevelXP = Math.pow(level, 2) * 500;
    const progress = Math.min(100, Math.max(0, ((totalAltitude - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100));
    const availablePoints = Math.max(0, (level - 1) - spentLevelPoints);
    
    let rank = 'NOVICE';
    if (level >= 5) rank = 'OPERATIVE';
    if (level >= 15) rank = 'VANGUARD';
    if (level >= 30) rank = 'ELITE';
    if (level >= 50) rank = 'SPECTRE';
    return { level, progress, rank, nextLevelXP, availablePoints };
  }, [totalAltitude, spentLevelPoints]);

  const triggerAnnouncer = useCallback(async (score: number, reason: 'death' | 'milestone' | 'start' | 'level_up') => {
    const msg = await getAnnouncerCommentary(score, reason);
    setAnnouncerMessage(msg);
  }, []);

  const handleStart = (mode: GameMode = GameMode.CLASSIC, interval: number = 200, level?: CustomLevel) => {
    sfx.playClick();
    setGameMode(mode);
    setSelectedCheckpointInterval(interval);
    setActiveCustomLevel(level || null);
    
    let startingLives = mode === GameMode.RUSH ? Infinity : (1 + extraLivesBought);
    if (activeLevelBoosts.includes('overdrive') && mode === GameMode.CLASSIC) startingLives += 3;
    
    setLives(startingLives);
    setIsBuffActiveThisRound(doubleCreditsNextRound);
    setBoostsThisRound([...activeLevelBoosts]);
    setDoubleCreditsNextRound(false); 
    setActiveLevelBoosts([]); 
    setGameState(GameState.PLAYING);
    setShowDifficultySelect(false);
    triggerAnnouncer(0, 'start');
  };

  const handleCheckpointReached = useCallback((altitude: number) => {
    // Persistent checkpoint for Rush mode
    if (gameMode === GameMode.RUSH) {
      setRushProgress(altitude);
      localStorage.setItem(userPrefix + 'rush_progress', altitude.toString());
    }
  }, [gameMode, userPrefix]);

  const handleGameOver = useCallback((score: number) => {
    setCurrentScore(score);
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
    setGameState(GameState.GAMEOVER);
    triggerAnnouncer(score, 'death');
  }, [highScore, rushProgress, totalAltitude, triggerAnnouncer, boostsThisRound, gameMode, userPrefix]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginInput.trim()) {
      sfx.playClick();
      localStorage.setItem('neon_user', loginInput.trim());
      setUsername(loginInput.trim());
    }
  };

  const handleSaveLevel = (level: CustomLevel) => {
    sfx.playPowerup();
    const updated = [...customLevels, level];
    setCustomLevels(updated);
    localStorage.setItem(userPrefix + 'custom_levels', JSON.stringify(updated));
    setGameState(GameState.START);
  };

  const handleLogout = () => {
    sfx.playClick();
    localStorage.removeItem('neon_user');
    setUsername('');
    setLoginInput('');
  };

  const goHome = () => {
    sfx.playClick();
    setGameState(GameState.START);
    setShowDifficultySelect(false);
  };

  if (!username) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="bg-black/60 border-2 border-cyan-500 p-10 rounded-3xl shadow-[0_0_60px_rgba(0,255,255,0.3)] max-w-md w-full text-center space-y-8 animate-in zoom-in">
          <h1 className="text-6xl font-orbitron font-bold text-cyan-400 italic">ASCENT</h1>
          <p className="text-gray-400 font-orbitron text-xs tracking-[0.3em] uppercase">Initialize Neural Link</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              autoFocus
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="CODENAME"
              className="w-full bg-black border-2 border-cyan-500/30 p-4 font-orbitron text-cyan-400 text-center outline-none focus:border-cyan-500 transition-all rounded-xl"
            />
            <button 
              type="submit"
              className="w-full bg-cyan-500 text-black py-4 font-orbitron font-bold uppercase tracking-widest hover:bg-white transition-all rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.4)]"
            >
              Connect
            </button>
          </form>
        </div>
      </div>
    );
  }

  const currentSkinColor = SKINS.find(s => s.id === activeSkinId)?.color || '#00ffaa';

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <Announcer message={announcerMessage} />

      {gameState === GameState.EDITOR && (
        <LevelEditor onSave={handleSaveLevel} onClose={goHome} />
      )}

      {gameState === GameState.SHOP && (
        <Shop 
          coins={coins} extraLives={extraLivesBought} jumpLevel={jumpLevel} meterLevel={meterLevel}
          unlockedSkins={unlockedSkins} activeSkinId={activeSkinId} doubleCreditsActive={doubleCreditsNextRound}
          level={levelData.level} levelPoints={levelData.availablePoints} activeLevelBoosts={activeLevelBoosts}
          onBuyLife={cost => { sfx.playCoin(); setCoins(c => c-cost); setExtraLivesBought(l => { const n=l+1; localStorage.setItem(userPrefix+'lives', n.toString()); return n; }); }}
          onBuyJump={cost => { sfx.playCoin(); setCoins(c => c-cost); setJumpLevel(l => { const n=l+1; localStorage.setItem(userPrefix+'jump', n.toString()); return n; }); }}
          onBuyMeter={cost => { sfx.playCoin(); setCoins(c => c-cost); setMeterLevel(l => { const n=l+1; localStorage.setItem(userPrefix+'meter', n.toString()); return n; }); }}
          onBuySkin={(id, cost) => { sfx.playPowerup(); setCoins(c => c-cost); setUnlockedSkins(s => { const n=[...s, id]; localStorage.setItem(userPrefix+'unlocked_skins', JSON.stringify(n)); return n; }); }}
          onEquipSkin={id => { sfx.playClick(); setActiveSkinId(id); localStorage.setItem(userPrefix+'active_skin', id); }}
          onBuyBoost={(type, cost) => { sfx.playPowerup(); setCoins(c => c-cost); if(type==='double_credits') setDoubleCreditsNextRound(true); }}
          onSpendLevelPoints={(id, cost) => { sfx.playPowerup(); setSpentLevelPoints(p => { const n=p+cost; localStorage.setItem(userPrefix+'spent_pts', n.toString()); return n; }); setActiveLevelBoosts(p => [...p, id]); }}
          onClose={goHome}
        />
      )}

      <div className="z-10 flex flex-col items-center w-full max-w-lg">
        {gameState === GameState.START && !showDifficultySelect && (
          <div className="text-center space-y-6 w-full animate-in fade-in zoom-in">
            <div className="flex justify-between items-center text-[10px] font-orbitron text-cyan-500/50 uppercase tracking-widest bg-black/40 p-2 rounded border border-cyan-500/20">
              <span className="flex items-center"><i className="fas fa-user-astronaut mr-2"></i> {username}</span>
              <button onClick={handleLogout} className="hover:text-white transition-colors border-l border-cyan-500/20 pl-4 ml-4">Terminate Link</button>
            </div>

            <h1 className="text-6xl md:text-7xl font-orbitron font-bold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-600 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">NEON ASCENT</h1>

            {/* Highscore Box */}
            <div className="bg-black/80 border-2 border-cyan-500/30 p-4 rounded-2xl shadow-[inset_0_0_20px_rgba(0,255,255,0.1)] flex flex-col items-center space-y-3">
               <div className="text-[9px] font-orbitron text-cyan-500/60 uppercase tracking-[0.4em] font-bold">Record Archive</div>
               <div className="flex w-full justify-around divide-x divide-white/5">
                  <div className="px-4 text-center">
                    <div className="text-[8px] text-gray-500 uppercase font-orbitron tracking-widest mb-1">Classic High</div>
                    <div className="text-2xl font-orbitron text-cyan-400 font-bold">{highScore.toLocaleString()}<span className="text-xs ml-1 opacity-50">M</span></div>
                  </div>
                  <div className="px-4 text-center">
                    <div className="text-[8px] text-gray-500 uppercase font-orbitron tracking-widest mb-1">Rush Peak</div>
                    <div className="text-2xl font-orbitron text-purple-400 font-bold">{rushProgress.toLocaleString()}<span className="text-xs ml-1 opacity-50">M</span></div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleStart(GameMode.CLASSIC)} className="py-5 bg-cyan-500 text-black font-orbitron font-bold uppercase hover:scale-105 transition-all rounded-xl shadow-[0_0_20px_rgba(0,255,255,0.3)] text-sm">Classic</button>
              <button onClick={() => { sfx.playClick(); setShowDifficultySelect(true); }} className="py-5 bg-purple-600 text-white font-orbitron font-bold uppercase hover:scale-105 transition-all rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.3)] text-sm">Rush</button>
              <button onClick={() => { sfx.playClick(); setGameState(GameState.EDITOR); }} className="py-5 border-2 border-yellow-500 text-yellow-500 font-orbitron font-bold uppercase hover:bg-yellow-500 hover:text-black transition-all rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.2)] text-sm">Architect</button>
              <button onClick={() => { sfx.playClick(); setGameState(GameState.SHOP); }} className="py-5 border-2 border-magenta-500 text-magenta-500 font-orbitron font-bold uppercase hover:bg-magenta-500 hover:text-black transition-all rounded-xl shadow-[0_0_20px_rgba(255,0,255,0.2)] text-sm">Market</button>
            </div>

            {customLevels.length > 0 && (
              <div className="bg-black/60 border border-white/10 p-5 rounded-2xl max-h-40 overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] text-gray-500 uppercase mb-3 tracking-widest text-left font-bold">Custom Uplinks</h3>
                <div className="space-y-2">
                  {customLevels.map(lvl => (
                    <button 
                      key={lvl.id} 
                      onClick={() => handleStart(GameMode.CUSTOM, 200, lvl)}
                      className="w-full text-left p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-xs text-cyan-400 font-orbitron flex justify-between items-center transition-all group"
                    >
                      <span>{lvl.name}</span>
                      <i className="fas fa-play text-[8px] opacity-0 group-hover:opacity-100 transition-all"></i>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {gameState === GameState.START && showDifficultySelect && (
          <div className="text-center space-y-6 bg-black/90 p-10 border-2 border-purple-500 rounded-3xl animate-in zoom-in w-full shadow-[0_0_50px_rgba(168,85,247,0.4)]">
            <h2 className="text-4xl font-orbitron text-purple-400 italic font-bold">RUSH MATRIX</h2>
            <div className="flex flex-col space-y-3">
              {[200, 500, 1000, 2500].map(int => (
                <button 
                  key={int} 
                  onClick={() => handleStart(GameMode.RUSH, int)} 
                  className="py-5 border-2 border-white/10 hover:border-purple-500 font-orbitron text-white hover:bg-purple-500/20 transition-all rounded-xl uppercase tracking-widest text-sm"
                >
                  {int}M Checkpoints
                </button>
              ))}
            </div>
            <button onClick={() => { sfx.playClick(); setShowDifficultySelect(false); }} className="text-xs font-orbitron text-gray-500 hover:text-white mt-4 uppercase tracking-[0.3em]">Abort Matrix</button>
          </div>
        )}

        {gameState === GameState.PLAYING && (
          <GameCanvas 
            gameState={gameState} lives={lives} highScore={highScore} rushProgress={rushProgress} mode={gameMode}
            checkpointInterval={selectedCheckpointInterval} customLevel={activeCustomLevel}
            jumpMultiplier={1 + (jumpLevel * 0.1)} meterMultiplier={1 + (meterLevel * 0.2)}
            gravityMultiplier={boostsThisRound.includes('gravity_null') ? 0.85 : 1.0}
            playerColor={currentSkinColor} doubleCredits={isBuffActiveThisRound}
            onGameOver={handleGameOver} onMilestone={s => triggerAnnouncer(s, 'milestone')}
            onCheckpointReached={handleCheckpointReached}
            onLifeLost={() => setLives(prev => Math.max(0, prev - 1))}
            onCoinEarned={() => setCoins(prev => { const n = prev + 1; localStorage.setItem(userPrefix+'cr', n.toString()); return n; })}
            onAbort={goHome}
          />
        )}

        {gameState === GameState.GAMEOVER && (
          <div className="text-center space-y-8 bg-black/90 border-2 border-red-500 p-12 rounded-3xl animate-in zoom-in w-full shadow-[0_0_80px_rgba(239,68,68,0.4)]">
            <h2 className="text-6xl font-orbitron text-red-500 italic uppercase font-bold tracking-tighter">System Crash</h2>
            <div className="text-8xl font-orbitron text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">{currentScore}M</div>
            <div className="flex space-x-4">
              <button 
                onClick={() => { sfx.playClick(); handleStart(gameMode, selectedCheckpointInterval, activeCustomLevel || undefined); }} 
                className="flex-1 py-6 bg-red-600/20 border-2 border-red-500 text-red-500 font-orbitron text-xl font-bold uppercase hover:bg-red-500 hover:text-white transition-all rounded-xl"
              >
                Reboot
              </button>
              <button 
                onClick={() => { sfx.playClick(); goHome(); }} 
                className="flex-1 py-6 bg-gray-600/20 border-2 border-gray-500 text-gray-400 font-orbitron text-xl font-bold uppercase hover:bg-gray-500 hover:text-white transition-all rounded-xl"
              >
                HOME
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
