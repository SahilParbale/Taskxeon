// TaskFlow Enterprise Audio & Synthesizer Engine
// Generates crystal-clear, high-fidelity notification ring tones and chimes
// using the Web Audio API without requiring external MP3 assets.

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('taskflow_sound_enabled');
      this.soundEnabled = saved !== null ? saved === 'true' : true;
    }
  }

  // Ensure AudioContext is initialized and resumed upon user gesture
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('taskflow_sound_enabled', String(enabled));
    }
  }

  // Play synthesized tone
  public play(tone: 'chime' | 'ring' | 'success' | 'message' | 'alert' = 'chime') {
    if (!this.soundEnabled) return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      switch (tone) {
        case 'ring':
          this.playRingTone(ctx, now);
          break;
        case 'success':
          this.playSuccessChime(ctx, now);
          break;
        case 'message':
          this.playMessageBubble(ctx, now);
          break;
        case 'alert':
          this.playAlertTone(ctx, now);
          break;
        case 'chime':
        default:
          this.playEnterpriseChime(ctx, now);
          break;
      }
    } catch (e) {
      console.warn('[SoundManager] Audio playback error:', e);
    }
  }

  // 1. Sleek Enterprise Tri-Tone Chime (Slack/Apple grade: D5 -> A5 -> D6)
  private playEnterpriseChime(ctx: AudioContext, startTime: number) {
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, i) => {
      const noteTime = startTime + i * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, noteTime);
      gain.gain.linearRampToValueAtTime(0.28, noteTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.46);
    });
  }

  // 2. Real Notification Ring (Vibrant double corporate chime bell)
  private playRingTone(ctx: AudioContext, startTime: number) {
    // Two resonant ring pulses
    [0, 0.16].forEach(delay => {
      const pulseTime = startTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, pulseTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880.0, pulseTime + 0.08); // Sweeps to A5

      gain.gain.setValueAtTime(0, pulseTime);
      gain.gain.linearRampToValueAtTime(0.32, pulseTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, pulseTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(pulseTime);
      osc.stop(pulseTime + 0.42);
    });
  }

  // 3. Upbeat Success Chime (C5 -> E5 -> G5 -> C6)
  private playSuccessChime(ctx: AudioContext, startTime: number) {
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    freqs.forEach((freq, idx) => {
      const t = startTime + idx * 0.06;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.25, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    });
  }

  // 4. Soft Message Water-Drop / Pop Tone
  private playMessageBubble(ctx: AudioContext, startTime: number) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, startTime);
    osc.frequency.exponentialRampToValueAtTime(880, startTime + 0.08);

    gain.gain.setValueAtTime(0.3, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + 0.19);
  }

  // 5. Urgent Alert Ring Tone (high attention)
  private playAlertTone(ctx: AudioContext, startTime: number) {
    [0, 0.12, 0.24].forEach(delay => {
      const t = startTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(987.77, t); // B5

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.1);
    });
  }
}

export const soundManager = new SoundManager();
