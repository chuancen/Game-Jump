
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
export const ANCHOR_COOLDOWN_MS = 15000;
export const GRANDSLAM_SLAM_VELOCITY = 18;
export const ANCHOR_VELOCITY = 22; // Faster than slam but no landing bonus
export const GRANDSLAM_JUMP_MULTIPLIER = 1.6;

export const AERIAL_OBSTACLE_SPAWN_CHANCE = 0.005; 
export const DRONE_SPEED_MIN = 1.5;
export const DRONE_SPEED_MAX = 3.5;

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
  SLIPPERY: '#4da6ff',
  TILTED: '#ff8800' // New color for tilted pads
};

export const COSMETICS: { [key: string]: any[] } = {
  SKINS: [
    { id: 'default', name: 'NEON PRIME', value: '#00ffaa', cost: 0, style: 'glow' },
    { id: 'slime', name: 'BIO-CELL', value: '#adff2f', cost: 50, style: 'bubble' },
    { id: 'robot', name: 'MK-ULTRA', value: '#a1a1aa', cost: 150, style: 'core' },
    { id: 'shadow', name: 'VOID SPECTRE', value: '#ffffff', cost: 300, style: 'ghost' },
    { id: 'vanguard', name: 'VANGUARD OMEGA', value: '#0088ff', cost: 600, style: 'shield' },
    { id: 'gold', name: 'ZENITH GOLD', value: '#fbbf24', cost: 1200, style: 'aura' },
    { id: 'glitch', name: 'SYSTEM_ERROR', value: '#ff00ff', cost: 2500, style: 'glitch' },
    { id: 'shard_lord', name: 'SHARD ARCHON', value: '#6366f1', cost: 5000, style: 'archon' },
    { id: 'valkyrie', name: 'CYBER VALKYRIE', value: '#f43f5e', cost: 8000, style: 'angel' },
    { id: 'overseer', name: 'VOID OVERSEER', value: '#10b981', cost: 12000, style: 'orbital' },
    { id: 'supernova', name: 'STAR KILLER', value: '#f97316', cost: 20000, style: 'supernova' },
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
    { id: 'laser', name: 'NEON ETCH', value: 'laser', cost: 1200 },
    { id: 'hazard', name: 'BIO-WASTE', value: 'hazard', cost: 2500 },
    { id: 'chrome', name: 'LIQUID SILVER', value: 'chrome', cost: 5, currency: 'POINTS' },
  ],
  BACKGROUNDS: [
    { id: 'stars', name: 'STATIC VOID', value: 'stars', cost: 0 },
    { id: 'digital', name: 'DATA FLOW', value: 'digital', cost: 400 },
    { id: 'nebula', name: 'COSMIC DUST', value: 'nebula', cost: 1500 },
    { id: 'industrial', name: 'GEAR WORKS', value: 'industrial', cost: 10, currency: 'POINTS' },
  ],
  SKYBOXES: [
    { id: 'cyber', name: 'GRID DEFAULT', value: 'cyber', cost: 0 },
    { id: 'sunset', name: 'RETR0 WAVE', value: 'sunset', cost: 800 },
    { id: 'midnight', name: 'DEEP NIGHT', value: 'midnight', cost: 2000 },
    { id: 'toxic', name: 'SECTOR-7', value: 'toxic', cost: 15, currency: 'POINTS' },
  ]
};

export const ACHIEVEMENTS: any[] = [
  { id: 'meters_15000', name: 'Cloud Chaser', desc: 'Ascend total 15,000M', goal: 15000, rewardType: 'COINS', rewardAmount: 50, icon: 'fa-cloud-upload' },
  { id: 'meters_50000', name: 'Stratosphere', desc: 'Ascend total 50,000M', goal: 50000, rewardType: 'XP', rewardAmount: 1000, icon: 'fa-rocket' },
  { id: 'sectors_1', name: 'Sector Explorer', desc: 'Beat your first Sector', goal: 1, rewardType: 'COINS', rewardAmount: 100, icon: 'fa-map' },
  { id: 'sectors_10', name: 'Sector Master', desc: 'Beat 10 Sectors', goal: 10, rewardType: 'XP', rewardAmount: 2500, icon: 'fa-trophy' },
  { id: 'coins_2500', name: 'Token Miner', desc: 'Earn total 2,500 Credits', goal: 2500, rewardType: 'COINS', rewardAmount: 100, icon: 'fa-coins' },
  { id: 'deaths_50', name: 'Glitch in Matrix', desc: 'Fail 50 times', goal: 50, rewardType: 'COINS', rewardAmount: 25, icon: 'fa-skull' },
  { id: 'skins_3', name: 'Style Icon', desc: 'Unlock 3 unique skins', goal: 3, rewardType: 'COINS', rewardAmount: 200, icon: 'fa-user-tie' },
  { id: 'skins_5', name: 'Vanguard Elite', desc: 'Unlock 5 unique skins', goal: 5, rewardType: 'XP', rewardAmount: 1500, icon: 'fa-gem' },
  { id: 'skins_10', name: 'Fashion Overlord', desc: 'Unlock 10 unique skins', goal: 10, rewardType: 'COINS', rewardAmount: 1000, icon: 'fa-crown' },
  { id: 'points_spent_50', name: 'Neural Architect', desc: 'Spend 50 Neural PTS', goal: 50, rewardType: 'COINS', rewardAmount: 500, icon: 'fa-brain' },
  { id: 'checkpoints_10', name: 'Matrix Runner', desc: 'Reach 10 Rush Checkpoints', goal: 10, rewardType: 'COINS', rewardAmount: 250, icon: 'fa-route' },
];

export const UPGRADE_BASE_COSTS = { LIFE: 15, MULTIPLIER: 5, JUMP: 8 };
export const BOOST_COSTS = { DOUBLE_CREDITS: 10, DOUBLE_JUMP: 35 };
export const LEVEL_BOOSTS = [
  { id: 'overdrive', name: 'OVERDRIVE', desc: '+3 Lives next round', cost: 5 },
  { id: 'gravity_null', name: 'GRAVITY NULL', desc: '0.85x Gravity next round', cost: 3 },
  { id: 'xp_surge', name: 'XP SURGE', desc: '2x Level XP next round', cost: 2 }
];

export const SKINS = COSMETICS.SKINS;
