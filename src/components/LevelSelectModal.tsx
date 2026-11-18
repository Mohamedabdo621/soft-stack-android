import React, { useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Lock, X } from 'lucide-react';
import { getLevelConfig } from '../game/catalog';
import { SaveData } from '../game/types';

interface LevelSelectModalProps {
  saveData: SaveData;
  onSelectLevel: (level: number) => void;
  onClose: () => void;
}

const LEVELS_PER_PAGE = 20;
const MAX_PLAYABLE_LEVEL = 200;

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  saveData,
  onSelectLevel,
  onClose,
}) => {
  const initialPage = Math.floor((saveData.currentLevel - 1) / LEVELS_PER_PAGE);
  const [page, setPage] = useState(initialPage);

  const startLevel = page * LEVELS_PER_PAGE + 1;
  const endLevel = Math.min(MAX_PLAYABLE_LEVEL, startLevel + LEVELS_PER_PAGE - 1);
  const totalPages = Math.ceil(MAX_PLAYABLE_LEVEL / LEVELS_PER_PAGE);

  const sampleCfg = getLevelConfig(startLevel);

  const levels: number[] = [];
  for (let l = startLevel; l <= endLevel; l++) {
    levels.push(l);
  }

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#0D2554]/60">
      <div className="w-full max-w-[440px] max-h-[86vh] bg-[#FFFBF2] border-2 border-[#DFC9A4] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFC9A4] bg-[#F5EAD6]">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#133D85]">
              Challenge Levels
            </h2>
            <p className="text-xs font-bold text-[#6B5A42]">
              {sampleCfg.tierName} · Levels {startLevel}–{endLevel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Level Select"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FFFBF2] border border-[#DFC9A4] text-[#133D85] hover:bg-[#EFE2CA] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2.5">
          {levels.map((lvl) => {
            const unlocked = lvl <= saveData.highestUnlockedLevel;
            const completed = saveData.completedLevels.includes(lvl);
            const isCurrent = lvl === saveData.currentLevel;

            return (
              <button
                key={lvl}
                type="button"
                disabled={!unlocked}
                onClick={() => onSelectLevel(lvl)}
                className={`relative h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 font-display transition-transform ${
                  isCurrent
                    ? 'bg-[#2279F0] border-[#60A5FA] text-white shadow-[0_3px_0_#123D85] cursor-pointer active:translate-y-0.5'
                    : completed
                      ? 'bg-[#EBF4FF] border-[#93C5FD] text-[#133D85] hover:bg-[#DBEAFE] cursor-pointer active:translate-y-0.5'
                      : unlocked
                        ? 'bg-white border-[#DFC9A4] text-[#133D85] hover:bg-[#F5EAD6] cursor-pointer active:translate-y-0.5'
                        : 'bg-[#EFE2CA]/60 border-[#DFC9A4]/60 text-[#9CA3AF] cursor-not-allowed'
                }`}
              >
                <span className="text-lg font-bold tabular-nums leading-none">
                  {lvl}
                </span>
                {completed ? (
                  <Check className="w-3.5 h-3.5 text-[#16A34A]" />
                ) : !unlocked ? (
                  <Lock className="w-3 h-3 opacity-60" />
                ) : (
                  <span className="text-[10px] font-sans font-bold opacity-80">
                    Play
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#DFC9A4] bg-[#F5EAD6]">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            className="px-3.5 py-2 rounded-xl bg-[#FFFBF2] border border-[#DFC9A4] text-[#133D85] text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="text-xs font-bold text-[#6B5A42] tabular-nums">
            Page {page + 1} / {totalPages}
          </span>

          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            className="px-3.5 py-2 rounded-xl bg-[#FFFBF2] border border-[#DFC9A4] text-[#133D85] text-xs font-bold flex items-center gap-1 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
