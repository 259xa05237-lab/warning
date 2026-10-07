/**
 * NEURODRIVE AI — DEMO MODE SIMULATION CONTROLLER
 * Orchestrates a step-by-step automated simulation sequence demonstrating
 * all driver drowsiness states for presentations and testing.
 */

class DemoSimulationController {
  constructor() {
    this.isActive = false;
    this.currentStep = 0;
    this.isPaused = false;
    this.timer = null;

    this.steps = [
      {
        id: 'alert',
        title: 'STAGE 1: DRIVER ALERT & FOCUSED',
        desc: 'Driver is attentive, scanning the road. Normal EAR (0.32), closed mouth, upright head pose.',
        duration: 4500,
        apply: () => {
          if (!window.visionEngine) return;
          window.visionEngine.simParams.targetEyeOpen = 1.0;
          window.visionEngine.simParams.targetMouthOpen = 0.08;
          window.visionEngine.simParams.targetPitch = 1.2;
          window.visionEngine.simParams.targetYaw = 0.5;
          window.visionEngine.simParams.targetRoll = 0.2;
        }
      },
      {
        id: 'blink',
        title: 'STAGE 2: NATURAL BLINKING DETECTED',
        desc: 'Normal rapid eye blinks (0.15s). Algorithm filters these out to prevent false alarms.',
        duration: 4000,
        apply: () => {
          if (!window.visionEngine) return;
          // Trigger quick blink pulse
          window.visionEngine.simParams.targetEyeOpen = 0.05;
          setTimeout(() => {
            if (this.isActive) window.visionEngine.simParams.targetEyeOpen = 1.0;
          }, 180);
          setTimeout(() => {
            if (this.isActive) window.visionEngine.simParams.targetEyeOpen = 0.05;
          }, 1200);
          setTimeout(() => {
            if (this.isActive) window.visionEngine.simParams.targetEyeOpen = 1.0;
          }, 1400);
        }
      },
      {
        id: 'yawn',
        title: 'STAGE 3: YAWNING DETECTED (MAR > 0.55)',
        desc: 'Driver exhibits deep fatigue yawning. Mouth opens wide for 2.5s. Drowsiness score increases by +20.',
        duration: 4500,
        apply: () => {
          if (!window.visionEngine) return;
          window.visionEngine.simParams.targetEyeOpen = 0.7; // slightly squinting
          window.visionEngine.simParams.targetMouthOpen = 0.88; // wide yawn
          window.visionEngine.simParams.targetPitch = -4.0; // slight tilt back
        }
      },
      {
        id: 'nod',
        title: 'STAGE 4: HEAD NODDING & DOWNWARD SAG',
        desc: 'Driver head sags forward (+18° pitch) due to micro-sleep episodes. Head pose engine flags warning.',
        duration: 4500,
        apply: () => {
          if (!window.visionEngine) return;
          window.visionEngine.simParams.targetMouthOpen = 0.12;
          window.visionEngine.simParams.targetEyeOpen = 0.45;
          window.visionEngine.simParams.targetPitch = 22.0; // Head dips forward
          window.visionEngine.simParams.targetRoll = 6.0;
        }
      },
      {
        id: 'closed',
        title: 'STAGE 5: PROLONGED EYE CLOSURE (> 2.0s)',
        desc: 'Driver eyes remain continuously closed past the 2.0-second safety threshold.',
        duration: 4500,
        apply: () => {
          if (!window.visionEngine) return;
          window.visionEngine.simParams.targetEyeOpen = 0.0; // eyes shut tight
          window.visionEngine.simParams.targetPitch = 18.0;
          window.visionEngine.simParams.targetYaw = -5.0;
        }
      },
      {
        id: 'alert_critical',
        title: 'STAGE 6: CRITICAL ADAS SAFETY INTERVENTION',
        desc: 'Drowsiness score spikes above 85. Acoustic siren alarms sound and visual HUD warning flashes!',
        duration: 5500,
        apply: () => {
          if (!window.visionEngine) return;
          window.visionEngine.simParams.targetEyeOpen = 0.0;
          window.visionEngine.simParams.targetPitch = 25.0;
          if (window.app) {
            window.app.triggerCriticalAlert();
          }
        }
      },
      {
        id: 'recovery',
        title: 'STAGE 7: DRIVER RECOVERED & VIGILANT',
        desc: 'Driver awakens, eyes open fully, head returns to center. System stabilizes back to ALERT status.',
        duration: 5000,
        apply: () => {
          if (!window.visionEngine) return;
          window.visionEngine.simParams.targetEyeOpen = 1.0;
          window.visionEngine.simParams.targetMouthOpen = 0.08;
          window.visionEngine.simParams.targetPitch = 0.5;
          window.visionEngine.simParams.targetYaw = 0.0;
          window.visionEngine.simParams.targetRoll = 0.0;
          if (window.app) {
            window.app.dismissCriticalAlert();
            window.app.logEvent('info', 'Driver recovered full road attention. ADAS system normal.');
          }
        }
      }
    ];

    this.bindUI();
  }

