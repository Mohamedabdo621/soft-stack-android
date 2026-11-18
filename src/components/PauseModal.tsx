import React from 'react';
import { Home, Play, RotateCcw, Volume2, Music } from 'lucide-react';

interface PauseModalProps {
  musicVolume: number;
  sfxVolume: number;
  onChangeMusic: (v: number) => void;
  onChangeSfx: (v: number) => void;
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  musicVolume,
  sfxVolume,
  onChangeMusic,
  onChangeSfx,
  onResume,
  onRestart,
  onMainMenu,
}) => {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-[#0D2554]/60"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="w-full max-w-[360px] bg-[#FFFBF2] border-2 border-[#DFC9A4] rounded-3xl p-6 shadow-2xl flex flex-col gap-5">
        <h2 className="font-display text-3xl font-bold text-[#133D85] text-center">
          Paused
        </h2>

        {/* Sound Quick Controls */}
        <div className="flex flex-col gap-3 bg-[#F5EAD6] border border-[#DFC9A4] rounded-2xl p-4">
          <label className="flex items-center justify-between gap-3 text-sm font-bold text-[#1B2A4A]">
            <span className="flex items-center gap-2 shrink-0">
              <Music className="w-4 h-4 text-[#2279F0]" />
              Music
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
            <span className="flex items-center gap-2 shrink-0">
              <Volume2 className="w-4 h-4 text-[#2279F0]" />
              SFX
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
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3.5 px-5 rounded-2xl bg-[#2279F0] hover:bg-[#1B6AD9] text-white font-display text-xl font-bold shadow-[0_4px_0_#123D85] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>Resume</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-5 rounded-2xl bg-[#F6BE23] hover:bg-[#E5AE19] text-[#3D2600] font-bold text-base shadow-[0_4px_0_#B47B00] active:translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>

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
