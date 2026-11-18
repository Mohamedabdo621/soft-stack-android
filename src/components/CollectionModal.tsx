import React, { useState } from 'react';
import { Check, Coins, Lock, X } from 'lucide-react';
import { ENVIRONMENT_THEMES, PILLOW_DESIGNS } from '../game/catalog';
import { SaveData } from '../game/types';

interface CollectionModalProps {
  saveData: SaveData;
  onClose: () => void;
  onBuyPillow: (id: string) => void;
  onSelectPillow: (id: string) => void;
  onBuyTheme: (id: string) => void;
  onSelectTheme: (id: string) => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  saveData,
  onClose,
  onBuyPillow,
  onSelectPillow,
  onBuyTheme,
  onSelectTheme,
}) => {
  const [tab, setTab] = useState<'pillows' | 'worlds'>('pillows');

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#0D2554]/60">
      <div className="w-full max-w-[440px] max-h-[86vh] bg-[#FFFBF2] border-2 border-[#DFC9A4] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFC9A4] bg-[#F5EAD6]">
          <h2 className="font-display text-2xl font-bold text-[#133D85]">
            Collection
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#FFFBF2] border border-[#DFC9A4] text-sm font-bold text-[#9A5B00] tabular-nums">
              <Coins className="w-4 h-4 text-[#F59E0B]" />
              <span>{saveData.coins}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Collection"
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FFFBF2] border border-[#DFC9A4] text-[#133D85] hover:bg-[#EFE2CA] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="p-3 bg-[#FFFBF2] border-b border-[#EFE2CA]">
          <div className="grid grid-cols-2 gap-2 p-1 bg-[#EFE2CA] rounded-2xl">
            <button
              type="button"
              onClick={() => setTab('pillows')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                tab === 'pillows'
                  ? 'bg-[#2279F0] text-white shadow-sm'
                  : 'text-[#1B2A4A] hover:bg-[#E4D1B1]'
              }`}
            >
              Pillow Designs ({saveData.unlockedPillows.length}/{PILLOW_DESIGNS.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('worlds')}
              className={`py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                tab === 'worlds'
                  ? 'bg-[#2279F0] text-white shadow-sm'
                  : 'text-[#1B2A4A] hover:bg-[#E4D1B1]'
              }`}
            >
              Worlds ({saveData.unlockedThemes.length}/{ENVIRONMENT_THEMES.length})
            </button>
          </div>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {tab === 'pillows'
            ? PILLOW_DESIGNS.map((p) => {
                const unlocked = saveData.unlockedPillows.includes(p.id);
                const selected = saveData.selectedPillowId === p.id;
                const canAfford = saveData.coins >= p.cost;

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 transition-colors ${
                      selected
                        ? 'bg-[#EBF4FF] border-[#2279F0]'
                        : 'bg-white border-[#EFE2CA]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl border-2 border-white shadow-md shrink-0"
                        style={{ background: p.previewGradient }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#133D85] truncate">
                          {p.name}
                        </div>
                        <div className="text-xs text-[#6B5A42] line-clamp-2">
                          {p.description}
                        </div>
                      </div>
                    </div>

                    {unlocked ? (
                      <button
                        type="button"
                        onClick={() => onSelectPillow(p.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                          selected
                            ? 'bg-[#2279F0] text-white'
                            : 'bg-[#EFE2CA] hover:bg-[#E4D1B1] text-[#133D85]'
                        }`}
                      >
                        {selected ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Equipped
                          </span>
                        ) : (
                          'Equip'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyPillow(p.id)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          canAfford
                            ? 'bg-[#F6BE23] hover:bg-[#E5AE19] text-[#3D2600] shadow-[0_2px_0_#B47B00] cursor-pointer'
                            : 'bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{p.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })
            : ENVIRONMENT_THEMES.map((t) => {
                const unlocked = saveData.unlockedThemes.includes(t.id);
                const selected = saveData.selectedThemeId === t.id;
                const canAfford = saveData.coins >= t.cost;

                return (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-2xl border-2 transition-colors ${
                      selected
                        ? 'bg-[#EBF4FF] border-[#2279F0]'
                        : 'bg-white border-[#EFE2CA]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl border-2 border-white shadow-md shrink-0"
                        style={{
                          background: `linear-gradient(180deg, ${t.skyTop} 0%, ${t.skyBottom} 55%, ${t.waterColor} 100%)`,
                        }}
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#133D85] truncate">
                          {t.name}
                        </div>
                        <div className="text-xs text-[#6B5A42] line-clamp-2">
                          {t.description}
                        </div>
                      </div>
                    </div>

                    {unlocked ? (
                      <button
                        type="button"
                        onClick={() => onSelectTheme(t.id)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 cursor-pointer ${
                          selected
                            ? 'bg-[#2279F0] text-white'
                            : 'bg-[#EFE2CA] hover:bg-[#E4D1B1] text-[#133D85]'
                        }`}
                      >
                        {selected ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          'Select'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!canAfford}
                        onClick={() => onBuyTheme(t.id)}
                        className={`px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                          canAfford
                            ? 'bg-[#F6BE23] hover:bg-[#E5AE19] text-[#3D2600] shadow-[0_2px_0_#B47B00] cursor-pointer'
                            : 'bg-[#E5E7EB] text-[#6B7280] cursor-not-allowed'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span className="tabular-nums">{t.cost}</span>
                      </button>
                    )}
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
};
