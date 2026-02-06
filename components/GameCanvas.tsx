
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  GameState, 
  GameMode,
  Platform, 
  Player,
  PlatformType,
  Bullet,
  Turret,
  CustomLevel
} from '../types.ts';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  GRAVITY, 
  BASE_JUMP_FORCE, 
  SPRING_FORCE, 
  PLAYER_ACCEL, 
  PLAYER_FRICTION, 
  MAX_PLAYER_SPEED, 
  PLATFORM_WIDTH, 
  PLATFORM_HEIGHT, 
  MAX_PLATFORMS, 
  VERTICAL_GAP, 
  COLORS 
} from '../constants.ts';
import { sfx } from '../services/audioService.ts';
import Legend from './Legend.tsx';

interface GameCanvasProps {
  gameState: GameState;
  lives: number;
  highScore: number;
  rushProgress: number;
  mode: GameMode;
  checkpointInterval: number;
  customLevel?: CustomLevel | null;
  jumpMultiplier: number;
  meterMultiplier: number;
  gravityMultiplier: number;
  playerColor: string;
  doubleCredits: boolean;
  onGameOver: (score: number) => void;
  onMilestone: (score: number) => void;
  onCheckpointReached: (altitude: number) => void;
  onLifeLost: () => void;
  onCoinEarned: () => void;
  onAbort: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  color: string;
  life: number;
  vx: number;
  vy: number;
  angle: number;
  va: number; // angular velocity
  isVoxel?: boolean;
}

