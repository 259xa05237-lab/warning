/**
 * NEURODRIVE AI — ACOUSTIC ADAS ALERT SYNTHESIZER
 * Web Audio API implementation for automotive safety chimes & emergency alarms.
 */

class AudioAlertSystem {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.isUnlocked = false;
    this.isPlayingAlert = false;
    this.alertInterval = null;
    this.masterGain = null;
  }

  init() {
    if (this.audioCtx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);
      this.isUnlocked = true;
    } catch (err) {
      console.warn('Web Audio API not supported or blocked:', err);
    }
  }

  unlockContext() {
    if (!this.audioCtx) {
      this.init();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    this.isUnlocked = true;
  }

  setMute(muted) {
    this.isMuted = muted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(muted ? 0 : 0.7, this.audioCtx.currentTime);
    }
  }

  toggleMute() {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Plays a crisp, professional ADAS confirmation chime (two-tone ascending beep)
   */
  playChime(type = 'normal') {
    if (this.isMuted) return;
    this.unlockContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc1 = this.audioCtx.createOscillator();
    const osc2 = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    gainNode.connect(this.masterGain);

    if (type === 'test' || type === 'normal') {
      // Two-tone ADAS acoustic beep
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(440, now);
      osc2.frequency.exponentialRampToValueAtTime(660, now + 0.12);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.5, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.3);
      osc2.stop(now + 0.3);
    } else if (type === 'warning') {
      // Amber Warning Beep (Staccato 2-pulse)
      this.playStaccatoPulse(680, 0.14, 0);
      this.playStaccatoPulse(680, 0.14, 0.18);
    }
  }

  playStaccatoPulse(freq, duration, delay) {
    if (!this.audioCtx || this.isMuted) return;
    const start = this.audioCtx.currentTime + delay;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, start);

    gain.connect(this.masterGain);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.35, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  /**
   * Starts periodic urgent ADAS safety alert pulses (3 rapid beeps every 1.5s)
   */
  startEmergencyAlert() {
    if (this.isPlayingAlert) return;
    this.isPlayingAlert = true;
    this.unlockContext();

    const triggerPulses = () => {
      if (!this.isPlayingAlert) return;
      // 3 urgent high-pitch pulses
      this.playStaccatoPulse(1040, 0.1, 0);
      this.playStaccatoPulse(1040, 0.1, 0.14);
      this.playStaccatoPulse(1280, 0.18, 0.28);
    };

    triggerPulses();
    this.alertInterval = setInterval(triggerPulses, 1400);
  }

  stopEmergencyAlert() {
    this.isPlayingAlert = false;
    if (this.alertInterval) {
      clearInterval(this.alertInterval);
      this.alertInterval = null;
    }
  }
}

// Global instance
window.audioAlert = new AudioAlertSystem();
