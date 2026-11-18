import React, { useState } from 'react';
import { Music, Smartphone, Trash2, Volume2, X } from 'lucide-react';

interface SettingsModalProps {
  musicVolume: number;
  sfxVolume: number;
  hapticsEnabled: boolean;
  onChangeMusic: (v: number) => void;
  onChangeSfx: (v: number) => void;
  onToggleHaptics: (enabled: boolean) => void;
  onResetProgress: () => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  musicVolume,
  sfxVolume,
  hapticsEnabled,
  onChangeMusic,
  onChangeSfx,
  onToggleHaptics,
  onResetProgress,
  onClose,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#0D2554]/60">
      <div className="w-full max-w-[380px] bg-[#FFFBF2] border-2 border-[#DFC9A4] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFC9A4] bg-[#F5EAD6]">
          <h2 className="font-display text-2xl font-bold text-[#133D85]">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-[#FFFBF2] border border-[#DFC9A4] text-[#133D85] hover:bg-[#EFE2CA] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-3.5 bg-[#F5EAD6] border border-[#DFC9A4] rounded-2xl p-4">
            <label className="flex items-center justify-between gap-3 text-sm font-bold text-[#1B2A4A]">
              <span className="flex items-center gap-2">
                <Music className="w-4 h-4 text-[#2279F0]" />
                Music Volume
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={musicVolume}
                onChange={(e) => onChangeMusic(parseFloat(e.target.value))}
                className="w-36 accent-[#2279F0] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between gap-3 text-sm font-bold text-[#1B2A4A]">
              <span className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-[#2279F0]" />
                Sound Effects
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sfxVolume}
                onChange={(e) => onChangeSfx(parseFloat(e.target.value))}
                className="w-36 accent-[#2279F0] cursor-pointer"
              />
            </label>

            <div className="flex items-center justify-between gap-3 text-sm font-bold text-[#1B2A4A] pt-1 border-t border-[#DFC9A4]/70">
              <span className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#2279F0]" />
                Haptic Feedback
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={hapticsEnabled}
                onClick={() => onToggleHaptics(!hapticsEnabled)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  hapticsEnabled
                    ? 'bg-[#2279F0] text-white'
                    : 'bg-white border border-[#DFC9A4] text-[#6B5A42]'
                }`}
              >
                {hapticsEnabled ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#EFE2CA] rounded-2xl p-4 text-xs text-[#6B5A42] leading-relaxed">
            <div className="font-bold text-[#133D85] mb-1">How to Play</div>
            Tap anywhere (or press Space) to drop the moving pillow onto the tower.
            Line it up cleanly for Perfect bonuses, combo multipliers, and extra coins.
          </div>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full py-3 px-4 rounded-2xl bg-[#FFF1F2] hover:bg-[#FFE4E6] text-[#E6423B] border border-[#FECDD3] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Reset Saved Progress</span>
            </button>
          ) : (
            <div className="flex flex-col gap-2 bg-[#FFF1F2] border border-[#FECDD3] rounded-2xl p-3">
              <div className="text-xs font-bold text-[#9F1239] text-center">
                Reset all scores, coins, and unlocked pillows?
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="py-2 rounded-xl bg-white border border-[#DFC9A4] text-xs font-bold text-[#133D85] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetProgress();
                    setConfirmReset(false);
                  }}
                  className="py-2 rounded-xl bg-[#E6423B] text-white text-xs font-bold cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