export const getPlatformColor = (type: PlatformType): string => {
  switch (type) {
    case 'normal': return COLORS.CYAN;
    case 'moving': return COLORS.MAGENTA;
    case 'breakable': return '#555555';
    case 'spring': return COLORS.YELLOW;
    case 'teleport': return COLORS.PURPLE;
    case 'speed': return COLORS.GREEN;
    case 'immunity': return COLORS.WHITE;
    case 'kill': return COLORS.RED;
    default: return COLORS.CYAN;
  }
};

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  lives, 
  highScore,
  rushProgress,
  mode,
  checkpointInterval,
  customLevel,
  jumpMultiplier, 
  meterMultiplier,
  gravityMultiplier,
  playerColor,
  doubleCredits,
  onGameOver, 
  onMilestone,
  onCheckpointReached,
  onLifeLost,
  onCoinEarned,
  onAbort
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [showLegend, setShowLegend] = useState(false);
  const [isDying, setIsDying] = useState(false);
  const shakeRef = useRef(0);
  
  // Ref to track checkpoint internally to prevent prop-driven resets
  const internalCheckpointRef = useRef(rushProgress);
  const lastCoinRef = useRef(0);
  const lastRushCoinRef = useRef(0);
  const lastMilestoneRef = useRef(0);
  const lastCheckpointAltitude = useRef(0);
  const [showCheckpointMsg, setShowCheckpointMsg] = useState(false);
  
  const playerRef = useRef<Player & { isGrounded: boolean, killTimer: number, standingOnKillPad: boolean }>({
    x: CANVAS_WIDTH / 2 - 12.5,
    y: CANVAS_HEIGHT - 100,
    vx: 0,
    vy: 0,
    width: 25,
    height: 25,
    color: playerColor,
    hasImmunity: false,
    immunityTimer: 0,
    hasSpeedBoost: false,
    speedTimer: 0,
    isGrounded: false,
    killTimer: 0,
    standingOnKillPad: false
  });

  const platformsRef = useRef<Platform[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const turretsRef = useRef<Turret[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});

  const generatePlatform = useCallback((y: number, lastX: number): Platform => {
    const r = Math.random();
    let type: PlatformType = 'normal';
    
    if (r > 0.94) type = 'kill';
    else if (r > 0.90) type = 'teleport';
    else if (r > 0.86) type = 'speed';
    else if (r > 0.82) type = 'immunity';
    else if (r > 0.70) type = 'moving';
    else if (r > 0.60) type = 'spring';
    else if (r > 0.50 && y < -2000) type = 'breakable';

    let dx = 0;
    if (type === 'moving') dx = (Math.random() > 0.5 ? 1.5 : -1.5);

    let x = lastX + (Math.random() - 0.5) * 260;
    x = Math.max(0, Math.min(CANVAS_WIDTH - PLATFORM_WIDTH, x));

    if (Math.random() < 0.12) {
      turretsRef.current.push({
        y: y - 20,
        side: Math.random() > 0.5 ? 'left' : 'right',
        fireCooldown: Math.random() * 100,
        fired: false
      });
    }

    return { x, y, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, type, dx, broken: false };
  }, []);

  const initGame = useCallback((isRespawn: boolean = false) => {
    // Determine starting altitude based on current checkpoint
    // If it's a respawn, we use our internal tracking of the hit checkpoint
    const startAltitude = mode === GameMode.RUSH ? internalCheckpointRef.current : 0;
    
    setScore(startAltitude);
    setIsDying(false);
    shakeRef.current = 0;
    lastCoinRef.current = startAltitude;
    lastRushCoinRef.current = startAltitude;
    lastMilestoneRef.current = startAltitude;
    lastCheckpointAltitude.current = startAltitude;
    
    bulletsRef.current = [];
    turretsRef.current = [];
    particlesRef.current = [];
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - 12.5,
      y: CANVAS_HEIGHT - 100,
      vx: 0,
      vy: 0,
      width: 25,
      height: 25,
      color: playerColor,
      hasImmunity: false,
      immunityTimer: 0,
      hasSpeedBoost: false,
      speedTimer: 0,
      isGrounded: false,
      killTimer: 0,
      standingOnKillPad: false
    };

    if (mode === GameMode.CUSTOM && customLevel) {
      const editorHeight = 3000; 
      const yOffset = CANVAS_HEIGHT - editorHeight;
      platformsRef.current = customLevel.platforms.map(p => ({ ...p, y: p.y + yOffset, broken: false }));
      turretsRef.current = customLevel.turrets.map(t => ({ ...t, y: t.y + yOffset }));
    } else {
      const platforms: Platform[] = [];
      const startP: Platform = { x: CANVAS_WIDTH/2 - PLATFORM_WIDTH/2, y: CANVAS_HEIGHT - 50, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, type: 'normal', dx: 0 };
      platforms.push(startP);

      let lastY = CANVAS_HEIGHT - 50;
      let lastX = startP.x;
      for (let i = 1; i < MAX_PLATFORMS; i++) {
        lastY -= VERTICAL_GAP;
        const nextP = generatePlatform(lastY, lastX);
        platforms.push(nextP);
        lastX = nextP.x;
      }
      platformsRef.current = platforms;
    }
  }, [generatePlatform, playerColor, mode, customLevel]);

  // Handle initial mount or mode changes ONLY when not playing
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      // Sync internal ref with prop only at game start
      internalCheckpointRef.current = rushProgress;
      initGame();
    }
  }, [gameState]); // Only depend on gameState to prevent prop-driven mid-game resets

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => (keysRef.current[e.code] = e.type === 'keydown');
    window.addEventListener('keydown', handleKeys);
    window.addEventListener('keyup', handleKeys);
    return () => {
      window.removeEventListener('keydown', handleKeys);
      window.removeEventListener('keyup', handleKeys);
    };
  }, []);

  const triggerDeath = useCallback(() => {
    if (isDying) return;
    setIsDying(true);
    shakeRef.current = 20;
    sfx.playDeath();

    const player = playerRef.current;
    const voxelSize = 5;
    for (let i = 0; i < player.width; i += voxelSize) {
      for (let j = 0; j < player.height; j += voxelSize) {
        particlesRef.current.push({
          x: player.x + i,
          y: player.y + j,
          size: voxelSize,
          color: playerColor,
          life: 1.0,
          vx: (Math.random() - 0.5) * 12,
          vy: (Math.random() - 0.5) * 12 - 5,
          angle: Math.random() * Math.PI * 2,
          va: (Math.random() - 0.5) * 0.4,
          isVoxel: true
        });
      }
    }

    setTimeout(() => {
      if (mode === GameMode.RUSH) {
        // Respawn logic
        initGame(true);
      } else if (lives > 1) {
        onLifeLost();
        initGame(true);
      } else {
        onGameOver(Math.floor(score));
      }
    }, 1500);
  }, [isDying, playerColor, mode, lives, onLifeLost, onGameOver, score, initGame]);

  const handleManualJump = useCallback(() => {
    if (isDying) return;
    const player = playerRef.current;
    if (player.isGrounded && gameState === GameState.PLAYING) {
      player.vy = BASE_JUMP_FORCE * jumpMultiplier;
      player.isGrounded = false;
      player.killTimer = 0;
      player.standingOnKillPad = false;
      sfx.playJump();
    }
  }, [jumpMultiplier, gameState, isDying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const update = () => {
      if (gameState !== GameState.PLAYING) return;
      const player = playerRef.current;
      const platforms = platformsRef.current;
      const bullets = bulletsRef.current;
      const turrets = turretsRef.current;
      const particles = particlesRef.current;

      if (shakeRef.current > 0) shakeRef.current *= 0.9;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.angle += p.va;
        if (p.isVoxel) {
          p.vy += 0.25;
          p.vx *= 0.99;
          p.life -= 0.012;
        } else {
          p.life -= 0.04;
        }
        if (p.life <= 0) particles.splice(i, 1);
      }

      if (isDying) return;

      if (player.immunityTimer > 0) player.immunityTimer--;
      else player.hasImmunity = false;
      
      if (player.speedTimer > 0) player.speedTimer--;
      else player.hasSpeedBoost = false;

      const accel = player.hasSpeedBoost ? PLAYER_ACCEL * 2.0 : PLAYER_ACCEL;
      const maxSpd = player.hasSpeedBoost ? MAX_PLAYER_SPEED * 2.2 : MAX_PLAYER_SPEED;

      if (keysRef.current['ArrowLeft'] || keysRef.current['KeyA']) player.vx -= accel;
      else if (keysRef.current['ArrowRight'] || keysRef.current['KeyD']) player.vx += accel;
      else player.vx *= PLAYER_FRICTION;

      if (keysRef.current['Space'] || keysRef.current['ArrowUp'] || keysRef.current['KeyW']) {
        handleManualJump();
      }

      player.vx = Math.max(-maxSpd, Math.min(maxSpd, player.vx));
      player.x += player.vx;

      if (!player.isGrounded) {
        player.vy += (GRAVITY * gravityMultiplier);
      } else {
        player.vy = 0;
      }
      player.y += player.vy;

      if (player.x + player.width < 0) player.x = CANVAS_WIDTH;
      if (player.x > CANVAS_WIDTH) player.x = -player.width;

      let foundGrounded = false;
      let touchingKillPad = false;

      if (player.vy >= 0) {
        platforms.forEach((p) => {
          if (!p.broken && player.x + player.width > p.x && player.x < p.x + p.width &&
              player.y + player.height >= p.y && player.y + player.height <= p.y + p.height + Math.max(player.vy, 8)) {
            
            if (p.type === 'spring') {
              player.vy = SPRING_FORCE;
              player.isGrounded = false;
              shakeRef.current = 5;
              sfx.playSpring();
              return;
            }
            if (p.type === 'teleport') {
              player.y -= 450; 
              player.vy = BASE_JUMP_FORCE * jumpMultiplier;
              player.isGrounded = false;
              sfx.playTeleport();
              return;
            }

            player.y = p.y - player.height;
            player.isGrounded = true;
            foundGrounded = true;

            if (p.type === 'moving') player.x += p.dx;
            if (p.type === 'breakable') p.broken = true;
            if (p.type === 'kill' && !player.hasImmunity) touchingKillPad = true;
            if (p.type === 'speed') { player.hasSpeedBoost = true; player.speedTimer = 240; sfx.playPowerup(); }
            if (p.type === 'immunity') { player.hasImmunity = true; player.immunityTimer = 480; sfx.playPowerup(); }
          }
        });
      }

      for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.x += b.vx;
        const distX = b.x - (player.x + player.width / 2);
        const distY = b.y - (player.y + player.height / 2);
        const distance = Math.sqrt(distX * distX + distY * distY);
        if (distance < b.radius + player.width / 2 && !player.hasImmunity) {
          triggerDeath();
          bullets.splice(i, 1);
          continue;
        }
        if (b.x < -50 || b.x > CANVAS_WIDTH + 50) bullets.splice(i, 1);
      }

      for (let i = turrets.length - 1; i >= 0; i--) {
        const t = turrets[i];
        if (t.fireCooldown > 0) t.fireCooldown--;
        else {
          bullets.push({
            x: t.side === 'left' ? 10 : CANVAS_WIDTH - 10,
            y: t.y + 10,
            vx: t.side === 'left' ? 4.5 : -4.5,
            radius: 6
          });
          t.fireCooldown = 110;
        }
      }

      if (touchingKillPad && player.isGrounded) {
        player.killTimer++;
        if (player.killTimer > 50) triggerDeath();
      } else player.killTimer = 0;

      if (!foundGrounded) player.isGrounded = false;

      if (player.y < CANVAS_HEIGHT * 0.45) {
        const offset = CANVAS_HEIGHT * 0.45 - player.y;
        player.y = CANVAS_HEIGHT * 0.45;
        const gainedScore = (offset / 5) * meterMultiplier;
        
        setScore(prev => {
          const next = prev + gainedScore;
          if (next >= lastMilestoneRef.current + 2500) {
            lastMilestoneRef.current = Math.floor(next / 2500) * 2500;
            onMilestone(lastMilestoneRef.current);
          }
          if (mode === GameMode.CLASSIC) {
             if (next >= lastCoinRef.current + 200) {
               lastCoinRef.current = Math.floor(next / 200) * 200;
               onCoinEarned();
               sfx.playCoin();
             }
          } else if (mode === GameMode.RUSH) {
             if (next >= lastRushCoinRef.current + 1000) {
               lastRushCoinRef.current = Math.floor(next / 1000) * 1000;
               onCoinEarned();
               sfx.playCoin();
             }
             // Checkpoint Logic
             if (Math.floor(next / checkpointInterval) > Math.floor(lastCheckpointAltitude.current / checkpointInterval)) {
               const newCheckpoint = Math.floor(next / checkpointInterval) * checkpointInterval;
               lastCheckpointAltitude.current = newCheckpoint;
               // Important: update our internal ref so respawns happen here
               internalCheckpointRef.current = newCheckpoint;
               setShowCheckpointMsg(true);
               setTimeout(() => setShowCheckpointMsg(false), 2000);
               sfx.playPowerup();
               onCheckpointReached(newCheckpoint);
             }
          }
          return next;
        });

        platforms.forEach(p => {
          p.y += offset;
          if (p.y > CANVAS_HEIGHT && mode !== GameMode.CUSTOM) {
            const idx = platforms.indexOf(p);
            let minY = CANVAS_HEIGHT;
            let anchorX = CANVAS_WIDTH / 2;
            platforms.forEach(other => {
              if (other.y < minY) {
                minY = other.y;
                anchorX = other.x;
              }
            });
            platforms[idx] = generatePlatform(minY - VERTICAL_GAP, anchorX);
          }
        });

        bullets.forEach(b => b.y += offset);
        particles.forEach(p => p.y += offset);
        turrets.forEach(t => t.y += offset);
      }

      if (player.y > CANVAS_HEIGHT + 80) triggerDeath();

      platforms.forEach(p => {
        if (p.type === 'moving') {
          p.x += p.dx;
          if (p.x < 0 || p.x + p.width > CANVAS_WIDTH) p.dx *= -1;
        }
      });
    };

    const draw = () => {
      ctx.save();
      if (shakeRef.current > 0.1) {
        ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
      }

      ctx.fillStyle = COLORS.BG;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      for(let x=0; x<CANVAS_WIDTH; x+=40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
      for(let y=score%40; y<CANVAS_HEIGHT; y+=40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

      turretsRef.current.forEach(t => {
        ctx.fillStyle = COLORS.RED;
        const tx = t.side === 'left' ? 0 : CANVAS_WIDTH - 15;
        ctx.fillRect(tx, t.y, 15, 25);
      });

      bulletsRef.current.forEach(b => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.YELLOW; ctx.fill();
        ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.stroke();
      });

      platformsRef.current.forEach(p => {
        if (p.broken) return;
        ctx.fillStyle = getPlatformColor(p.type);
        ctx.fillRect(p.x, p.y, p.width, p.height);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(p.x, p.y, p.width, 3);
      });

      if (!isDying) {
        const p = playerRef.current;
        ctx.fillStyle = playerColor;
        ctx.fillRect(p.x, p.y, p.width, p.height);
        
        if (p.hasImmunity) {
          ctx.strokeStyle = 'white'; ctx.lineWidth = 3;
          ctx.strokeRect(p.x - 3, p.y - 3, p.width + 6, p.height + 6);
        }
        if (p.hasSpeedBoost) {
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          ctx.fillRect(p.x + 2, p.y + p.height - 4, p.width - 4, 2);
        }
      }

      particlesRef.current.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        if (p.isVoxel) {
          ctx.save();
          ctx.translate(p.x + p.size/2, p.y + p.size/2);
          ctx.rotate(p.angle);
          ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1.0;
      ctx.restore();

      animationFrameId = requestAnimationFrame(() => { update(); draw(); });
    };
    draw();
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, jumpMultiplier, meterMultiplier, gravityMultiplier, playerColor, mode, checkpointInterval, onGameOver, onMilestone, onCheckpointReached, onLifeLost, onCoinEarned, generatePlatform, handleManualJump, triggerDeath, score, isDying]);

  return (
    <div className="relative border-4 border-cyan-500 rounded-3xl shadow-[0_0_60px_rgba(0,255,255,0.3)] bg-black overflow-hidden scale-[0.85] md:scale-100">
      {showLegend && <Legend onClose={() => setShowLegend(false)} />}
      
      {showCheckpointMsg && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-bounce">
          <div className="bg-purple-600 px-8 py-3 rounded-full border-4 border-white text-white font-orbitron font-bold text-xl shadow-[0_0_40px_rgba(168,85,247,0.8)] text-center">
            SYNC POINT<br/>
            <span className="text-[10px] uppercase opacity-60">Progress Stored</span>
          </div>
        </div>
      )}

      {/* Exit Button - Top Left */}
      <button 
        onClick={() => { sfx.playClick(); onAbort(); }}
        className="absolute top-6 left-6 z-50 bg-red-600/90 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-white hover:text-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.6)] border-2 border-white/20 active:scale-95"
        title="Abort Run"
      >
        <i className="fas fa-power-off"></i>
      </button>

      {/* Meter - Top Right */}
      <div className="absolute top-6 right-6 z-20 text-right flex flex-col items-end pointer-events-none select-none">
        <div className="font-orbitron text-cyan-400 text-6xl font-black drop-shadow-[0_0_20px_rgba(0,255,255,1)] italic tracking-tighter">
          {Math.floor(score)}<span className="text-xl ml-1 not-italic opacity-70">M</span>
        </div>
        <div className="flex items-center mt-2 bg-black/70 px-4 py-1.5 rounded-full border-2 border-cyan-500/40 backdrop-blur-md">
          <i className="fas fa-heart text-red-500 mr-2 text-[12px] animate-pulse"></i>
          <span className="text-[12px] font-orbitron text-white font-bold tracking-[0.2em] uppercase">
            {mode === GameMode.RUSH ? 'Matrix Infinity' : `Link Stability: ${lives}`}
          </span>
        </div>
      </div>

      {/* Legend Toggle - Bottom Right */}
      <button 
        onClick={() => { sfx.playClick(); setShowLegend(true); }}
        className="absolute bottom-6 right-6 z-50 bg-cyan-500 text-black w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-white transition-all shadow-[0_0_20px_rgba(0,255,255,0.5)] border-2 border-white/20 active:scale-90"
      >
        <i className="fas fa-list-ul"></i>
      </button>
      
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block cursor-crosshair" onClick={handleManualJump} />
    </div>
  );
};

export default GameCanvas;
