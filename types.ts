
export enum GameState {
  START = 'START',
  PLAYING = 'PLAYING',
  GAMEOVER = 'GAMEOVER',
  SHOP = 'SHOP',
  EDITOR = 'EDITOR'
}

export enum GameMode {
  CLASSIC = 'CLASSIC',
  RUSH = 'RUSH',
  CUSTOM = 'CUSTOM'
}

export interface CustomLevel {
  id: string;
  name: string;
  platforms: Platform[];
  turrets: Turret[];
}

export interface Skin {
  id: string;
  name: string;
  color: string;
  cost: number;
}

export interface AnnouncerMessage {
  text: string;
  type: 'praise' | 'insult' | 'neutral';
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  dx: number;
  broken?: boolean;
}

export type PlatformType = 'normal' | 'moving' | 'breakable' | 'spring' | 'teleport' | 'speed' | 'immunity' | 'kill';

export interface Bullet {
  x: number;
  y: number;
  vx: number;
  radius: number;
}

export interface Turret {
  x?: number;
  y: number;
  side: 'left' | 'right';
  fireCooldown: number;
  fired: boolean;
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
}
