/**
 * Substation SCADA Web Audio Synthesizer Engine
 * Generates procedural audio for transformer hum, breaker trip discharge,
 * switch latch clicks, arc fault zaps, and ISA-18.2 SCADA alarm sirens.
 */

class SubstationSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;

  // Transformer Hum Nodes (IEC 50Hz Grid Standard)
  private humOsc50: OscillatorNode | null = null;
  private humOsc100: OscillatorNode | null = null;
  private humOsc150: OscillatorNode | null = null;
  private humGain: GainNode | null = null;

  // Alarm Siren Nodes
  private sirenOsc1: OscillatorNode | null = null;
  private sirenOsc2: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private isSirenPlaying: boolean = false;
  private hasInteractionListener: boolean = false;

  constructor() {
    this.attachUserInteractionListener();
  }

  private attachUserInteractionListener() {
    if (typeof window === 'undefined' || this.hasInteractionListener) return;
    this.hasInteractionListener = true;

    const unlockAudio = () => {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    };

    const events = ['click', 'keydown', 'pointerdown', 'touchstart'];
    events.forEach((evt) => {
      window.addEventListener(evt, unlockAudio, { capture: true, once: true, passive: true });
    });
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopHum();
      this.stopSiren();
    } else {
      this.getContext();
      this.updateHum(80); // Resume nominal hum
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous 50Hz Fundamental + 100Hz / 150Hz Transformer Magnetic Core Hum (IEC 50Hz)
   * Dynamic volume and resonance shift with transformer load current %
   */
  public updateHum(loadPct: number) {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const loadFactor = Math.min(1.5, Math.max(0.1, loadPct / 100));

    if (!this.humOsc50) {
      try {
        this.humOsc50 = ctx.createOscillator();
        this.humOsc100 = ctx.createOscillator();
        this.humOsc150 = ctx.createOscillator();
        this.humGain = ctx.createGain();

        // Fundamental 50Hz, 100Hz magnetostriction harmonic, 150Hz core harmonic
        this.humOsc50.type = 'sine';
        this.humOsc50.frequency.setValueAtTime(50, ctx.currentTime);

        this.humOsc100.type = 'triangle';
        this.humOsc100.frequency.setValueAtTime(100, ctx.currentTime);

        this.humOsc150.type = 'sawtooth';
        this.humOsc150.frequency.setValueAtTime(150, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);

        this.humOsc50.connect(this.humGain);
        this.humOsc100.connect(this.humGain);
        this.humOsc150.connect(this.humGain);

        this.humGain.connect(filter);
        filter.connect(ctx.destination);

        this.humGain.gain.setValueAtTime(0.012 * loadFactor, ctx.currentTime);

        this.humOsc50.start();
        this.humOsc100.start();
        this.humOsc150.start();
      } catch (e) {
        console.error('Failed to start transformer hum', e);
      }
    } else if (this.humGain) {
      // Modulate volume smoothly based on grid load
      const targetGain = Math.min(0.045, 0.012 * loadFactor);
      this.humGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.2);
    }
  }

  public stopHum() {
    if (this.humOsc50) {
      try {
        this.humOsc50.stop();
        this.humOsc100?.stop();
        this.humOsc150?.stop();
      } catch {}
      this.humOsc50 = null;
      this.humOsc100 = null;
      this.humOsc150 = null;
      this.humGain = null;
    }
  }

  /**
   * Mechanical Latch / Circuit Breaker Switch Operation Click
   */
  public playSwitchClick() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.06);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } catch {}
  }

  /**
   * Heavy 132kV Vacuum / SF6 Circuit Breaker Trip Transient
   */
  public playBreakerTrip() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      // 1. Thud / Low Mech Impact
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);
      oscGain.gain.setValueAtTime(0.35, ctx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);

      // 2. High Frequency Arc Spark Noise
      const bufferSize = Math.floor(ctx.sampleRate * 0.15);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2400, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      whiteNoise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);

      whiteNoise.start();
    } catch {}
  }

  /**
   * Arc Fault Plasma Discharge Burst
   */
  public playArcFaultZap() {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const bufferSize = Math.floor(ctx.sampleRate * 0.4);
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.05);
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      noise.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {}
  }

  /**
   * SCADA Critical Emergency Dual-Tone Siren
   */
  public startSiren() {
    if (this.isMuted || this.isSirenPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.sirenOsc1 = ctx.createOscillator();
      this.sirenOsc2 = ctx.createOscillator();
      this.sirenGain = ctx.createGain();

      this.sirenOsc1.type = 'sawtooth';
      this.sirenOsc2.type = 'sine';

      this.sirenOsc1.frequency.setValueAtTime(880, ctx.currentTime);
      this.sirenOsc2.frequency.setValueAtTime(554, ctx.currentTime);

      this.sirenGain.gain.setValueAtTime(0.08, ctx.currentTime);

      this.sirenOsc1.connect(this.sirenGain);
      this.sirenOsc2.connect(this.sirenGain);
      this.sirenGain.connect(ctx.destination);

      this.sirenOsc1.start();
      this.sirenOsc2.start();
      this.isSirenPlaying = true;
    } catch {}
  }

  public stopSiren() {
    if (this.sirenOsc1) {
      try {
        this.sirenOsc1.stop();
        this.sirenOsc2?.stop();
      } catch {}
      this.sirenOsc1 = null;
      this.sirenOsc2 = null;
      this.sirenGain = null;
      this.isSirenPlaying = false;
    }
  }
}

export const soundEngine = new SubstationSoundEngine();
