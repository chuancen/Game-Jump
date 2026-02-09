
import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
  PLAYER_AIR_ACCEL,
  PLAYER_FRICTION, 
  MAX_PLAYER_SPEED, 
  PLATFORM_WIDTH, 
  PLATFORM_HEIGHT, 
  MAX_PLATFORMS, 
  VERTICAL_GAP, 
  COLORS,
  GRANDSLAM_COOLDOWN_MS,
  GRANDSLAM_SLAM_VELOCITY,
  GRANDSLAM_JUMP_MULTIPLIER,
  COSMETICS
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
  levelTarget?: number;
  customLevel?: CustomLevel | null;
  jumpMultiplier: number;
  meterMultiplier: number;
  gravityMultiplier: number;
  playerColor: string;
  doubleCredits: boolean;
  doubleJumpActive: boolean;
  sessionSeed: number;
  onGameOver: (score: number) => void;
  onLevelComplete?: (score: number) => void;
  onCheckpointReached: (altitude: number) => void;
  onLifeLost: () => void;
  onCoinEarned: () => void;
  onAbort: () => void;
  activeCosmetics: Record<string, string>;
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
  va: number; 
  isVoxel?: boolean;
}

interface ParallaxItem {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
}

const createPRNG = (seed: number) => {
  return () => {
    seed |= 0; seed = seed + 0x9e3779b9 | 0;
    let t = seed ^ seed >>> 16; t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15; t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  };
};

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
    case 'slippery': return COLORS.SLIPPERY;
    default: return COLORS.CYAN;
  }
};

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, lives, highScore, rushProgress, mode, checkpointInterval, levelTarget, customLevel,
  jumpMultiplier, meterMultiplier, gravityMultiplier, playerColor, doubleCredits, doubleJumpActive, sessionSeed,
  onGameOver, onLevelComplete, onCheckpointReached, onLifeLost, onCoinEarned, onAbort, activeCosmetics
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [showLegend, setShowLegend] = useState(false);
  const [isDying, setIsDying] = useState(false);
  const isDyingRef = useRef(false);
  const shakeRef = useRef(0);
  
  const inputsRef = useRef({ left: false, right: false, jump: false, slam: false });
  const [uiActive, setUiActive] = useState({ left: false, right: false, jump: false, slam: false });

  const jumpBufferCounter = useRef(0);
  const coyoteTimeCounter = useRef(0);
  const canDoubleJumpRef = useRef(false);

  const internalCheckpointRef = useRef(rushProgress);
  const lastCoinRef = useRef(0);
  const lastRushCoinRef = useRef(0);
  const lastCheckpointAltitude = useRef(rushProgress);
  const [showCheckpointMsg, setShowCheckpointMsg] = useState(false);
  const [showDifficultySpike, setShowDifficultySpike] = useState<string | null>(null);
  const lastKnownTier = useRef(0);

  const personalBestRef = useRef(mode === GameMode.RUSH ? rushProgress : mode === GameMode.CLASSIC ? highScore : 0);
  
  const playerRef = useRef<Player & { isGrounded: boolean, killTimer: number, standingOnKillPad: boolean, standingOnSlipperyPad: boolean }>({
    x: CANVAS_WIDTH / 2 - 12.5, y: CANVAS_HEIGHT - 100, vx: 0, vy: 0, width: 25, height: 25, color: playerColor,
    hasImmunity: false, immunityTimer: 0, hasSpeedBoost: false, speedTimer: 0, isGrounded: false,
    killTimer: 0, standingOnKillPad: false, standingOnSlipperyPad: false, isSlamming: false,
    grandslamJumpReady: false, grandslamCooldown: 0, wallJumpUsed: false, trailHistory: []
  });

  const [gsCooldownPercent, setGsCooldownPercent] = useState(0);
  const platformsRef = useRef<Platform[]>([]);
  const nextPlatformIndexRef = useRef(0);
  const bulletsRef = useRef<Bullet[]>([]);
  const turretsRef = useRef<Turret[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});

  const backgroundItems = useMemo(() => {
    const items: ParallaxItem[] = [];
    const rng = createPRNG(sessionSeed + 123);
    for (let i = 0; i < 60; i++) items.push({ id: i, x: rng() * CANVAS_WIDTH, y: rng() * CANVAS_HEIGHT, size: rng() * 1.5 + 0.5, speed: 0.05, opacity: rng() * 0.3 + 0.1, color: 'white' });
    for (let i = 0; i < 15; i++) items.push({ id: 100 + i, x: rng() * CANVAS_WIDTH, y: rng() * CANVAS_HEIGHT, size: rng() * 3 + 1, speed: 0.15, opacity: rng() * 0.1 + 0.05, color: rng() > 0.5 ? COLORS.CYAN : COLORS.MAGENTA });
    return items;
  }, [sessionSeed]);

  const getDifficultyTier = useCallback((currentScore: number) => {
    if (currentScore >= 1000000) return 3;
    if (currentScore >= 50000) return 2;
    if (currentScore >= 10000) return 1;
    return 0;
  }, []);

  const getDifficultyParams = useCallback((tier: number) => {
    switch(tier) {
      case 3: return { width: 50, gap: 135, turretChance: 0.65, movingSpeed: 3.5, laserRatio: 0.7, waveRatio: 0.2 };
      case 2: return { width: 65, gap: 105, turretChance: 0.45, movingSpeed: 2.5, laserRatio: 0.5, waveRatio: 0.3 };
      case 1: return { width: 75, gap: 85, turretChance: 0.30, movingSpeed: 2.0, laserRatio: 0.3, waveRatio: 0.3 };
      default: return { width: PLATFORM_WIDTH, gap: VERTICAL_GAP, turretChance: 0.20, movingSpeed: 1.5, laserRatio: 0.1, waveRatio: 0.1 };
    }
  }, []);

  const generatePlatform = useCallback((y: number, lastX: number, platformIdx: number): Platform => {
    const altitude = (CANVAS_HEIGHT - 100 - y) / 5;
    const tier = getDifficultyTier(altitude);
    const params = getDifficultyParams(tier);
    const rng = createPRNG(sessionSeed + platformIdx + 9999);
    const r = rng();
    let type: PlatformType = 'normal';
    const powerupPenalty = tier * 0.05;
    if (r > 0.94) type = 'kill';
    else if (r > 0.90 + powerupPenalty) type = 'teleport';
    else if (r > 0.86 + powerupPenalty) type = 'speed';
    else if (r > 0.82 + powerupPenalty) type = 'immunity';
    else if (r > 0.78 + powerupPenalty) type = 'slippery';
    else if (r > 0.70) type = 'moving';
    else if (r > 0.60) type = 'spring';
    else if (r > 0.50 && y < -2000) type = 'breakable';
    let dx = 0;
    if (type === 'moving') dx = (rng() > 0.5 ? params.movingSpeed : -params.movingSpeed);
    let x = lastX + (rng() - 0.5) * 260;
    x = Math.max(0, Math.min(CANVAS_WIDTH - params.width, x));
    
    if (rng() < params.turretChance && y < -200) {
      const turretRand = rng();
      let tType: 'normal' | 'laser' | 'wave' = 'normal';
      if (turretRand < params.laserRatio) tType = 'laser';
      else if (turretRand < params.laserRatio + params.waveRatio) tType = 'wave';
      
      turretsRef.current.push({ 
        y: y - 25, 
        side: rng() > 0.5 ? 'left' : 'right', 
        fireCooldown: Math.floor(tType === 'laser' ? rng() * 200 : tType === 'wave' ? rng() * 180 : rng() * 120), 
        fired: false, 
        type: tType 
      });
    }
    return { x, y, width: params.width, height: PLATFORM_HEIGHT, type, dx, broken: false, hitGlow: 0 };
  }, [getDifficultyTier, getDifficultyParams, sessionSeed]);

  const initGame = useCallback((isRespawn: boolean = false) => {
    const startAltitude = (mode === GameMode.RUSH) ? internalCheckpointRef.current : (mode === GameMode.CLASSIC && isRespawn ? scoreRef.current : 0);
    setScore(startAltitude); scoreRef.current = startAltitude;
    lastCoinRef.current = startAltitude; lastRushCoinRef.current = startAltitude; lastCheckpointAltitude.current = startAltitude;
    lastKnownTier.current = getDifficultyTier(startAltitude);
    personalBestRef.current = mode === GameMode.RUSH ? rushProgress : mode === GameMode.CLASSIC ? highScore : 0;
    
    setIsDying(false); isDyingRef.current = false;
    shakeRef.current = 0; jumpBufferCounter.current = 0; coyoteTimeCounter.current = 0; canDoubleJumpRef.current = false;
    bulletsRef.current = []; turretsRef.current = []; particlesRef.current = [];
    playerRef.current = {
      x: CANVAS_WIDTH / 2 - 12.5, y: CANVAS_HEIGHT - 100, vx: 0, vy: 0, width: 25, height: 25, color: playerColor,
      hasImmunity: false, immunityTimer: 0, hasSpeedBoost: false, speedTimer: 0, isGrounded: false,
      killTimer: 0, standingOnKillPad: false, standingOnSlipperyPad: false, isSlamming: false,
      grandslamJumpReady: false, grandslamCooldown: 0, wallJumpUsed: false, trailHistory: []
    };
    setGsCooldownPercent(0);
    if (mode === GameMode.CUSTOM && customLevel) {
      const editorHeight = 3000; const yOffset = CANVAS_HEIGHT - editorHeight;
      platformsRef.current = customLevel.platforms.map(p => ({ ...p, y: p.y + yOffset, broken: false, hitGlow: 0 }));
      turretsRef.current = customLevel.turrets.map(t => ({ ...t, y: t.y + yOffset }));
    } else {
      const platforms: Platform[] = [];
      const startP: Platform = { x: CANVAS_WIDTH/2 - PLATFORM_WIDTH/2, y: CANVAS_HEIGHT - 50, width: PLATFORM_WIDTH, height: PLATFORM_HEIGHT, type: 'normal', dx: 0, hitGlow: 0 };
      platforms.push(startP);
      let currentIdx = Math.floor(startAltitude / (VERTICAL_GAP / 5)); nextPlatformIndexRef.current = currentIdx + 1;
      let lastY = CANVAS_HEIGHT - 50; let lastX = startP.x;
      const initialTier = getDifficultyTier(startAltitude); const initialParams = getDifficultyParams(initialTier);
      for (let i = 1; i < MAX_PLATFORMS; i++) {
        lastY -= initialParams.gap;
        const nextP = generatePlatform(lastY, lastX, nextPlatformIndexRef.current++);
        platforms.push(nextP); lastX = nextP.x;
      }
      platformsRef.current = platforms;
    }
  }, [generatePlatform, playerColor, mode, customLevel, getDifficultyTier, getDifficultyParams, rushProgress, highScore]);

  const triggerSlam = useCallback(() => {
    const player = playerRef.current;
    if (player.grandslamCooldown <= 0 && !player.isGrounded && !player.isSlamming) {
      player.isSlamming = true; 
      player.vy = GRANDSLAM_SLAM_VELOCITY; 
      player.grandslamCooldown = GRANDSLAM_COOLDOWN_MS;
      sfx.playSlam(); 
      shakeRef.current = 5;
    }
  }, []);

  const handleManualJump = useCallback(() => {
    if (isDyingRef.current) return;
    const player = playerRef.current;
    
    const atLeftWall = player.x <= 1; 
    const atRightWall = player.x >= CANVAS_WIDTH - player.width - 1;
    
    let multiplier = 1.0;
    if (player.grandslamJumpReady) { 
      multiplier = GRANDSLAM_JUMP_MULTIPLIER; 
      player.grandslamJumpReady = false; 
      shakeRef.current = 10; 
    }

    if ((player.isGrounded || coyoteTimeCounter.current > 0) && gameState === GameState.PLAYING) {
      player.vy = BASE_JUMP_FORCE * jumpMultiplier * multiplier;
      player.isGrounded = false; player.killTimer = 0; player.standingOnKillPad = false; player.wallJumpUsed = false; 
      coyoteTimeCounter.current = 0; jumpBufferCounter.current = 0; sfx.playJump();
      if (doubleJumpActive) canDoubleJumpRef.current = true;
    } else if ((atLeftWall || atRightWall) && gameState === GameState.PLAYING && !player.wallJumpUsed) {
      player.vy = BASE_JUMP_FORCE * jumpMultiplier * multiplier * 0.9;
      player.vx = atLeftWall ? MAX_PLAYER_SPEED : -MAX_PLAYER_SPEED;
      player.isGrounded = false; 
      player.wallJumpUsed = true; 
      sfx.playJump();
      if (doubleJumpActive) canDoubleJumpRef.current = true;
    } else if (doubleJumpActive && canDoubleJumpRef.current && gameState === GameState.PLAYING) {
      player.vy = BASE_JUMP_FORCE * jumpMultiplier * multiplier;
      canDoubleJumpRef.current = false; jumpBufferCounter.current = 0; sfx.playJump();
      for(let i=0; i<12; i++) particlesRef.current.push({ x: player.x + player.width/2, y: player.y + player.height, size: Math.random() * 4 + 2, color: playerColor, life: 0.8, vx: (Math.random() - 0.5) * 8, vy: Math.random() * 4 + 2, angle: 0, va: 0 });
    } else {
      jumpBufferCounter.current = 10;
    }
  }, [jumpMultiplier, gameState, doubleJumpActive, playerColor]);

  const triggerDeath = useCallback(() => {
    if (isDyingRef.current) return;
    setIsDying(true); isDyingRef.current = true;
    shakeRef.current = 25; sfx.playDeath();
    const player = playerRef.current; 
    const deathFxId = activeCosmetics.DEATH_FX;
    
    const particleCount = deathFxId === 'dissolve' ? 100 : 50;
    for (let i = 0; i < particleCount; i++) {
        const vx = (Math.random() - 0.5) * 25;
        const vy = (Math.random() - 0.5) * 25 - 10;
        particlesRef.current.push({ 
          x: player.x + Math.random() * player.width, 
          y: player.y + Math.random() * player.height, 
          size: Math.random() * 6 + 2, 
          color: deathFxId === 'dissolve' ? '#ffffff' : playerColor, 
          life: 1.0 + Math.random(), 
          vx, vy, angle: Math.random() * Math.PI * 2, 
          va: (Math.random() - 0.5) * 0.5, isVoxel: deathFxId === 'shatter'
        });
    }

    setTimeout(() => {
      if (mode === GameMode.RUSH) initGame(true);
      else if (mode === GameMode.LEVELS) onGameOver(Math.floor(scoreRef.current));
      else if (lives > 1) { onLifeLost(); initGame(true); }
      else onGameOver(Math.floor(scoreRef.current));
    }, 1500);
  }, [playerColor, mode, lives, onLifeLost, onGameOver, initGame, activeCosmetics]);

  const updateMovementStates = (touches: React.TouchList) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    let left = false, right = false, jump = false, slam = false;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches.item(i); if (!touch) continue;
      const touchX = touch.clientX - rect.left; const touchY = touch.clientY - rect.top;
      const xRatio = touchX / rect.width;
      if (xRatio < 0.35) { if (touchY > rect.height - 210) { if (touchY < rect.height - 110) jump = true; else left = true; } }
      else if (xRatio > 0.65) { if (touchY > rect.height - 110) right = true; else if (touchY > rect.height - 210) slam = true; }
    }
    inputsRef.current = { left, right, jump, slam };
    setUiActive({ left, right, jump, slam });
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) initGame();
  }, [gameState, sessionSeed]);

  useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => (keysRef.current[e.code] = e.type === 'keydown');
    window.addEventListener('keydown', handleKeys);
    window.addEventListener('keyup', handleKeys);
    return () => { window.removeEventListener('keydown', handleKeys); window.removeEventListener('keyup', handleKeys); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const delta = time - lastTime; lastTime = time;
      if (gameState !== GameState.PLAYING) return;
      
      const player = playerRef.current; const platforms = platformsRef.current;
      const bullets = bulletsRef.current; const turrets = turretsRef.current;
      const particles = particlesRef.current;

      if (player.grandslamCooldown > 0) { 
        player.grandslamCooldown -= delta; 
        setGsCooldownPercent(Math.max(0, player.grandslamCooldown / GRANDSLAM_COOLDOWN_MS)); 
      }
      
      if (shakeRef.current > 0) shakeRef.current *= 0.9;
      if (jumpBufferCounter.current > 0) jumpBufferCounter.current--;
      
      if (player.isGrounded) { 
        coyoteTimeCounter.current = 6; 
        if (doubleJumpActive) canDoubleJumpRef.current = true; 
        player.wallJumpUsed = false;
      } else {
        coyoteTimeCounter.current--;
      }

      if (!isDyingRef.current) {
        player.trailHistory.push({ x: player.x + player.width/2, y: player.y + player.height/2, alpha: 1.0 });
        if (player.trailHistory.length > 25) player.trailHistory.shift();
        player.trailHistory.forEach(t => t.alpha -= 0.04);

        if (player.immunityTimer > 0) player.immunityTimer--; else player.hasImmunity = false;
        if (player.speedTimer > 0) player.speedTimer--; else player.hasSpeedBoost = false;
        
        const baseAccel = player.isGrounded ? PLAYER_ACCEL : PLAYER_AIR_ACCEL;
        const accel = player.hasSpeedBoost ? baseAccel * 2.0 : baseAccel;
        const maxSpd = player.hasSpeedBoost ? MAX_PLAYER_SPEED * 2.2 : MAX_PLAYER_SPEED;
        const inputLeft = keysRef.current['ArrowLeft'] || keysRef.current['KeyA'] || inputsRef.current.left;
        const inputRight = keysRef.current['ArrowRight'] || keysRef.current['KeyD'] || inputsRef.current.right;
        const inputJump = keysRef.current['Space'] || keysRef.current['ArrowUp'] || keysRef.current['KeyW'] || inputsRef.current.jump;
        const inputSlam = keysRef.current['KeyG'] || inputsRef.current.slam;
        
        if (inputLeft) player.vx -= accel; else if (inputRight) player.vx += accel; else player.vx *= player.standingOnSlipperyPad ? 0.98 : PLAYER_FRICTION;
        if (inputJump) handleManualJump();
        if (inputSlam) triggerSlam();
        
        player.vx = Math.max(-maxSpd, Math.min(maxSpd, player.vx)); player.x += player.vx;
        if (!player.isGrounded) { 
          player.vy += (GRAVITY * gravityMultiplier * (player.vy > 0 ? 1.25 : 1.0)); 
        } else {
          player.vy = 0;
        }
        player.y += player.vy;
        
        if (player.x < 0) player.x = 0; if (player.x + player.width > CANVAS_WIDTH) player.x = CANVAS_WIDTH - player.width;

        let foundGrounded = false; let touchingKillPad = false; let onSlippery = false;
        if (player.vy >= 0) {
          platforms.forEach((p) => {
            if (!p.broken && player.x + player.width > p.x && player.x < p.x + p.width && 
                player.y + player.height >= p.y && player.y + player.height <= p.y + p.height + Math.max(player.vy, 10)) {
              
              if (!player.isGrounded) p.hitGlow = 1.0; 
              
              if (player.isSlamming) {
                player.isSlamming = false; 
                player.grandslamJumpReady = true; 
                sfx.playSlam(); 
                shakeRef.current = 15;
                for(let i=0; i<15; i++) particlesRef.current.push({ x: player.x + player.width/2, y: p.y, size: Math.random() * 5 + 2, color: COLORS.YELLOW, life: 1.0, vx: (Math.random() - 0.5) * 10, vy: -Math.random() * 5, angle: 0, va: 0 });
              }
              
              if (p.type === 'spring') { player.vy = SPRING_FORCE; player.isGrounded = false; shakeRef.current = 5; sfx.playSpring(); return; }
              if (p.type === 'teleport') { player.y -= 450; player.vy = BASE_JUMP_FORCE * jumpMultiplier; player.isGrounded = false; sfx.playTeleport(); return; }
              
              player.y = p.y - player.height; 
              player.isGrounded = true; 
              foundGrounded = true; 
              player.wallJumpUsed = false;
              
              if (jumpBufferCounter.current > 0) handleManualJump();
              if (p.type === 'moving') player.x += p.dx; 
              if (p.type === 'breakable') p.broken = true;
              if (p.type === 'kill' && !player.hasImmunity) touchingKillPad = true;
              if (p.type === 'speed') { player.hasSpeedBoost = true; player.speedTimer = 240; sfx.playPowerup(); }
              if (p.type === 'immunity') { player.hasImmunity = true; player.immunityTimer = 480; sfx.playPowerup(); }
              if (p.type === 'slippery') onSlippery = true;
            }
          });
        }
        player.standingOnSlipperyPad = onSlippery;
        
        bullets.forEach((b, i) => {
          b.x += b.vx; b.y += b.vy;
          const distance = Math.sqrt(Math.pow(b.x - (player.x + player.width/2), 2) + Math.pow(b.y - (player.y + player.height/2), 2));
          if (distance < b.radius + player.width/2 && !player.hasImmunity) { triggerDeath(); bullets.splice(i, 1); }
        });
        
        turrets.forEach((t) => {
          t.fireCooldown++;
          if (t.type === 'laser') {
            const cycle = 480;
            const current = t.fireCooldown % cycle;
            const inVerticalRange = t.y > -50 && t.y < CANVAS_HEIGHT + 50;
            // Laser fires for the last 120 frames of the 480 cycle (360-480)
            if (current >= 360 && inVerticalRange) { 
               // Player is hit if they cross the laser Y path
               const playerMidY = player.y + player.height/2;
               const laserY = t.y + 12.5; 
               // Hitbox is slightly taller than visual beam for fairness
               if (playerMidY > laserY - 17 && playerMidY < laserY + 17 && !player.hasImmunity) triggerDeath(); 
            }
          } else if (t.type === 'wave') {
            if (t.fireCooldown % 180 === 0 && t.y > -50 && t.y < CANVAS_HEIGHT) {
              const startX = t.side === 'left' ? 10 : CANVAS_WIDTH - 10;
              for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * (i / 5) - (Math.PI / 6);
                const vx = t.side === 'left' ? Math.cos(angle) * 4.5 : -Math.cos(angle) * 4.5;
                const vy = Math.sin(angle) * 4.5;
                bullets.push({ x: startX, y: t.y + 10, vx, vy, radius: 5 });
              }
            }
          } else if (t.fireCooldown % 120 === 0 && t.y > -50 && t.y < CANVAS_HEIGHT) {
             bullets.push({ x: t.side === 'left' ? 10 : CANVAS_WIDTH - 10, y: t.y + 10, vx: t.side === 'left' ? 5 : -5, vy: 0, radius: 6 });
          }
        });
        
        if (touchingKillPad && player.isGrounded && !player.hasImmunity) { 
          player.killTimer++; if (player.killTimer > 50) triggerDeath(); 
        } else {
          player.killTimer = 0;
        }
        
        if (!foundGrounded) player.isGrounded = false;

        if (player.y < CANVAS_HEIGHT * 0.45) {
          const offset = CANVAS_HEIGHT * 0.45 - player.y; player.y = CANVAS_HEIGHT * 0.45; const gainedScore = (offset / 5) * meterMultiplier;
          const nextScore = scoreRef.current + gainedScore; scoreRef.current = nextScore; setScore(nextScore);
          
          if (mode === GameMode.LEVELS && levelTarget && nextScore >= levelTarget) { onLevelComplete?.(Math.floor(nextScore)); triggerDeath(); }
          
          const tier = getDifficultyTier(nextScore);
          if (tier > lastKnownTier.current) { 
            lastKnownTier.current = tier; 
            setShowDifficultySpike(tier === 3 ? "IMPOSSIBLE MODE" : tier === 2 ? "INSANE MODE" : "HARD MODE"); 
            setTimeout(() => setShowDifficultySpike(null), 3000); 
            sfx.playPowerup(); 
            shakeRef.current = 10; 
          }
          
          if (mode === GameMode.CLASSIC && nextScore >= lastCoinRef.current + 200) { 
            lastCoinRef.current = Math.floor(nextScore / 200) * 200; onCoinEarned(); sfx.playCoin(); 
          }
          else if (mode === GameMode.RUSH) {
             if (nextScore >= lastRushCoinRef.current + 1000) { 
               lastRushCoinRef.current = Math.floor(nextScore / 1000) * 1000; onCoinEarned(); sfx.playCoin(); 
             }
             if (Math.floor(nextScore / checkpointInterval) > Math.floor(lastCheckpointAltitude.current / checkpointInterval)) {
               const cp = Math.floor(nextScore / checkpointInterval) * checkpointInterval; 
               lastCheckpointAltitude.current = cp; 
               internalCheckpointRef.current = cp;
               setShowCheckpointMsg(true); 
               setTimeout(() => setShowCheckpointMsg(false), 2000); 
               sfx.playPowerup(); 
               onCheckpointReached(cp);
             }
          }
          
          platforms.forEach(p => { 
            p.y += offset; 
            if (p.y > CANVAS_HEIGHT && mode !== GameMode.CUSTOM) { 
              const idx = platforms.indexOf(p); 
              let minY = CANVAS_HEIGHT, anchorX = CANVAS_WIDTH / 2; 
              platforms.forEach(other => { if (other.y < minY) { minY = other.y; anchorX = other.x; } }); 
              const newY = minY - getDifficultyParams(getDifficultyTier(nextScore)).gap; 
              platforms[idx] = generatePlatform(newY, anchorX, nextPlatformIndexRef.current++); 
            } 
          });
          bullets.forEach(b => b.y += offset); 
          particles.forEach(p => p.y += offset); 
          turrets.forEach(t => t.y += offset);
        }
        if (player.y > CANVAS_HEIGHT + 150) triggerDeath(); 
        
        platforms.forEach(p => { 
          if (p.type === 'moving') { p.x += p.dx; if (p.x < 0 || p.x + p.width > CANVAS_WIDTH) p.dx *= -1; } 
          if (p.hitGlow > 0) p.hitGlow *= 0.9;
        });
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]; p.x += p.vx; p.y += p.vy; p.angle += p.va;
        if (p.isVoxel) { p.vy += 0.25; p.vx *= 0.98; p.life -= 0.015; } else p.life -= 0.03;
        if (p.life <= 0) particles.splice(i, 1);
      }

      const alt = scoreRef.current;
      const hue = Math.min(280, 180 + (alt / 100)); 
      const bgColor = `hsl(${hue}, 80%, 5%)`;
      const gridColor = `hsla(${hue}, 80%, 50%, 0.1)`;

      ctx.save(); if (shakeRef.current > 0.1) ctx.translate((Math.random() - 0.5) * shakeRef.current, (Math.random() - 0.5) * shakeRef.current);
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      backgroundItems.forEach(item => { let dy = (item.y + (scoreRef.current * 5 * item.speed)) % CANVAS_HEIGHT; if (dy < 0) dy += CANVAS_HEIGHT; ctx.globalAlpha = item.opacity; ctx.fillStyle = `hsl(${hue}, 100%, 80%)`; ctx.beginPath(); ctx.arc(item.x, dy, item.size, 0, Math.PI * 2); ctx.fill(); });
      ctx.globalAlpha = 1.0; 
      ctx.strokeStyle = gridColor; ctx.lineWidth = 1; for(let x=0; x<CANVAS_WIDTH; x+=40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke(); }
      let gridY = (scoreRef.current * 5) % 40; for(let y = gridY; y < CANVAS_HEIGHT; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke(); }

      // Personal Best Line rendering
      if (personalBestRef.current > 0) {
        const pbY = (CANVAS_HEIGHT * 0.45) + (alt - personalBestRef.current) * 5;
        if (pbY > -50 && pbY < CANVAS_HEIGHT + 50) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 1;
          ctx.setLineDash([5, 15]);
          ctx.beginPath();
          ctx.moveTo(0, pbY);
          ctx.lineTo(CANVAS_WIDTH, pbY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = 'bold 8px Orbitron';
          ctx.textAlign = 'right';
          ctx.fillText(`PERSONAL BEST: ${personalBestRef.current}M`, CANVAS_WIDTH - 10, pbY - 5);
          ctx.textAlign = 'left';
        }
      }

      // Checkpoint Rendering
      if (mode === GameMode.RUSH) {
        const nextCP = Math.ceil(alt / checkpointInterval) * checkpointInterval;
        const cpY = (CANVAS_HEIGHT * 0.45) + (alt - nextCP) * 5;
        if (cpY > -50 && cpY < CANVAS_HEIGHT + 50) {
          ctx.strokeStyle = COLORS.YELLOW;
          ctx.lineWidth = 2;
          ctx.setLineDash([10, 5]);
          ctx.beginPath();
          ctx.moveTo(0, cpY);
          ctx.lineTo(CANVAS_WIDTH, cpY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = COLORS.YELLOW;
          ctx.font = 'bold 10px Orbitron';
          ctx.fillText(`NEXT CHECKPOINT: ${nextCP}M`, 10, cpY - 5);
        }
      }

      turrets.forEach(t => { 
        const isVisible = t.y > -50 && t.y < CANVAS_HEIGHT + 50;
        if (!isVisible) return;
        ctx.fillStyle = t.type === 'laser' ? COLORS.PURPLE : t.type === 'wave' ? COLORS.BLUE : COLORS.RED; 
        ctx.fillRect(t.side === 'left' ? 0 : CANVAS_WIDTH-20, t.y, 20, 25); 

        // Laser visual logic
        if (t.type === 'laser') {
          const cycle = 480;
          const current = t.fireCooldown % cycle;
          if (current >= 300 && current < 360) {
            // Charging flash
            if (Math.floor(time / 50) % 2 === 0) {
              ctx.strokeStyle = 'rgba(191, 0, 255, 0.4)';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(t.side === 'left' ? 20 : CANVAS_WIDTH - 20, t.y + 12.5);
              ctx.lineTo(t.side === 'left' ? CANVAS_WIDTH : 0, t.y + 12.5);
              ctx.stroke();
            }
          } else if (current >= 360) {
            // Firing beam
            ctx.fillStyle = 'rgba(191, 0, 255, 0.8)';
            ctx.shadowBlur = 15;
            ctx.shadowColor = COLORS.PURPLE;
            ctx.fillRect(t.side === 'left' ? 20 : 0, t.y + 7.5, CANVAS_WIDTH - 20, 10);
            ctx.fillStyle = 'white';
            ctx.fillRect(t.side === 'left' ? 20 : 0, t.y + 10.5, CANVAS_WIDTH - 20, 4);
            ctx.shadowBlur = 0;
          }
        }
      });

      bullets.forEach(b => { ctx.beginPath(); ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2); ctx.fillStyle = b.radius === 5 ? COLORS.BLUE : COLORS.YELLOW; ctx.fill(); });
      
      const padTheme = activeCosmetics.PAD_THEMES || 'classic';
      platforms.forEach(p => { 
        if (p.broken) return; 
        const baseColor = getPlatformColor(p.type);
        if (padTheme === 'void') {
          ctx.lineWidth = 2; ctx.strokeStyle = baseColor; ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.beginPath(); ctx.roundRect(p.x + 1, p.y + 1, p.width - 2, p.height - 2, 2); ctx.fill(); ctx.stroke();
        } else {
          ctx.fillStyle = baseColor; ctx.fillRect(p.x, p.y, p.width, p.height);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'; ctx.fillRect(p.x, p.y, p.width, 1.5);
        }
        if (p.hitGlow > 0.01) { ctx.fillStyle = `rgba(255,255,255,${p.hitGlow})`; ctx.fillRect(p.x, p.y, p.width, p.height); }
      });

      if (!isDyingRef.current) {
        // Immunity Shield Rendering
        if (player.hasImmunity) {
          const shieldRadius = player.width * 1.2;
          const pulse = Math.sin(time / 150) * 0.1 + 0.9;
          ctx.strokeStyle = 'white';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(player.x + player.width/2, player.y + player.height/2, shieldRadius * pulse, 0, Math.PI*2);
          ctx.stroke();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fill();

          // Immunity Duration Timer
          const timerWidth = 30;
          const timerPercent = player.immunityTimer / 480;
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fillRect(player.x + player.width/2 - timerWidth/2, player.y - 15, timerWidth, 3);
          ctx.fillStyle = 'white';
          ctx.fillRect(player.x + player.width/2 - timerWidth/2, player.y - 15, timerWidth * timerPercent, 3);
        }

        const trailId = activeCosmetics.TRAILS;
        if (trailId !== 'none') {
          player.trailHistory.forEach((t, i) => {
            ctx.globalAlpha = t.alpha;
            if (trailId === 'fire') {
              ctx.fillStyle = `rgba(255, ${Math.random()*150 + 50}, 0, ${t.alpha})`;
              ctx.beginPath(); ctx.arc(t.x + (Math.random()-0.5)*15, t.y + (Math.random()-0.5)*15, 3 + i/3, 0, Math.PI*2); ctx.fill();
            } else if (trailId === 'lightning') {
              ctx.strokeStyle = COLORS.CYAN; ctx.lineWidth = 2;
              if (i > 0) {
                 const prev = player.trailHistory[i-1];
                 ctx.beginPath(); ctx.moveTo(prev.x + (Math.random()-0.5)*12, prev.y + (Math.random()-0.5)*5); ctx.lineTo(t.x + (Math.random()-0.5)*12, t.y); ctx.stroke();
              }
            } else if (trailId === 'rainbow') {
              ctx.fillStyle = `hsl(${(time/5 + i*20)%360}, 100%, 50%)`;
              ctx.beginPath(); ctx.arc(t.x, t.y, 4 + i/2, 0, Math.PI*2); ctx.fill();
            } else if (trailId === 'glitch') {
              ctx.fillStyle = i % 2 === 0 ? COLORS.MAGENTA : COLORS.CYAN;
              if (Math.random() > 0.7) ctx.fillRect(t.x + (Math.random()-0.5)*40, t.y, 8, 8);
            }
          });
        }
        ctx.globalAlpha = 1.0;

        const skinStyle = COSMETICS.SKINS.find(s => s.id === activeCosmetics.SKINS)?.style || 'glow';
        const pX = player.x; const pY = player.y; const pW = player.width; const pH = player.height;
        const pulse = (Math.sin(time / 200) + 1) / 2;
        
        // Grandslam color override
        const drawColor = (player.isSlamming || player.grandslamJumpReady) ? COLORS.YELLOW : playerColor;

        ctx.shadowBlur = 0;
        
        switch(skinStyle) {
          case 'glow':
            ctx.fillStyle = drawColor; ctx.fillRect(pX, pY, pW, pH);
            ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.strokeRect(pX - 1, pY - 1, pW + 2, pH + 2);
            ctx.strokeStyle = drawColor; ctx.lineWidth = 1; ctx.strokeRect(pX - 3, pY - 3, pW + 6, pH + 6);
            break;
          case 'bubble':
            ctx.fillStyle = drawColor; ctx.fillRect(pX, pY, pW, pH);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath(); ctx.arc(pX + 7, pY + 7, 4 + pulse * 2, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(pX + 18, pY + 15, 3, 0, Math.PI*2); ctx.fill();
            break;
          case 'core':
            ctx.fillStyle = '#111'; ctx.fillRect(pX, pY, pW, pH);
            ctx.strokeStyle = drawColor; ctx.lineWidth = 2; ctx.strokeRect(pX, pY, pW, pH);
            const eyeX = pX + pW/2 + (player.vx * 2); const eyeY = pY + pH/2 + (player.vy * 0.2);
            ctx.fillStyle = drawColor; ctx.beginPath(); ctx.arc(eyeX, eyeY, 5, 0, Math.PI*2); ctx.fill();
            ctx.stroke();
            break;
          case 'ghost':
            ctx.globalAlpha = 0.5 + pulse * 0.3;
            ctx.strokeStyle = 'white'; ctx.lineWidth = 1; ctx.strokeRect(pX, pY, pW, pH);
            ctx.fillStyle = (player.isSlamming || player.grandslamJumpReady) ? 'rgba(255,255,0,0.4)' : 'rgba(255,255,255,0.15)'; 
            ctx.fillRect(pX, pY, pW, pH);
            ctx.globalAlpha = 1.0;
            break;
          case 'aura':
            ctx.fillStyle = drawColor; ctx.fillRect(pX, pY, pW, pH);
            ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1; ctx.strokeRect(pX + 3, pY + 3, pW - 6, pH - 6);
            break;
          case 'glitch':
            ctx.fillStyle = drawColor; ctx.fillRect(pX, pY, pW, pH);
            if (Math.random() > 0.7) {
               ctx.fillStyle = 'cyan'; ctx.fillRect(pX - (Math.random()*15), pY + Math.random()*pH, 8, 3);
               ctx.fillStyle = 'magenta'; ctx.fillRect(pX + pW + (Math.random()*10), pY + Math.random()*pH, 8, 3);
            }
            break;
          case 'shield':
            ctx.fillStyle = (player.isSlamming || player.grandslamJumpReady) ? '#444400' : '#002244'; 
            ctx.fillRect(pX, pY, pW, pH);
            ctx.strokeStyle = drawColor; ctx.lineWidth = 2; ctx.strokeRect(pX, pY, pW, pH);
            ctx.save();
            ctx.translate(pX + pW/2, pY + pH/2);
            ctx.rotate(time / 500);
            ctx.strokeStyle = drawColor === COLORS.YELLOW ? 'rgba(255, 255, 0, 0.8)' : 'rgba(0, 136, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            for(let i=0; i<6; i++) {
               const angle = (i * Math.PI * 2) / 6;
               const sx = Math.cos(angle) * (pW * 0.9);
               const sy = Math.sin(angle) * (pW * 0.9);
               if(i === 0) ctx.moveTo(sx, sy); else ctx.lineTo(sx, sy);
            }
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
            break;
          default:
            ctx.fillStyle = drawColor; ctx.fillRect(pX, pY, pW, pH);
        }
      }
      
      particles.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; if (p.isVoxel) { ctx.save(); ctx.translate(p.x + p.size/2, p.y + p.size/2); ctx.rotate(p.angle); ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size); ctx.restore(); } else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); } });
      ctx.globalAlpha = 1.0; 
      
      if (showCheckpointMsg) {
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.font = 'bold 30px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText('CHECKPOINT', CANVAS_WIDTH / 2, 200);
        ctx.font = 'bold 15px Orbitron';
        ctx.fillText('SECTOR PROGRESS SAVED', CANVAS_WIDTH / 2, 230);
      }
      
      if (showDifficultySpike) {
        ctx.fillStyle = 'rgba(255, 0, 0, 0.8)';
        ctx.font = 'bold 24px Orbitron';
        ctx.textAlign = 'center';
        ctx.fillText(showDifficultySpike, CANVAS_WIDTH / 2, 280);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameState, jumpMultiplier, gravityMultiplier, meterMultiplier, playerColor, doubleJumpActive, mode, sessionSeed, levelTarget, checkpointInterval, onLevelComplete, onGameOver, onCoinEarned, onCheckpointReached, generatePlatform, handleManualJump, triggerSlam, triggerDeath, getDifficultyTier, getDifficultyParams, backgroundItems, activeCosmetics, showCheckpointMsg, showDifficultySpike]);

  const handleManualAction = (type: 'left' | 'right' | 'jump' | 'slam', active: boolean) => {
    inputsRef.current[type] = active;
    setUiActive(prev => ({ ...prev, [type]: active }));
    if (active) { if (type === 'jump') handleManualJump(); if (type === 'slam') triggerSlam(); }
  };

  return (
    <div ref={containerRef} className="relative border-4 border-cyan-500 rounded-3xl shadow-[0_0_60px_rgba(0,255,255,0.3)] bg-black overflow-hidden touch-none h-full w-full max-w-[400px] max-h-[650px] aspect-[400/650]" onTouchStart={(e) => updateMovementStates(e.touches)} onTouchMove={(e) => updateMovementStates(e.touches)} onTouchEnd={(e) => updateMovementStates(e.touches)}>
      {showLegend && <Legend onClose={() => setShowLegend(false)} />}
      <button onClick={(e) => { e.stopPropagation(); sfx.playClick(); onAbort(); }} className="absolute top-4 left-4 z-50 bg-red-600/90 text-white w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.6)] border-2 border-white/20 active:scale-95"><i className="fas fa-power-off text-xs"></i></button>
      <div className="absolute top-4 right-4 z-20 text-right select-none">
        <div className="font-orbitron text-cyan-400 text-4xl md:text-6xl font-black drop-shadow-[0_0_20px_rgba(0,255,255,1)] italic tracking-tighter">{Math.floor(score)}<span className="text-sm md:text-xl ml-1 not-italic opacity-70">M</span></div>
        <div className="flex flex-col items-end mt-1 space-y-1">
          <div className="flex items-center bg-black/70 px-3 py-1 rounded-full border border-cyan-500/40 backdrop-blur-md justify-end">
            <i className="fas fa-heart text-red-500 mr-2 text-[10px] animate-pulse"></i>
            <span className="text-[10px] font-orbitron text-white font-bold tracking-[0.2em] uppercase">{mode === GameMode.RUSH ? 'Matrix' : mode === GameMode.LEVELS ? 'Sector Ops' : lives}</span>
          </div>
          {personalBestRef.current > 0 && (
            <div className="flex items-center bg-purple-900/40 px-3 py-1 rounded-full border border-purple-500/30 backdrop-blur-md justify-end">
              <i className="fas fa-crown text-yellow-500 mr-2 text-[8px]"></i>
              <span className="text-[8px] font-orbitron text-purple-300 font-bold uppercase tracking-widest">RECORD: {personalBestRef.current}M</span>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-col items-end">
          <div className="text-[8px] font-orbitron text-yellow-500 uppercase tracking-widest font-bold mb-1">Grandslam</div>
          <div className="w-24 h-1.5 bg-gray-800 rounded-full overflow-hidden border border-yellow-500/30"><div className="h-full bg-yellow-500 transition-all duration-100" style={{ width: `${(1 - gsCooldownPercent) * 100}%` }}></div></div>
        </div>
      </div>
      {gameState === GameState.PLAYING && (
        <div className="absolute inset-x-0 bottom-0 h-52 pointer-events-none flex justify-between items-end px-4 pb-8">
          <div className="flex flex-col space-y-4">
            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all pointer-events-auto ${uiActive.jump ? 'bg-cyan-500 border-white scale-110' : 'bg-cyan-500/10 border-cyan-500/40 opacity-40'}`} onTouchStart={() => handleManualAction('jump', true)} onTouchEnd={() => handleManualAction('jump', false)}><i className={`fas fa-arrow-up text-2xl ${uiActive.jump ? 'text-black' : 'text-cyan-500'}`}></i></div>
            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all pointer-events-auto ${uiActive.left ? 'bg-cyan-500 border-white scale-110' : 'bg-cyan-500/10 border-cyan-500/40 opacity-40'}`} onTouchStart={() => handleManualAction('left', true)} onTouchEnd={() => handleManualAction('left', false)}><i className={`fas fa-arrow-left text-2xl ${uiActive.left ? 'text-black' : 'text-cyan-500'}`}></i></div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all pointer-events-auto ${uiActive.slam ? 'bg-yellow-500 border-white scale-110' : 'bg-yellow-500/10 border-yellow-500/40 opacity-40'}`} onTouchStart={() => handleManualAction('slam', true)} onTouchEnd={() => handleManualAction('slam', false)}><i className={`fas fa-explosion text-2xl ${uiActive.slam ? 'text-black' : 'text-yellow-500'}`}></i></div>
            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center transition-all pointer-events-auto ${uiActive.right ? 'bg-cyan-500 border-white scale-110' : 'bg-cyan-500/10 border-cyan-500/40 opacity-40'}`} onTouchStart={() => handleManualAction('right', true)} onTouchEnd={() => handleManualAction('right', false)}><i className={`fas fa-arrow-right text-2xl ${uiActive.right ? 'text-black' : 'text-cyan-500'}`}></i></div>
          </div>
        </div>
      )}
      <button onClick={(e) => { e.stopPropagation(); sfx.playClick(); setShowLegend(true); }} className="absolute bottom-56 right-4 z-50 bg-cyan-500 text-black w-10 h-10 rounded-xl flex items-center justify-center hover:bg-white transition-all border-2 border-white/20 active:scale-90"><i className="fas fa-list-ul text-xs"></i></button>
      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="block h-full w-full" />
    </div>
  );
};

export default GameCanvas;
