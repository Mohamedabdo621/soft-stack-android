// Procedural Web Audio API sound & relaxing music synthesizer (zero external audio files)

const PENTATONIC_FREQS = [
  261.63, // C4
  293.66, // D4
  329.63, // E4
  392.00, // G4
  440.00, // A4
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.00, // A5
  1046.5, // C6
];

const AMBIENT_CHORDS = [
  [261.63, 329.63, 392.00, 493.88], // Cmaj7
  [220.00, 261.63, 329.63, 392.00], // Am7
  [174.61, 220.00, 261.63, 329.63], // Fmaj7
  [196.00, 246.94, 293.66, 392.00], // G6
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private musicTimer: number | null = null;
  private chordIndex = 0;
  private noteStep = 0;
  private sfxVol = 0.8;
  private musicVol = 0.45;
  private isMusicRunning = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVol;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVol * 0.35;
      this.musicGain.connect(this.ctx.destination);

      // Pre-build soft white-noise buffer for fabric puff sound
      const sampleRate = this.ctx.sampleRate;
      const length = Math.floor(sampleRate * 0.25);
      this.noiseBuffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.06));
      }
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public setVolumes(music: number, sfx: number): void {
    this.musicVol = Math.max(0, Math.min(1, music));
    this.sfxVol = Math.max(0, Math.min(1, sfx));
    if (this.ctx && this.sfxGain && this.musicGain) {
      const now = this.ctx.currentTime;
      this.sfxGain.gain.setTargetAtTime(this.sfxVol, now, 0.04);
      this.musicGain.gain.setTargetAtTime(this.musicVol * 0.35, now, 0.08);
    }
  }

  public startMusic(): void {
    if (this.isMusicRunning) return;
    this.isMusicRunning = true;
    const scheduleNext = () => {
      if (!this.isMusicRunning) return;
      if (this.ctx && this.ctx.state === 'running' && this.musicGain && this.musicVol > 0.01) {
        const chord = AMBIENT_CHORDS[this.chordIndex % AMBIENT_CHORDS.length];
        const freq = chord[this.noteStep % chord.length];
        this.playSoftMarimbaNote(freq, 0.22, 1.4);

        if (this.noteStep === 0) {
          // Gentle warm pad root
          this.playWarmPadNote(chord[0] * 0.5, 0.18, 2.8);
        }

        this.noteStep++;
        if (this.noteStep >= 4) {
          this.noteStep = 0;
          this.chordIndex++;
        }
      }
      this.musicTimer = window.setTimeout(scheduleNext, 780);
    };
    scheduleNext();
  }

  public stopMusic(): void {
    this.isMusicRunning = false;
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playSoftMarimbaNote(freq: number, volume: number, duration: number): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private playWarmPadNote(freq: number, volume: number, duration: number): void {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(380, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  public playDropSwoosh(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playPillowLand(streak: number, isPerfect: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const now = ctx.currentTime;

    // 1. Soft fabric puff (low-pass filtered noise)
    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(520, now);
      const nGain = ctx.createGain();
      nGain.gain.setValueAtTime(0.22, now);
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      noise.connect(filter);
      filter.connect(nGain);
      nGain.connect(this.sfxGain);
      noise.start(now);
    }

    // 2. Soft squishy cushion thump
    const thump = ctx.createOscillator();
    const tGain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(135, now);
    thump.frequency.exponentialRampToValueAtTime(68, now + 0.14);
    tGain.gain.setValueAtTime(0.32, now);
    tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
    thump.connect(tGain);
    tGain.connect(this.sfxGain);
    thump.start(now);
    thump.stop(now + 0.18);

    // 3. Pleasant musical marimba chime ascending with streak
    const noteIndex = Math.min(PENTATONIC_FREQS.length - 1, isPerfect ? streak : Math.max(0, streak % 5));
    const baseFreq = PENTATONIC_FREQS[noteIndex];

    const chime = ctx.createOscillator();
    const cGain = ctx.createGain();
    chime.type = 'triangle';
    chime.frequency.setValueAtTime(baseFreq, now);
    cGain.gain.setValueAtTime(isPerfect ? 0.24 : 0.14, now);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + (isPerfect ? 0.55 : 0.32));
    chime.connect(cGain);
    cGain.connect(this.sfxGain);
    chime.start(now);
    chime.stop(now + 0.58);

    // 4. Perfect placement sparkle harmonic
    if (isPerfect) {
      const sparkle = ctx.createOscillator();
      const sGain = ctx.createGain();
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(baseFreq * 1.5, now + 0.04);
      sGain.gain.setValueAtTime(0.14, now + 0.04);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      sparkle.connect(sGain);
      sGain.connect(this.sfxGain);
      sparkle.start(now + 0.04);
      sparkle.stop(now + 0.5);
    }
  }

  public playCoin(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const now = ctx.currentTime;

    [987.77, 1318.51].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.16, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.24);
    });
  }

  public playLevelComplete(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const t = now + i * 0.1;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.58);
    });
  }

  public playGameOver(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const now = ctx.currentTime;
    const notes = [392.0, 329.63, 261.63];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const t = now + i * 0.14;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.45);
    });
  }

  public playButtonTap(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);
    gain.gain.setValueAtTime(0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

export const soundEngine = new SoundEngine();
