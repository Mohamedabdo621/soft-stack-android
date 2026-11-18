import React from 'react';
import { ArrowRight, Coins, Home, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import { GameMode, GameStats } from '../game/types';

interface EndModalProps {
  type: 'gameover' | 'levelcomplete';
  mode: GameMode;
  levelNumber: number;
  bestScore: number;
  stats: GameStats;
  onRetry: () => void;
  onNextLevel: () => void;
  onMainMenu: () => void;
}

export const EndModal: React.FC<EndModalProps> = ({
  type,
  mode,
  levelNumber,
  bestScore,
  stats,
  onRetry,
  onNextLevel,
  onMainMenu,
}) => {
  const isWin = type === 'levelcomplete';

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#0D2554]/60"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-[380px] bg-[#FFFBF2] border-2 border-[#DFC9A4] rounded-3xl p-6 shadow-2xl flex flex-col gap-5 text-center">
        <div>
          {isWin ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFD43B] text-[#3D2600] text-xs font-extrabold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{mode === 'daily' ? 'DAILY COMPLETE' : `LEVEL ${levelNumber} CLEAR`}</span>
            </div>
          ) : stats.isNewBest ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFD43B] text-[#3D2600] text-xs font-extrabold mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>NEW BEST SCORE</span>
            </div>
          ) : null}

          <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#133D85]">
            {isWin ? 'Soft Perfection!' : 'Tower Toppled'}
          </h2>
          <p className="text-sm font-semibold text-[#6B5A42] mt-1">
            {isWin
              ? `Stacked ${stats.height} fluffy pillows cleanly`
              : `Reached ${stats.height} pillows high`}
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-3 gap-2.5 bg-[#F5EAD6] border border-[#DFC9A4] rounded-2xl p-3.5">
          <div>
            <div className="text-[11px] font-bold text-[#6B5A42] uppercase">Score</div>
            <div className="font-display text-2xl font-bold text-[#133D85] tabular-nums">
              {stats.score}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-[#6B5A42] uppercase">Best</div>
            <div className="font-display text-2xl font-bold text-[#133D85] tabular-nums">
              {Math.max(bestScore, stats.score)}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-[#6B5A42] uppercase">Coins</div>
            <div className="font-display text-2xl font-bold text-[#B47B00] tabular-nums flex items-center justify-center gap-1">
              <Coins className="w-4 h-4 text-[#F59E0B]" />
              <span>+{stats.coinsEarnedInRun}</span>
            </div>
          </div>
        </div>

        {stats.bestStreakInRun >= 3 && (
          <div className="text-xs font-bold text-[#1B2A4A]">
            Best Perfect Streak · <span className="text-[#2279F0] tabular-nums">{stats.bestStreakInRun}x</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {isWin && mode === 'challenge' ? (
            <button
              type="button"
              onClick={onNextLevel}
              className="w-full py-4 px-5 rounded-2xl bg-[#2279F0] hover:bg-[#1B6AD9] text-white font-display text-xl font-bold shadow-[0_5px_0_#123D85] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Next Level ({levelNumber + 1})</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="w-full py-4 px-5 rounded-2xl bg-[#2279F0] hover:bg-[#1B6AD9] text-white font-display text-xl font-bold shadow-[0_5px_0_#123D85] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" />
              <span>{isWin ? 'Play Again' : 'Try Again'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onMainMenu}
            className="w-full py-3 px-5 rounded-2xl bg-[#EFE2CA] hover:bg-[#E4D1B1] text-[#133D85] font-bold text-base border border-[#DFC9A4] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
