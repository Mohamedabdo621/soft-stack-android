import React from 'react';
import { Coins, Pause } from 'lucide-react';
import { FloatingTextEvent, GameMode, GameStats } from '../game/types';

interface GameHUDProps {
  mode: GameMode;
  levelNumber: number;
  bestScore: number;
  totalCoins: number;
  stats: GameStats;
  floatingEvents: FloatingTextEvent[];
  onPause: () => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  mode,
  levelNumber,
  bestScore,
  totalCoins,
  stats,
  floatingEvents,
  onPause,
}) => {
  const displayBest = Math.max(bestScore, stats.score);
  const pillowsLeft =
    stats.maxPillows !== null ? Math.max(0, stats.maxPillows - stats.pillowsUsed) : null;

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-4 sm:p-5">
      {/* Top HUD Bar */}
      <div className="w-full max-w-[460px] mx-auto flex items-start justify-between gap-3">
        {/* Left: Mode & Best / Progress */}
        <div className="bg-[#FFFBF2]/95 border-2 border-[#DFC9A4] rounded-2xl px-3.5 py-2 shadow-md flex flex-col gap-0.5 min-w-[116px]">
          <div className="text-[11px] font-bold text-[#6B5A42] uppercase tracking-wider whitespace-nowrap">
            {mode === 'challenge'
              ? `Level ${levelNumber}`
              : mode === 'daily'
                ? 'Daily Stack'
                : mode === 'relax'
                  ? 'Relax Mode'
                  : `Best ${displayBest}`}
          </div>
          {stats.targetHeight !== null ? (
            <div className="text-sm font-extrabold text-[#133D85] tabular-nums whitespace-nowrap">
              {stats.height} / {stats.targetHeight} stacked
            </div>
          ) : (
            <div className="text-sm font-extrabold text-[#133D85] tabular-nums whitespace-nowrap">
              Height {stats.height}
            </div>
          )}
          {pillowsLeft !== null && (
            <div className="text-[11px] font-bold text-[#E6423B] tabular-nums whitespace-nowrap">
              {pillowsLeft} pillows left
            </div>
          )}
        </div>

        {/* Center: Big Crisp Score */}
        <div className="flex flex-col items-center pt-0.5">
          <div className="font-display text-5xl sm:text-6xl font-bold text-white text-stroke-blue tabular-nums leading-none">
            {stats.score}
          </div>
          {stats.comboMultiplier > 1 && (
            <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-[#F6BE23] border border-[#FFF5CC] text-[#3D2600] text-xs font-extrabold tabular-nums shadow-sm">
              COMBO x{stats.comboMultiplier}
            </div>
          )}
        </div>

        {/* Right: Coins & Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="bg-[#FFFBF2]/95 border-2 border-[#DFC9A4] rounded-2xl px-3 py-2 shadow-md flex items-center gap-1.5 text-sm font-bold text-[#9A5B00] tabular-nums">
            <Coins className="w-4 h-4 text-[#F59E0B] shrink-0" />
            <span>{totalCoins + stats.coinsEarnedInRun}</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPause();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            aria-label="Pause Game"
            className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[#FFFBF2] border-2 border-[#DFC9A4] text-[#133D85] shadow-md hover:bg-[#F5EAD6] active:translate-y-0.5 transition-transform cursor-pointer"
          >
            <Pause className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>

      {/* Floating Feedback Popups */}
      <div className="relative flex-1 w-full max-w-[440px] mx-auto">
        {floatingEvents.map((ev) => {
          const toneStyle =
            ev.tone === 'reward'
              ? 'text-[#FFD43B] text-3xl sm:text-4xl'
              : ev.tone === 'combo'
                ? 'text-[#FFF59D] text-2xl sm:text-3xl'
                : ev.tone === 'perfect'
                  ? 'text-white text-2xl sm:text-3xl'
                  : 'text-[#E0F2FE] text-xl';

          return (
            <div
              key={ev.id}
              className="absolute left-1/2 top-[24%] animate-float-pop text-center whitespace-nowrap"
            >
              <div className={`font-display font-bold text-stroke-blue ${toneStyle}`}>
                {ev.text}
              </div>
              {ev.subtext && (
                <div className="text-xs font-extrabold text-[#3D2600] bg-[#FFD43B] border border-[#FFF5CC] px-2.5 py-0.5 rounded-lg inline-block mt-1 shadow">
                  {ev.subtext}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* First-Drop Gentle One-Tap Instruction */}
      {stats.pillowsUsed === 0 && (
        <div className="w-full text-center pb-5">
          <span className="inline-block px-4 py-2 rounded-2xl bg-[#133D85]/85 text-white text-sm font-bold border border-white/25 shadow-md">
            Tap anywhere to drop pillow
          </span>
        </div>
      )}
    </div>
  );
};
