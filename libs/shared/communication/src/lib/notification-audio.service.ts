import { Injectable, signal } from '@angular/core';

export interface NotificationAudioSettings {
  enabled: boolean;
  volume: number;
  profile: 'standard' | 'critical_only' | 'silent';
}

export const DEFAULT_AUDIO_SETTINGS: NotificationAudioSettings = {
  enabled: true,
  volume: 70,
  profile: 'standard',
};

const STORAGE_KEY = 'mnara_notification_audio';

@Injectable({ providedIn: 'root' })
export class NotificationAudioService {
  readonly settings = signal<NotificationAudioSettings>(this.loadSettings());

  private ctx: AudioContext | null = null;
  private buffers: Record<string, AudioBuffer> = {};
  private unlocked = false;

  private readonly alertUrl = '/sounds/notifications.wav';
  private readonly criticalUrl = '/sounds/critical-alarm.mp3';

  init(): void {
    if (!this.unlocked) {
      const unlock = (): void => {
        if (this.ctx?.state === 'suspended') {
          this.ctx.resume();
        }
        this.unlocked = true;
        document.removeEventListener('pointerdown', unlock);
        document.removeEventListener('keydown', unlock);
      };
      document.addEventListener('pointerdown', unlock);
      document.addEventListener('keydown', unlock);
    }
  }

  playAlert(): void {
    const s = this.settings();
    if (!s.enabled || s.profile === 'silent' || s.profile === 'critical_only') return;
    this.playFile(this.alertUrl, s.volume / 100);
  }

  playCriticalAlert(): void {
    const s = this.settings();
    if (!s.enabled || s.profile === 'silent') return;
    const vol = s.volume / 100;

    this.playFile(this.criticalUrl, vol) || this.playCriticalOscillator(vol);
  }

  updateSettings(partial: Partial<NotificationAudioSettings>): void {
    this.settings.update((s) => {
      const next = { ...s, ...partial };
      this.persistSettings(next);
      return next;
    });
  }

  resetSettings(): void {
    this.settings.set(DEFAULT_AUDIO_SETTINGS);
    this.persistSettings(DEFAULT_AUDIO_SETTINGS);
  }

  private playFile(url: string, volume: number): boolean {
    try {
      this.ensureCtx();
      if (!this.ctx) return false;
      this.resumeCtx();

      if (this.buffers[url]) {
        this.playBuffer(this.buffers[url], volume);
        return true;
      }

      this.loadBuffer(url).then((buf) => {
        if (buf) {
          this.buffers[url] = buf;
          this.playBuffer(buf, volume);
        }
      });
      return true;
    } catch {
      return false;
    }
  }

  private playBuffer(buf: AudioBuffer, volume: number): void {
    if (!this.ctx) return;
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = buf;
    src.connect(gain);
    gain.connect(this.ctx.destination);
    gain.gain.value = volume;
    src.start();
  }

  private async loadBuffer(url: string): Promise<AudioBuffer | null> {
    if (!this.ctx) return null;
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const arrayBuf = await resp.arrayBuffer();
      return this.ctx.decodeAudioData(arrayBuf);
    } catch {
      return null;
    }
  }

  private playCriticalOscillator(volume: number): void {
    this.ensureCtx();
    if (!this.ctx) return;
    this.resumeCtx();

    const now = this.ctx.currentTime;

    [880, 660, 880, 660].forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.type = 'square';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, now + i * 0.2);
      gain.gain.setValueAtTime(volume, now + i * 0.2 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.2 + 0.18);
      osc.start(now + i * 0.2);
      osc.stop(now + i * 0.2 + 0.19);
    });
  }

  private ensureCtx(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
    }
  }

  private resumeCtx(): void {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private loadSettings(): NotificationAudioSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return { ...DEFAULT_AUDIO_SETTINGS, ...JSON.parse(raw) };
      }
    } catch { /* ignore */ }
    return { ...DEFAULT_AUDIO_SETTINGS };
  }

  private persistSettings(s: NotificationAudioSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch { /* ignore */ }
  }
}
