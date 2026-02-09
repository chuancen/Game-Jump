
class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled: boolean = true;
  
  // Music state
  private musicRunning: boolean = false;
  private musicTimer: number | null = null;
  private beatCount: number = 0;
  private activeMusicNodes: AudioNode[] = [];

  private init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, endFreq?: number) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (endFreq) {
      osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + duration);
    }
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  public toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopMusic();
  }

  public startMusic() {
    this.init();
    if (this.musicRunning || !this.enabled || !this.ctx) return;
    this.musicRunning = true;
    this.beatCount = 0;
    
    const tempo = 125; // BPM
    const beatDuration = 60 / tempo;
    
    const nextBeat = () => {
      if (!this.musicRunning || !this.ctx) return;
      
      const now = this.ctx.currentTime;
      this.playBeat(this.beatCount, now);
      
      this.beatCount = (this.beatCount + 1) % 16;
      this.musicTimer = window.setTimeout(nextBeat, beatDuration * 250); // quarter beats
    };
    
    nextBeat();
  }

  public stopMusic() {
    this.musicRunning = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
    // Fade out active nodes
    this.activeMusicNodes.forEach(node => {
        if (node instanceof GainNode) {
            node.gain.exponentialRampToValueAtTime(0.001, this.ctx!.currentTime + 0.5);
        }
    });
    this.activeMusicNodes = [];
  }

  private playBeat(beat: number, time: number) {
    if (!this.ctx || !this.masterGain) return;

    // Bassline pattern (C Minor)
    // 0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
    // C1 C1 Eb1 C1 G1 G1 C1 Eb1 ...
    const bassScale = [65.41, 65.41, 77.78, 65.41, 98.00, 98.00, 65.41, 77.78];
    const bassFreq = bassScale[Math.floor(beat / 2) % bassScale.length];

    if (beat % 2 === 0) {
      this.createSynthNote(bassFreq, 'sawtooth', 0.4, 0.08, time);
    }

    // Lead melody pattern
    const melodyScale = [130.81, 0, 155.56, 196.00, 0, 130.81, 261.63, 0];
    const melodyFreq = melodyScale[beat % melodyScale.length];
    
    if (melodyFreq > 0 && beat % 4 !== 0) {
       this.createSynthNote(melodyFreq * 2, 'square', 0.1, 0.05, time);
    }
    
    // Ambient pad on every 8 beats
    if (beat % 8 === 0) {
        this.createSynthNote(130.81, 'triangle', 0.05, 1.5, time);
    }
  }

  private createSynthNote(freq: number, type: OscillatorType, volume: number, duration: number, time: number) {
    const osc = this.ctx!.createOscillator();
    const gain = this.ctx!.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, time);
    
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(volume, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    
    osc.connect(gain);
    gain.connect(this.masterGain!);
    
    osc.start(time);
    osc.stop(time + duration);
    
    this.activeMusicNodes.push(gain);
  }

  public playJump() {
    this.init();
    this.playTone(150, 'triangle', 0.1, 400);
  }

  public playSpring() {
    this.init();
    this.playTone(100, 'sawtooth', 0.3, 1200);
  }

  public playCoin() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    [987.77, 1318.51].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.1, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.1);
      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.1);
    });
  }

  public playDeath() {
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.playTone(100, 'sawtooth', 0.5, 40);
    
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noise.start();
  }

  public playPowerup() {
    this.init();
    this.playTone(440, 'sine', 0.4, 880);
  }

  public playClick() {
    this.init();
    this.playTone(800, 'sine', 0.05, 200);
  }

  public playTeleport() {
    this.init();
    this.playTone(800, 'square', 0.2, 50);
  }

  public playSlam() {
    this.init();
    this.playTone(80, 'sawtooth', 0.4, 20);
  }
}

export const sfx = new AudioService();
