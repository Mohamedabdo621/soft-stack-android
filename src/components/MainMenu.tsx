import React from 'react';
import {
  Calendar,
  Coins,
  Grid2x2,
  Infinity as InfinityIcon,
  Palette,
  Play,
  Settings,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { getDailyChallengeConfig, getLevelConfig } from '../game/catalog';
import { GameMode, SaveData } from '../game/types';

interface MainMenuProps {
  saveData: SaveData;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onPlay: () => void;
  onOpenCollection: () => void;
  onOpenLevels: () => void;
  onOpenSettings: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  saveData,
  selectedMode,
  onSelectMode,
  onPlay,
  onOpenCollection,
  onOpenLevels,
  onOpenSettings,
}) => {
  const daily = getDailyChallengeConfig();
  const dailyDone = saveData.lastDailyCompletedDate === daily.dateKey;
  const currentLvl = getLevelConfig(saveData.currentLevel);

  const modes: { id: GameMode; label: string; icon: React.ReactNode }[] = [
    { id: 'classic', label: 'Classic', icon: <InfinityIcon className="w-4 h-4" /> },
    { id: 'relax', label: 'Relax', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'challenge', label: 'Levels', icon: <Grid2x2 className="w-4 h-4" /> },
    { id: 'daily', label: 'Daily', icon: <Calendar className="w-4 h-4" /> },
  ];

  const getModeSubtitle = (): string => {
    switch (selectedMode) {
      case 'classic':
        return `Best Score · ${saveData.bestScoreClassic}`;
      case 'relax':
        return `No-stress stacking · Best ${saveData.bestScoreRelax}`;
      case 'challenge':
        return `${currentLvl.title} · Stack ${currentLvl.targetHeight} pillows`;
      case 'daily':
        return dailyDone
          ? `${daily.title} · Completed`
          : `${daily.title} · +${daily.rewardCoins} Coins`;
    }
  };

  return (
    <div className="absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
      {/* Top Status Row */}
      <div className="w-full max-w-[440px] mx-auto flex items-center justify-between gap-3 pointer-events-auto">
        <div className="flex items-center gap-4 bg-[#FFFBF2] border-2 border-[#DFC9A4] rounded-2xl px-4 py-2 shadow-md">
          <div className="flex items-center gap-1.5 text-[#9A5B00] font-bold text-sm tabular-nums">
            <Coins className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>{saveData.coins}</span>
          </div>
          <span className="text-[#DFC9A4]" aria-hidden="true">|</span>
          <div className="flex items-center gap-1.5 text-[#133D85] font-bold text-sm tabular-nums">
            <Trophy className="w-4 h-4 text-[#2279F0] shrink-0" />
            <span>{saveData.bestScoreClassic}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label="Settings"
          className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#FFFBF2] border-2 border-[#DFC9A4] text-[#133D85] shadow-md hover:bg-[#F5EAD6] active:translate-y-0.5 transition-transform cursor-pointer"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Title (kept high so the animated 3D pillow stack stays visible in center) */}
      <div className="w-full max-w-[440px] mx-auto text-center mt-2 mb-auto pt-4 pointer-events-none">
        <h1 className="font-display text-5xl sm:text-6xl font-bold tracking-tight text-white text-stroke-blue animate-gentle-bob leading-none">
          SOFT STACK
        </h1>
        <p className="mt-2 text-sm font-bold text-white text-stroke-dark tracking-wide">
          {getModeSubtitle()}
        </p>
      </div>

      {/* Bottom Interactive Dock */}
      <div className="w-full max-w-[440px] mx-auto flex flex-col gap-3 pointer-events-auto pb-1">
        {/* Mode Segmented Selector */}
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-[#FFFBF2] border-2 border-[#DFC9A4] rounded-2xl shadow-lg">
          {modes.map((m) => {
            const active = selectedMode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onSelectMode(m.id)}
                className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2279F0] text-white shadow-sm'
                    : 'text-[#1B2A4A] hover:bg-[#EFE2CA]'
                }`}
              >
                {m.icon}
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Primary Play CTA */}
        <button
          type="button"
          onClick={onPlay}
          className="w-full py-4 px-6 rounded-2xl bg-[#2279F0] hover:bg-[#1B6AD9] active:translate-y-1 text-white font-display text-2xl font-bold tracking-wide shadow-[0_6px_0_#123D85] active:shadow-[0_2px_0_#123D85] border-2 border-[#60A5FA] flex items-center justify-center gap-3 transition-all cursor-pointer"
        >
          <Play className="w-6 h-6 fill-current" />
          <span className="whitespace-nowrap">
            {selectedMode === 'challenge'
              ? `PLAY LEVEL ${saveData.currentLevel}`
              : selectedMode === 'daily'
                ? 'PLAY DAILY'
                : 'PLAY'}
          </span>
        </button>

        {/* Secondary Collection & Level Browser Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOpenCollection}
            className="py-3.5 px-4 rounded-2xl bg-[#F6BE23] hover:bg-[#E5AE19] active:translate-y-0.5 text-[#3D2600] font-bold text-sm shadow-[0_4px_0_#B47B00] active:shadow-[0_1px_0_#B47B00] border-2 border-[#FFE082] flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer"
          >
            <Palette className="w-4 h-4 shrink-0" />
            <span>Pillows & Worlds</span>
          </button>

          <button
            type="button"
            onClick={onOpenLevels}
            className="py-3.5 px-4 rounded-2xl bg-[#FFFBF2] hover:bg-[#F5EAD6] active:translate-y-0.5 text-[#133D85] font-bold text-sm shadow-[0_4px_0_#C7B089] active:shadow-[0_1px_0_#C7B089] border-2 border-[#DFC9A4] flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer"
          >
            <Grid2x2 className="w-4 h-4 shrink-0" />
            <span>All Levels ({saveData.highestUnlockedLevel})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
