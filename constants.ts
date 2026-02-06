
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 650;
export const GRAVITY = 0.38;
export const BASE_JUMP_FORCE = -12.5;
export const SPRING_FORCE = -21;

export const PLAYER_ACCEL = 0.8;
export const PLAYER_FRICTION = 0.8;
export const MAX_PLAYER_SPEED = 4.5;

export const PLATFORM_WIDTH = 85;
export const PLATFORM_HEIGHT = 12;
export const MAX_PLATFORMS = 20; // Increased buffer to prevent "voids"
export const VERTICAL_GAP = 70;

export const COLORS = {
  CYAN: '#00ffff',
  MAGENTA: '#ff00ff',
  YELLOW: '#ffff00',
  RED: '#ff4444',
  PURPLE: '#bf00ff',
  GREEN: '#00ff44',
  WHITE: '#ffffff',
  BG: '#0a0a1a',
  PLAYER: '#00ffaa'
};

export const UPGRADE_BASE_COSTS = {
  LIFE: 15,
  MULTIPLIER: 5,
  JUMP: 8
};

export const BOOST_COSTS = {
  DOUBLE_CREDITS: 10
};

export const LEVEL_BOOSTS = [
  { id: 'overdrive', name: 'OVERDRIVE', desc: '+3 Lives next round', cost: 5 },
  { id: 'gravity_null', name: 'GRAVITY NULL', desc: '0.85x Gravity next round', cost: 3 },
  { id: 'xp_surge', name: 'XP SURGE', desc: '2x Level XP next round', cost: 2 }
];

export const SKINS = [
  { id: 'default', name: 'NEON', color: '#00ffaa', cost: 0, levelRequired: 1 },
  { id: 'ghost', name: 'GHOST', color: '#a1a1aa', cost: 20, levelRequired: 1 },
  { id: 'blood', name: 'REAPER', color: '#ef4444', cost: 30, levelRequired: 5 },
  { id: 'gold', name: 'MIDAS', color: '#fbbf24', cost: 50, levelRequired: 15 },
  { id: 'void', name: 'VOID', color: '#8b5cf6', cost: 80, levelRequired: 30 },
  { id: 'omega', name: 'OMEGA', color: '#ffffff', cost: 200, levelRequired: 50 },
];
