import { SaveData } from './types';

const STORAGE_KEY = 'soft_stack_save_v3';

export const DEFAULT_SAVE_DATA: SaveData = {
  bestScoreClassic: 0,
  bestScoreRelax: 0,
  currentLevel: 1,
  highestUnlockedLevel: 1,
  completedLevels: [],
  coins: 50,
  unlockedPillows: ['pastel-satin', 'royal-courtyard'],
  selectedPillowId: 'pastel-satin',
  unlockedThemes: ['pastel-city', 'pastel-studio', 'sunny-courtyard'],
  selectedThemeId: 'pastel-city',
  musicVolume: 0.45,
  sfxVolume: 0.8,
  hapticsEnabled: true,
  lastDailyCompletedDate: null,
};

export function loadSaveData(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE_DATA };
    const parsed = JSON.parse(raw) as Partial<SaveData>;
    return {
      ...DEFAULT_SAVE_DATA,
      ...parsed,
      unlockedPillows: Array.isArray(parsed.unlockedPillows) && parsed.unlockedPillows.length > 0
        ? parsed.unlockedPillows
        : DEFAULT_SAVE_DATA.unlockedPillows,
      unlockedThemes: Array.isArray(parsed.unlockedThemes) && parsed.unlockedThemes.length > 0
        ? parsed.unlockedThemes
        : DEFAULT_SAVE_DATA.unlockedThemes,
      completedLevels: Array.isArray(parsed.completedLevels)
        ? parsed.completedLevels
        : DEFAULT_SAVE_DATA.completedLevels,
    };
  } catch {
    return { ...DEFAULT_SAVE_DATA };
  }
}

export function persistSaveData(data: SaveData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore storage quota errors gracefully
  }
}
