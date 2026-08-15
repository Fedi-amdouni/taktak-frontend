/**
 * Web Audio API synthesizer for the TakTak Roulette
 * Creates realistic mechanical clicks, ticking slowdowns, and celebratory fanfare
 * without needing external MP3/WAV assets.
 */

class RouletteAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check local storage for mute preference
    const stored = localStorage.getItem('taktak_roulette_muted');
    this.isMuted = stored === 'true';
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('taktak_roulette_muted', String(muted));
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Plays a sharp mechanical wheel click sound.
   * SpeedFactor (0 to 1) raises pitch and punchiness slightly for faster rotation.
   */
  public playClick(speedFactor = 0.5) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sharp transient click with mechanical resonant frequency
      const freq = 600 + speedFactor * 500;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.04);
    } catch {
      // Audio might be blocked by browser policy until user gesture
    }
  }

  /**
   * Plays a celebratory victory fanfare when the loser / chosen player is picked!
   */
  public playFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Arpeggio notes: C5, E5, G5, C6
      const notes = [523.25, 659.25, 783.99, 1046.5];
      const durations = [0.12, 0.12, 0.14, 0.45];
      let timeOffset = 0;

      notes.forEach((freq, i) => {
        if (!this.ctx) return;
        const noteTime = now + timeOffset;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = i === notes.length - 1 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.25, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + durations[i]);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + durations[i] + 0.05);

        timeOffset += durations[i] * 0.85;
      });
    } catch {
      // Audio error catch
    }
  }
}

export const rouletteAudio = new RouletteAudio();
