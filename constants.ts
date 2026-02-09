
export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 650;
export const GRAVITY = 0.38;
export const BASE_JUMP_FORCE = -12.5;
export const SPRING_FORCE = -21;

export const PLAYER_ACCEL = 0.8;
export const PLAYER_AIR_ACCEL = 0.45;
export const PLAYER_FRICTION = 0.8;
export const MAX_PLAYER_SPEED = 4.5;

export const PLATFORM_WIDTH = 85;
export const PLATFORM_HEIGHT = 12;
export const MAX_PLATFORMS = 20;
export const VERTICAL_GAP = 70;

export const GRANDSLAM_COOLDOWN_MS = 15000;
export const GRANDSLAM_SLAM_VELOCITY = 18;
export const GRANDSLAM_JUMP_MULTIPLIER = 1.6;

export const COLORS = {
  CYAN: '#00ffff',
  MAGENTA: '#ff00ff',
  YELLOW: '#ffff00',
  RED: '#ff4444',
  PURPLE: '#bf00ff',
  GREEN: '#00ff44',
  WHITE: '#ffffff',
  BLUE: '#0088ff',
  BG: '#0a0a1a',
  PLAYER: '#00ffaa',
  SLIPPERY: '#4da6ff'
};

export const COSMETICS: { [key: string]: any[] } = {
  SKINS: [
    { id: 'default', name: 'NEON PRIME', value: '#00ffaa', cost: 0, levelRequired: 1, style: 'glow' },
    { id: 'slime', name: 'BIO-CELL', value: '#adff2f', cost: 50, levelRequired: 5, style: 'bubble' },
    { id: 'robot', name: 'MK-ULTRA', value: '#a1a1aa', cost: 150, levelRequired: 10, style: 'core' },
    { id: 'shadow', name: 'VOID SPECTRE', value: '#ffffff', cost: 300, levelRequired: 20, style: 'ghost' },
    { id: 'vanguard', name: 'VANGUARD OMEGA', value: '#0088ff', cost: 600, levelRequired: 35, style: 'shield' },
    { id: 'gold', name: 'ZENITH GOLD', value: '#fbbf24', cost: 1200, levelRequired: 50, style: 'aura' },
    { id: 'glitch', name: 'SYSTEM_ERROR', value: '#ff00ff', cost: 2500, levelRequired: 70, style: 'glitch' },
  ],
  TRAILS: [
    { id: 'none', name: 'STEALTH', value: 'none', cost: 0 },
    { id: 'fire', name: 'THERMAL FLAME', value: 'fire', cost: 100 },
    { id: 'glitch', name: 'BIT-STREAM', value: 'glitch', cost: 250 },
    { id: 'rainbow', name: 'PRISM WAVE', value: 'rainbow', cost: 500 },
    { id: 'lightning', name: 'ARC VOLTAGE', value: 'lightning', cost: 750 },
  ],
  DEATH_FX: [
    { id: 'poof', name: 'DEFAULT', value: 'poof', cost: 0 },
    { id: 'shatter', name: 'CRYSTALLIZE', value: 'shatter', cost: 200 },
    { id: 'dissolve', name: 'NEURAL FLUX', value: 'dissolve', cost: 400 },
  ],
  PAD_THEMES: [
    { id: 'classic', name: 'TECH', value: 'classic', cost: 0 },
    { id: 'void', name: 'VOID-GRID', value: 'void', cost: 600 },
  ]
};

export const ACHIEVEMENTS: any[] = [
  { id: 'meters_1000', name: 'Cloud Chaser', desc: 'Ascend a total of 15,000M', goal: 15000, rewardType: 'COINS', rewardAmount: 50, icon: 'fa-cloud-upload' },
  { id: 'meters_10000', name: 'Stratosphere', desc: 'Ascend a total of 50,000M', goal: 50000, rewardType: 'XP', rewardAmount: 1000, icon: 'fa-rocket' },
  { id: 'sectors_1', name: 'Sector Explorer', desc: 'Beat your first Sector Operation', goal: 1, rewardType: 'COINS', rewardAmount: 100, icon: 'fa-map' },
  { id: 'sectors_5', name: 'Sector Master', desc: 'Beat 10 Sector Operations', goal: 10, rewardType: 'XP', rewardAmount: 2500, icon: 'fa-trophy' },
  { id: 'coins_500', name: 'Token Miner', desc: 'Earn a total of 2,500 Credits', goal: 2500, rewardType: 'COINS', rewardAmount: 100, icon: 'fa-coins' },
  { id: 'deaths_10', name: 'Glitch in the Matrix', desc: 'Fail 50 times', goal: 50, rewardType: 'COINS', rewardAmount: 25, icon: 'fa-skull' },
];

export const UPGRADE_BASE_COSTS = { LIFE: 15, MULTIPLIER: 5, JUMP: 8 };
export const BOOST_COSTS = { DOUBLE_CREDITS: 10, DOUBLE_JUMP: 35 };
export const LEVEL_BOOSTS = [
  { id: 'overdrive', name: 'OVERDRIVE', desc: '+3 Lives next round', cost: 5 },
  { id: 'gravity_null', name: 'GRAVITY NULL', desc: '0.85x Gravity next round', cost: 3 },
  { id: 'xp_surge', name: 'XP SURGE', desc: '2x Level XP next round', cost: 2 }
];

export const SKINS = COSMETICS.SKINS;
