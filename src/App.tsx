import { useCallback, useEffect, useRef, useState } from 'react';
import { CollectionModal } from './components/CollectionModal';
import { EndModal } from './components/EndModal';
import { GameHUD } from './components/GameHUD';
import { LevelSelectModal } from './components/LevelSelectModal';
import { MainMenu } from './components/MainMenu';
import { PauseModal } from './components/PauseModal';
import { SettingsModal } from './components/SettingsModal';
import { soundEngine } from './game/audio';
import {
  ENVIRONMENT_THEMES,
  getDailyChallengeConfig,
  getEnvironmentTheme,
  getLevelConfig,
  getPillowDesign,
  PILLOW_DESIGNS,
} from './game/catalog';
import { RunConfig, SoftStackEngine } from './game/SoftStackEngine';
import { DEFAULT_SAVE_DATA, loadSaveData, persistSaveData } from './game/storage';
import {
  FloatingTextEvent,
  GameMode,
  GameScreen,
  GameStats,
  SaveData,
} from './game/types';

const INITIAL_STATS: GameStats = {
  score: 0,
  height: 0,
  pillowsUsed: 0,
  maxPillows: null,
  targetHeight: null,
  perfectStreak: 0,
  bestStreakInRun: 0,
  comboMultiplier: 1,
  coinsEarnedInRun: 0,
  isNewBest: false,
};

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<SoftStackEngine | null>(null);

  const [saveData, setSaveData] = useState<SaveData>(() => loadSaveData());
  const saveDataRef = useRef<SaveData>(saveData);

  const [screen, setScreen] = useState<GameScreen>('menu');
  const screenRef = useRef<GameScreen>(screen);

  const [selectedMode, setSelectedMode] = useState<GameMode>('classic');
  const activeModeRef = useRef<GameMode>('classic');
  const activeLevelRef = useRef<number>(saveData.currentLevel);

  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [floatingEvents, setFloatingEvents] = useState<FloatingTextEvent[]>([]);

  const [showCollection, setShowCollection] = useState(false);
  const [showLevels, setShowLevels] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Sync refs with latest state
  useEffect(() => {
    saveDataRef.current = saveData;
    persistSaveData(saveData);
    soundEngine.setVolumes(saveData.musicVolume, saveData.sfxVolume);
    engineRef.current?.setHapticsEnabled(saveData.hapticsEnabled);
  }, [saveData]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const pushFloatingEvent = useCallback((ev: FloatingTextEvent) => {
    setFloatingEvents((prev) => [...prev.slice(-3), ev]);
    window.setTimeout(() => {
      setFloatingEvents((prev) => prev.filter((item) => item.id !== ev.id));
    }, 1080);
  }, []);

  const handleRunGameOver = useCallback((finalStats: GameStats) => {
    const mode = activeModeRef.current;
    const prevSave = saveDataRef.current;
    let isNewBest = false;
    let nextBestClassic = prevSave.bestScoreClassic;
    let nextBestRelax = prevSave.bestScoreRelax;

    if (mode === 'classic' && finalStats.score > prevSave.bestScoreClassic) {
      nextBestClassic = finalStats.score;
      isNewBest = true;
    } else if (mode === 'relax' && finalStats.score > prevSave.bestScoreRelax) {
      nextBestRelax = finalStats.score;
      isNewBest = true;
    }

    setStats({ ...finalStats, isNewBest });
    setSaveData((curr) => ({
      ...curr,
      bestScoreClassic: Math.max(curr.bestScoreClassic, nextBestClassic),
      bestScoreRelax: Math.max(curr.bestScoreRelax, nextBestRelax),
      coins: curr.coins + finalStats.coinsEarnedInRun,
    }));
    setScreen('gameover');
  }, []);

  const handleRunLevelComplete = useCallback((finalStats: GameStats) => {
    const mode = activeModeRef.current;
    const lvl = activeLevelRef.current;
    const daily = getDailyChallengeConfig();

    setStats(finalStats);
    setSaveData((curr) => {
      const completed = curr.completedLevels.includes(lvl)
        ? curr.completedLevels
        : [...curr.completedLevels, lvl];

      return {
        ...curr,
        coins: curr.coins + finalStats.coinsEarnedInRun,
        completedLevels: mode === 'challenge' ? completed : curr.completedLevels,
        highestUnlockedLevel:
          mode === 'challenge'
            ? Math.max(curr.highestUnlockedLevel, lvl + 1)
            : curr.highestUnlockedLevel,
        currentLevel:
          mode === 'challenge' ? Math.max(curr.currentLevel, lvl + 1) : curr.currentLevel,
        lastDailyCompletedDate:
          mode === 'daily' ? daily.dateKey : curr.lastDailyCompletedDate,
      };
    });
    setScreen('levelcomplete');
  }, []);

  // Initialize Three.js WebGL engine once
  useEffect(() => {
    const mount = canvasMountRef.current;
    if (!mount) return;

    const initialSave = saveDataRef.current;
    soundEngine.setVolumes(initialSave.musicVolume, initialSave.sfxVolume);

    const engine = new SoftStackEngine(
      mount,
      initialSave.selectedPillowId,
      initialSave.selectedThemeId,
      {
        onStatsChange: (nextStats) => setStats(nextStats),
        onFloatingText: pushFloatingEvent,
        onGameOver: handleRunGameOver,
        onLevelComplete: handleRunLevelComplete,
      },
    );
    engine.setHapticsEnabled(initialSave.hapticsEnabled);
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
      soundEngine.stopMusic();
    };
  }, [handleRunGameOver, handleRunLevelComplete, pushFloatingEvent]);

  const startGameRun = useCallback(
    (mode: GameMode, overrideLevel?: number) => {
      soundEngine.unlock();
      soundEngine.startMusic();
      soundEngine.playButtonTap();

      const currSave = saveDataRef.current;
      const design = getPillowDesign(currSave.selectedPillowId);
      const userTheme = getEnvironmentTheme(currSave.selectedThemeId);

      activeModeRef.current = mode;
      setSelectedMode(mode);

      let config: RunConfig;
      if (mode === 'relax') {
        config = {
          mode: 'relax',
          pillowDesign: design,
          theme: userTheme,
          baseSpeed: 1.75,
          speedIncrement: 0.02,
          targetHeight: null,
          maxPillows: null,
        };
      } else if (mode === 'challenge') {
        const lvlNum = overrideLevel ?? currSave.currentLevel;
        activeLevelRef.current = lvlNum;
        const lvlCfg = getLevelConfig(lvlNum);
        const themeForLvl =
          currSave.selectedThemeId !== 'pastel-city'
            ? userTheme
            : getEnvironmentTheme(lvlCfg.recommendedThemeId);
        config = {
          mode: 'challenge',
          pillowDesign: design,
          theme: themeForLvl,
          baseSpeed: lvlCfg.baseSpeed,
          speedIncrement: lvlCfg.speedIncrement,
          targetHeight: lvlCfg.targetHeight,
          maxPillows: lvlCfg.maxPillows,
          paletteOverride:
            currSave.selectedPillowId === 'pastel-satin'
              ? lvlCfg.paletteOverride
              : undefined,
          levelRewardCoins: lvlCfg.rewardCoins,
        };
      } else if (mode === 'daily') {
        const daily = getDailyChallengeConfig();
        const alreadyDone = currSave.lastDailyCompletedDate === daily.dateKey;
        config = {
          mode: 'daily',
          pillowDesign: design,
          theme: userTheme,
          baseSpeed: daily.baseSpeed,
          speedIncrement: 0.05,
          targetHeight: daily.targetHeight,
          maxPillows: daily.maxPillows,
          paletteOverride: daily.palette,
          levelRewardCoins: alreadyDone ? 15 : daily.rewardCoins,
        };
      } else {
        // Classic mode
        config = {
          mode: 'classic',
          pillowDesign: design,
          theme: userTheme,
          baseSpeed: 2.35,
          speedIncrement: 0.065,
          targetHeight: null,
          maxPillows: null,
        };
      }

      setShowCollection(false);
      setShowLevels(false);
      setShowSettings(false);
      setFloatingEvents([]);
      setScreen('playing');
      engineRef.current?.startRun(config);
    },
    [],
  );

  // Keyboard support (Space / Enter / ArrowDown to drop, Escape to pause/resume)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (screenRef.current === 'playing') {
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowDown') {
          e.preventDefault();
          soundEngine.unlock();
          engineRef.current?.triggerDrop();
        } else if (e.code === 'Escape' || e.code === 'KeyP') {
          e.preventDefault();
          engineRef.current?.setPaused(true);
          setScreen('paused');
        }
      } else if (screenRef.current === 'paused' && (e.code === 'Escape' || e.code === 'KeyP')) {
        e.preventDefault();
        engineRef.current?.setPaused(false);
        setScreen('playing');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleStagePointerDown = () => {
    soundEngine.unlock();
    soundEngine.startMusic();
    if (screen === 'playing') {
      engineRef.current?.triggerDrop();
    }
  };

  const handlePause = () => {
    soundEngine.playButtonTap();
    engineRef.current?.setPaused(true);
    setScreen('paused');
  };

  const handleResume = () => {
    soundEngine.playButtonTap();
    engineRef.current?.setPaused(false);
    setScreen('playing');
  };

  const handleReturnToMenu = () => {
    soundEngine.playButtonTap();
    engineRef.current?.applyCosmetics(saveData.selectedPillowId, saveData.selectedThemeId);
    engineRef.current?.returnToMenu();
    setScreen('menu');
  };

  const handleBuyPillow = (id: string) => {
    const item = PILLOW_DESIGNS.find((p) => p.id === id);
    if (!item || saveData.coins < item.cost || saveData.unlockedPillows.includes(id)) return;
    soundEngine.playCoin();
    setSaveData((curr) => ({
      ...curr,
      coins: curr.coins - item.cost,
      unlockedPillows: [...curr.unlockedPillows, id],
      selectedPillowId: id,
    }));
    engineRef.current?.applyCosmetics(id, saveData.selectedThemeId);
  };

  const handleSelectPillow = (id: string) => {
    soundEngine.playButtonTap();
    setSaveData((curr) => ({ ...curr, selectedPillowId: id }));
    engineRef.current?.applyCosmetics(id, saveData.selectedThemeId);
  };

  const handleBuyTheme = (id: string) => {
    const item = ENVIRONMENT_THEMES.find((t) => t.id === id);
    if (!item || saveData.coins < item.cost || saveData.unlockedThemes.includes(id)) return;
    soundEngine.playCoin();
    setSaveData((curr) => ({
      ...curr,
      coins: curr.coins - item.cost,
      unlockedThemes: [...curr.unlockedThemes, id],
      selectedThemeId: id,
    }));
    engineRef.current?.applyCosmetics(saveData.selectedPillowId, id);
  };

  const handleSelectTheme = (id: string) => {
    soundEngine.playButtonTap();
    setSaveData((curr) => ({ ...curr, selectedThemeId: id }));
    engineRef.current?.applyCosmetics(saveData.selectedPillowId, id);
  };

  const activeBestScore =
    activeModeRef.current === 'relax' ? saveData.bestScoreRelax : saveData.bestScoreClassic;

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none touch-manipulation"
      onPointerDown={handleStagePointerDown}
    >
      {/* Dedicated WebGL Mount Container */}
      <div ref={canvasMountRef} className="absolute inset-0 w-full h-full" />

      {/* Main Menu */}
      {screen === 'menu' && (
        <MainMenu
          saveData={saveData}
          selectedMode={selectedMode}
          onSelectMode={(m) => {
            soundEngine.unlock();
            soundEngine.startMusic();
            soundEngine.playButtonTap();
            setSelectedMode(m);
          }}
          onPlay={() => startGameRun(selectedMode)}
          onOpenCollection={() => {
            soundEngine.playButtonTap();
            setShowCollection(true);
          }}
          onOpenLevels={() => {
            soundEngine.playButtonTap();
            setShowLevels(true);
          }}
          onOpenSettings={() => {
            soundEngine.playButtonTap();
            setShowSettings(true);
          }}
        />
      )}

      {/* Active Gameplay HUD */}
      {(screen === 'playing' || screen === 'paused') && (
        <GameHUD
          mode={activeModeRef.current}
          levelNumber={activeLevelRef.current}
          bestScore={activeBestScore}
          totalCoins={saveData.coins}
          stats={stats}
          floatingEvents={floatingEvents}
          onPause={handlePause}
        />
      )}

      {/* Pause Overlay */}
      {screen === 'paused' && (
        <PauseModal
          musicVolume={saveData.musicVolume}
          sfxVolume={saveData.sfxVolume}
          onChangeMusic={(v) => setSaveData((curr) => ({ ...curr, musicVolume: v }))}
          onChangeSfx={(v) => setSaveData((curr) => ({ ...curr, sfxVolume: v }))}
          onResume={handleResume}
          onRestart={() => startGameRun(activeModeRef.current, activeLevelRef.current)}
          onMainMenu={handleReturnToMenu}
        />
      )}

      {/* Game Over & Level Complete */}
      {(screen === 'gameover' || screen === 'levelcomplete') && (
        <EndModal
          type={screen}
          mode={activeModeRef.current}
          levelNumber={activeLevelRef.current}
          bestScore={activeBestScore}
          stats={stats}
          onRetry={() => startGameRun(activeModeRef.current, activeLevelRef.current)}
          onNextLevel={() => startGameRun('challenge', activeLevelRef.current + 1)}
          onMainMenu={handleReturnToMenu}
        />
      )}

      {/* Collection Modal */}
      {showCollection && (
        <CollectionModal
          saveData={saveData}
          onClose={() => {
            soundEngine.playButtonTap();
            setShowCollection(false);
          }}
          onBuyPillow={handleBuyPillow}
          onSelectPillow={handleSelectPillow}
          onBuyTheme={handleBuyTheme}
          onSelectTheme={handleSelectTheme}
        />
      )}

      {/* Levels Modal */}
      {showLevels && (
        <LevelSelectModal
          saveData={saveData}
          onSelectLevel={(lvl) => {
            setSaveData((curr) => ({ ...curr, currentLevel: lvl }));
            startGameRun('challenge', lvl);
          }}
          onClose={() => {
            soundEngine.playButtonTap();
            setShowLevels(false);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          musicVolume={saveData.musicVolume}
          sfxVolume={saveData.sfxVolume}
          hapticsEnabled={saveData.hapticsEnabled}
          onChangeMusic={(v) => setSaveData((curr) => ({ ...curr, musicVolume: v }))}
          onChangeSfx={(v) => setSaveData((curr) => ({ ...curr, sfxVolume: v }))}
          onToggleHaptics={(enabled) => {
            soundEngine.playButtonTap();
            setSaveData((curr) => ({ ...curr, hapticsEnabled: enabled }));
          }}
          onResetProgress={() => {
            soundEngine.playButtonTap();
            const fresh = { ...DEFAULT_SAVE_DATA };
            setSaveData(fresh);
            engineRef.current?.applyCosmetics(fresh.selectedPillowId, fresh.selectedThemeId);
          }}
          onClose={() => {
            soundEngine.playButtonTap();
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}