  bindUI() {
    const btnSimPrev = document.getElementById('btn-sim-prev');
    const btnSimNext = document.getElementById('btn-sim-next');
    const btnSimPlayPause = document.getElementById('btn-sim-playpause');
    const btnSimExit = document.getElementById('btn-sim-exit');

    if (btnSimPrev) btnSimPrev.addEventListener('click', () => this.prevStep());
    if (btnSimNext) btnSimNext.addEventListener('click', () => this.nextStep());
    if (btnSimPlayPause) btnSimPlayPause.addEventListener('click', () => this.togglePause());
    if (btnSimExit) btnSimExit.addEventListener('click', () => this.stop());
  }

  start() {
    this.isActive = true;
    this.currentStep = 0;
    this.isPaused = false;

    // Set Vision Engine mode
    if (window.visionEngine) {
      window.visionEngine.isDemoMode = true;
      window.visionEngine.startVisionLoop();
    }

    // Show simulation banner
    const banner = document.getElementById('simulation-banner');
    if (banner) banner.classList.remove('hidden');

    // Hide camera placeholder
    const placeholder = document.getElementById('camera-placeholder');
    if (placeholder) placeholder.classList.add('hidden');

    // Update buttons
    const btnModeDemo = document.getElementById('btn-mode-demo');
    const btnModeCam = document.getElementById('btn-mode-camera');
    if (btnModeDemo) btnModeDemo.classList.add('active');
    if (btnModeCam) btnModeCam.classList.remove('active');

    const toggleStreamText = document.getElementById('toggle-stream-text');
    if (toggleStreamText) toggleStreamText.textContent = 'DEMO RUNNING';

    this.runStep();
  }

  runStep() {
    if (!this.isActive) return;
    clearTimeout(this.timer);

    const step = this.steps[this.currentStep];
    if (!step) return;

    // Update UI description
    const descEl = document.getElementById('sim-scenario-desc');
    if (descEl) {
      descEl.textContent = `${step.title} — ${step.desc}`;
    }

    if (window.app) {
      window.app.logEvent('info', `[DEMO] ${step.title}: ${step.desc}`);
    }

    // Apply simulation transformations
    step.apply();

    // Schedule next step if not paused
    if (!this.isPaused) {
      this.timer = setTimeout(() => {
        this.currentStep = (this.currentStep + 1) % this.steps.length;
        this.runStep();
      }, step.duration);
    }
  }

  nextStep() {
    this.currentStep = (this.currentStep + 1) % this.steps.length;
    this.runStep();
  }

  prevStep() {
    this.currentStep = (this.currentStep - 1 + this.steps.length) % this.steps.length;
    this.runStep();
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const icon = document.getElementById('sim-playpause-icon');
    if (icon) {
      icon.setAttribute('data-lucide', this.isPaused ? 'play' : 'pause');
      if (window.lucide) window.lucide.createIcons();
    }

    if (!this.isPaused) {
      this.runStep();
    } else {
      clearTimeout(this.timer);
    }
  }

  stop() {
    this.isActive = false;
    clearTimeout(this.timer);

    if (window.visionEngine) {
      window.visionEngine.isDemoMode = false;
    }

    const banner = document.getElementById('simulation-banner');
    if (banner) banner.classList.add('hidden');

    const btnModeDemo = document.getElementById('btn-mode-demo');
    const btnModeCam = document.getElementById('btn-mode-camera');
    if (btnModeDemo) btnModeDemo.classList.remove('active');
    if (btnModeCam) btnModeCam.classList.add('active');

    const toggleStreamText = document.getElementById('toggle-stream-text');
    if (toggleStreamText) toggleStreamText.textContent = 'START CAMERA';

    if (window.app) {
      window.app.dismissCriticalAlert();
    }
  }
}

window.demoSimulation = new DemoSimulationController();
