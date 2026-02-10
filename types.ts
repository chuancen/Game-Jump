
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  SHOP = 'SHOP',
  EDITOR = 'EDITOR',
  LEADERBOARD = 'LEADERBOARD',
  ACHIEVEMENTS = 'ACHIEVEMENTS'
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  RUSH = 'RUSH',
  CUSTOM = 'CUSTOM',
  LEVELS = 'LEVELS'
}

export type CosmeticType = 'SKIN' | 'TRAIL' | 'LAUNCH_FX' | 'DEATH_FX' | 'PAD_THEME' | 'BACKGROUND' | 'SKYBOX';

export interface CosmeticItem {
  id: string;
  name: string;
  type: CosmeticType;
  value: string;
  cost: number;
  currency?: 'COINS' | 'POINTS';
  levelRequired?: number;
}

export interface CustomLevel {
  id: string;
  name: string;
  platforms: Platform[];
  turrets: Turret[];
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  dx: number;
  angle?: number; // Added for tilted pads
  broken?: boolean;
  hitGlow?: number;
}

export type PlatformType = 'normal' | 'moving' | 'breakable' | 'spring' | 'teleport' | 'speed' | 'immunity' | 'kill' | 'slippery' | 'tilted';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Turret {
  x?: number;
  y: number;
  side: 'left' | 'right';
  fireCooldown: number;
  fired: boolean;
  type?: 'normal' | 'laser' | 'wave';
}

export interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  hasImmunity: boolean;
  immunityTimer: number;
  hasSpeedBoost: boolean;
  speedTimer: number;
  isSlamming: boolean;
  isAnchoring: boolean; // Added for anchor power
  grandslamJumpReady: boolean;
  grandslamCooldown: number;
  anchorCooldown: number; // Added for anchor timer
  wallJumpUsed: boolean;
  trailHistory: {x: number, y: number, alpha: number}[];
}

export interface AnnouncerMessage {
  text: string;
  type: 'neutral' | 'praise' | 'insult';
}

export interface LeaderboardEntry {
  username: string;
  score: number;
  rank: string;
  skinId: string;
  timestamp: number;
}

export interface Achievement {
  id: string;
  name: string;
  desc: string;
  goal: number;
  rewardType: 'COINS' | 'XP';
  rewardAmount: number;
  icon: string;
}

export interface UserStats {
  totalMeters: number;
  totalJumps: number;
  totalDeaths: number;
  sectorsBeat: number;
  killPadsSurvived: number;
  coinsEarned: number;
  skinsUnlocked?: number;
  pointsSpent?: number;
  checkpointsReached?: number;
}
