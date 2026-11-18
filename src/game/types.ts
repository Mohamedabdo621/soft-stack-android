export type GameMode = 'classic' | 'relax' | 'challenge' | 'daily';

export type GameScreen = 'menu' | 'playing' | 'paused' | 'gameover' | 'levelcomplete';

export type PillowShapeStyle = 'classic' | 'quilted' | 'star' | 'heart' | 'rainbow';

export interface PillowDesign {
  id: string;
  name: string;
  description: string;
  cost: number;
  shapeStyle: PillowShapeStyle;
  palette: string[]; // Hex colors cycled as tower rises
  pipingColor: string;
  accentColor: string;
  previewGradient: string;
}

export interface EnvironmentTheme {
  id: string;
  name: string;
  description: string;
  cost: number;
  skyTop: string;
  skyBottom: string;
  fogColor: string;
  waterColor: string;
  waterHighlight: string;
  bridgeColor: string;
  bridgeTrimColor: string;
  keyLightColor: string;
  hemiSkyColor: string;
  hemiGroundColor: string;
  cloudColor: string;
  hasStars: boolean;
  hasFloatingSparkles: boolean;
  sceneryStyle?: 'studio' | 'courtyard' | 'city';
}

export interface LevelConfig {
  level: number;
  title: string;
  tierName: string;
  targetHeight: number;
  maxPillows: number;
  baseSpeed: number;
  speedIncrement: number;
  rewardCoins: number;
  recommendedThemeId: string;
  paletteOverride?: string[];
}

export interface DailyChallengeConfig {
  dateKey: string;
  title: string;
  targetHeight: number;
  maxPillows: number;
  baseSpeed: number;
  rewardCoins: number;
  palette: string[];
}

export interface SaveData {
  bestScoreClassic: number;
  bestScoreRelax: number;
  currentLevel: number;
  highestUnlockedLevel: number;
  completedLevels: number[];
  coins: number;
  unlockedPillows: string[];
  selectedPillowId: string;
  unlockedThemes: string[];
  selectedThemeId: string;
  musicVolume: number;
  sfxVolume: number;
  hapticsEnabled: boolean;
  lastDailyCompletedDate: string | null;
}

export interface FloatingTextEvent {
  id: number;
  text: string;
  subtext?: string;
  tone: 'perfect' | 'combo' | 'reward' | 'normal';
}

export interface GameStats {
  score: number;
  height: number;
  pillowsUsed: number;
  maxPillows: number | null;
  targetHeight: number | null;
  perfectStreak: number;
  bestStreakInRun: number;
  comboMultiplier: number;
  coinsEarnedInRun: number;
  isNewBest: boolean;
}
