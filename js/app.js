/**
 * NEURODRIVE AI — MASTER APPLICATION CONTROLLER
 * Connects Computer Vision, Audio Synthesizer, UI Visualizers,
 * Dynamic SVG Animations, Event Logging, and Settings.
 */

class NeuroDriveApp {
  constructor() {
    // UI References
    this.gaugeProgress = document.getElementById('gauge-progress-circle');
    this.gaugeScoreNum = document.getElementById('gauge-score-number');
    this.masterBadge = document.getElementById('master-status-badge');
    this.masterBadgeText = document.getElementById('master-status-text');
    this.masterCard = document.getElementById('driver-status-card');
    this.statusSummary = document.getElementById('status-dynamic-summary');
    this.statusSummaryText = document.getElementById('status-summary-text');
    this.statusSummaryIcon = document.getElementById('status-summary-icon');

    // Tiers
    this.tierGreen = document.getElementById('tier-green-seg');
    this.tierYellow = document.getElementById('tier-yellow-seg');
    this.tierRed = document.getElementById('tier-red-seg');

    // Intelligence Breakdown Bars
    this.barEye = document.getElementById('bar-fill-eye');
    this.tagEye = document.getElementById('score-tag-eye');
    this.barBlink = document.getElementById('bar-fill-blink');
    this.tagBlink = document.getElementById('score-tag-blink');
    this.barYawn = document.getElementById('bar-fill-yawn');
    this.tagYawn = document.getElementById('score-tag-yawn');
    this.barNod = document.getElementById('bar-fill-nod');
    this.tagNod = document.getElementById('score-tag-nod');
    this.barPose = document.getElementById('bar-fill-pose');
    this.tagPose = document.getElementById('score-tag-pose');

    // Eye Visualizer & Telemetry
    this.badgeEyeState = document.getElementById('badge-eye-state');
    this.eyelidLeft = document.getElementById('eyelid-left-top');
    this.eyelidRight = document.getElementById('eyelid-right-top');
    this.txtLeftEye = document.getElementById('txt-left-eye-state');
    this.txtRightEye = document.getElementById('txt-right-eye-state');
    this.valEyeDuration = document.getElementById('val-eye-duration');
    this.barClosureDuration = document.getElementById('bar-closure-duration');
    this.valBlinkRate = document.getElementById('val-blink-rate');
    this.valEarRatio = document.getElementById('val-ear-ratio');
    this.valTotalBlinks = document.getElementById('val-total-blinks');

    // Mouth / Yawn Visualizer & Telemetry
    this.badgeMouthState = document.getElementById('badge-mouth-state');
    this.mouthOuter = document.getElementById('mouth-outer');
    this.mouthInner = document.getElementById('mouth-inner');
    this.txtMouthState = document.getElementById('txt-mouth-state-desc');
    this.valYawnsCount = document.getElementById('val-yawns-count');
    this.valMarRatio = document.getElementById('val-mar-ratio');
    this.valMouthDuration = document.getElementById('val-mouth-duration');
    this.barYawnDuration = document.getElementById('bar-yawn-duration');
    this.valYawnImpact = document.getElementById('val-yawn-impact');

    // HUD Badges
    this.hudFaceStatus = document.getElementById('hud-face-status');
    this.hudCamStatus = document.getElementById('hud-cam-status');
    this.hudEyeStatus = document.getElementById('hud-eye-status');
    this.hudHeadStatus = document.getElementById('hud-head-status');
    this.hudFpsTag = document.getElementById('hud-fps-tag');
    this.telLandmarkCount = document.getElementById('tel-landmark-count');
    this.telConfidenceVal = document.getElementById('tel-confidence-val');
    this.telEarVal = document.getElementById('tel-ear-val');
    this.telMarVal = document.getElementById('tel-mar-val');

    // Sensor Bar Chips
    this.chipFaceVal = document.getElementById('sensor-face-val');
    this.chipEyesVal = document.getElementById('sensor-eyes-val');
    this.chipMouthVal = document.getElementById('sensor-mouth-val');
    this.chipHeadVal = document.getElementById('sensor-head-val');
    this.chipCameraVal = document.getElementById('sensor-camera-val');
    this.chipAudioVal = document.getElementById('sensor-audio-val');

    // Alert Overlay
    this.alertOverlay = document.getElementById('critical-alert-overlay');

    // Event Log
    this.logStream = document.getElementById('alert-log-stream');
    this.countAll = document.getElementById('count-all-events');
    this.countCritical = document.getElementById('count-critical-events');
    this.countWarning = document.getElementById('count-warning-events');
    this.countInfo = document.getElementById('count-info-events');
    this.events = [];

    // State
    this.currentState = 'ALERT'; // ALERT, WARNING, DROWSY
    this.isCriticalOverlayActive = false;

    this.init();
  }

  init() {
    this.bindNavigation();
    this.bindControls();
    this.bindSettings();
    this.loadCameraDevices();
    this.setupInitialEvents();
  }

  bindNavigation() {
    const links = document.querySelectorAll('.main-nav .nav-link');
    links.forEach(link => {
      link.addEventListener('click', (e) => {
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
      });
    });

    const btnMobile = document.getElementById('btn-mobile-menu');
    const mainNav = document.getElementById('main-nav');
    if (btnMobile && mainNav) {
      btnMobile.addEventListener('click', () => {
        mainNav.classList.toggle('mobile-active');
      });
    }
  }

  bindControls() {
    // Mode Switchers
    const btnModeCam = document.getElementById('btn-mode-camera');
    const btnModeDemo = document.getElementById('btn-mode-demo');
    const btnToggleStream = document.getElementById('btn-toggle-stream');
    const btnTestBuzzer = document.getElementById('btn-test-buzzer');
    const btnHeroStart = document.getElementById('btn-hero-start-monitoring');
    const btnHeroDemo = document.getElementById('btn-hero-demo-mode');
    const btnStandbyStart = document.getElementById('btn-standby-start');
    const btnStandbyDemo = document.getElementById('btn-standby-demo');
    const btnAudioToggle = document.getElementById('btn-audio-toggle');
    const audioPillIcon = document.getElementById('audio-pill-icon');
    const audioPillText = document.getElementById('audio-pill-text');

    // Start Live Webcam
    const handleStartCamera = async () => {
      if (window.demoSimulation && window.demoSimulation.isActive) {
        window.demoSimulation.stop();
      }
      if (window.visionEngine) {
        if (!window.visionEngine.isStreaming) {
          const success = await window.visionEngine.startCamera();
          if (success) {
            btnToggleStream.classList.add('recording');
            document.getElementById('toggle-stream-text').textContent = 'STOP CAMERA';
            document.getElementById('camera-live-dot').classList.remove('inactive');
            if (this.chipCameraVal) {
              this.chipCameraVal.textContent = 'CONNECTED';
              this.chipCameraVal.className = 'chip-status status-ok';
            }
            if (this.hudCamStatus) this.hudCamStatus.textContent = 'ACTIVE';
            this.logEvent('info', 'Live camera stream started with MediaPipe face tracking.');
          }
        } else {
          window.visionEngine.stopCamera();
          btnToggleStream.classList.remove('recording');
          document.getElementById('toggle-stream-text').textContent = 'START CAMERA';
          document.getElementById('camera-live-dot').classList.add('inactive');
          const placeholder = document.getElementById('camera-placeholder');
          if (placeholder) placeholder.classList.remove('hidden');
          if (this.chipCameraVal) {
            this.chipCameraVal.textContent = 'STANDBY';
            this.chipCameraVal.className = 'chip-status';
          }
          if (this.hudCamStatus) this.hudCamStatus.textContent = 'STANDBY';
          this.logEvent('info', 'Camera stream paused.');
        }
      }
    };

    if (btnToggleStream) btnToggleStream.addEventListener('click', handleStartCamera);
    if (btnStandbyStart) btnStandbyStart.addEventListener('click', handleStartCamera);
    if (btnHeroStart) btnHeroStart.addEventListener('click', () => {
      const dashSection = document.getElementById('dashboard-section');
      if (dashSection) dashSection.scrollIntoView({ behavior: 'smooth' });
      handleStartCamera();
    });

    // Start Demo Mode
    const handleStartDemo = () => {
      if (window.visionEngine && window.visionEngine.isStreaming) {
        window.visionEngine.stopCamera();
        btnToggleStream.classList.remove('recording');
      }
      if (window.demoSimulation) {
        window.demoSimulation.start();
        const dashSection = document.getElementById('dashboard-section');
        if (dashSection) dashSection.scrollIntoView({ behavior: 'smooth' });
        if (this.chipCameraVal) {
          this.chipCameraVal.textContent = 'SIMULATING';
          this.chipCameraVal.className = 'chip-status status-ok';
        }
      }
    };

    if (btnModeDemo) btnModeDemo.addEventListener('click', handleStartDemo);
    if (btnHeroDemo) btnHeroDemo.addEventListener('click', handleStartDemo);
    if (btnStandbyDemo) btnStandbyDemo.addEventListener('click', handleStartDemo);
    if (btnModeCam) btnModeCam.addEventListener('click', () => {
      if (window.demoSimulation && window.demoSimulation.isActive) {
        window.demoSimulation.stop();
      }
    });

    // Buzzer Test Button
    if (btnTestBuzzer) {
      btnTestBuzzer.addEventListener('click', () => {
        if (window.audioAlert) {
          window.audioAlert.playChime('test');
          this.logEvent('info', 'Audio ADAS buzzer test chime verified.');
        }
      });
    }

    // Audio Mute/Toggle Header Pill
    if (btnAudioToggle) {
      btnAudioToggle.addEventListener('click', () => {
        if (window.audioAlert) {
          const isMuted = window.audioAlert.toggleMute();
          btnAudioToggle.classList.toggle('muted', isMuted);
          audioPillText.textContent = isMuted ? 'Muted' : 'Audio Ready';
          audioPillIcon.setAttribute('data-lucide', isMuted ? 'volume-x' : 'volume-2');
          if (this.chipAudioVal) {
            this.chipAudioVal.textContent = isMuted ? 'MUTED' : 'READY';
            this.chipAudioVal.className = `chip-status ${isMuted ? 'status-danger' : 'status-ok'}`;
          }
          if (window.lucide) window.lucide.createIcons();
          this.logEvent('info', isMuted ? 'Audio alarm siren muted.' : 'Audio alarm siren unmuted.');
        }
      });
    }

    // Emergency Dismiss Overlay Handlers
    const btnDismiss = document.getElementById('btn-emergency-dismiss');
    const btnMute = document.getElementById('btn-emergency-mute');

    if (btnDismiss) {
      btnDismiss.addEventListener('click', () => {
        this.dismissCriticalAlert();
        this.logEvent('info', 'Driver confirmed alertness. Critical alarm cleared.');
      });
    }

    if (btnMute) {
      btnMute.addEventListener('click', () => {
        if (window.audioAlert) {
          window.audioAlert.stopEmergencyAlert();
          window.audioAlert.setMute(true);
        }
        this.dismissCriticalAlert();
        this.logEvent('warning', 'Alarm silenced by user intervention.');
      });
    }

    // Alert Center Actions & Filter Chips
    const btnClearAlerts = document.getElementById('btn-clear-alerts');
    const btnExportLog = document.getElementById('btn-export-log');
    const filterChips = document.querySelectorAll('.filter-chip');

    if (btnClearAlerts) {
      btnClearAlerts.addEventListener('click', () => {
        this.events = [];
        this.renderEventLog();
      });
    }

    if (btnExportLog) {
      btnExportLog.addEventListener('click', () => this.exportEventLog());
    }

    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const filter = chip.getAttribute('data-filter');
        this.filterEventLog(filter);
      });
    });
  }

  bindSettings() {
    const sliderEye = document.getElementById('setting-eye-threshold');
    const valSliderEye = document.getElementById('val-setting-eye-threshold');
    const sliderScore = document.getElementById('setting-score-threshold');
    const valSliderScore = document.getElementById('val-setting-score-threshold');
    const segButtons = document.querySelectorAll('.seg-btn');
    const btnReset = document.getElementById('btn-reset-settings');

    if (sliderEye) {
      sliderEye.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        valSliderEye.textContent = `${val.toFixed(1)} s`;
        if (window.visionEngine) window.visionEngine.eyeThresholdSec = val;
      });
    }

    if (sliderScore) {
      sliderScore.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        valSliderScore.textContent = `${val} / 100`;
        if (window.visionEngine) window.visionEngine.scoreThreshold = val;
      });
    }

    segButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        segButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const sens = btn.getAttribute('data-sens');
        if (window.visionEngine) {
          window.visionEngine.sensitivity = sens;
          if (sens === 'low') {
            window.visionEngine.earThreshold = 0.17;
            window.visionEngine.marThreshold = 0.60;
          } else if (sens === 'medium') {
            window.visionEngine.earThreshold = 0.20;
            window.visionEngine.marThreshold = 0.52;
          } else if (sens === 'high') {
            window.visionEngine.earThreshold = 0.23;
            window.visionEngine.marThreshold = 0.45;
          }
        }
        this.logEvent('info', `Detection sensitivity updated to ${sens.toUpperCase()}.`);
      });
    });

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (sliderEye) {
          sliderEye.value = '2.0';
          valSliderEye.textContent = '2.0 s';
          if (window.visionEngine) window.visionEngine.eyeThresholdSec = 2.0;
        }
        if (sliderScore) {
          sliderScore.value = '60';
          valSliderScore.textContent = '60 / 100';
          if (window.visionEngine) window.visionEngine.scoreThreshold = 60;
        }
        segButtons.forEach(b => {
          b.classList.toggle('active', b.getAttribute('data-sens') === 'medium');
        });
        if (window.visionEngine) {
          window.visionEngine.earThreshold = 0.20;
          window.visionEngine.marThreshold = 0.52;
        }
        this.logEvent('info', 'System parameters reset to default factory calibration.');
      });
    }
  }

  async loadCameraDevices() {
    const select = document.getElementById('setting-camera-select');
    if (!select || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      
      select.innerHTML = '';
      if (videoInputs.length === 0) {
        select.innerHTML = '<option value="default">Default System Camera</option>';
      } else {
        videoInputs.forEach((dev, idx) => {
          const opt = document.createElement('option');
          opt.value = dev.deviceId || 'default';
          opt.textContent = dev.label || `Camera ${idx + 1} (ADAS Input)`;
          select.appendChild(opt);
        });
      }

      select.addEventListener('change', (e) => {
        if (window.visionEngine && window.visionEngine.isStreaming) {
          window.visionEngine.stopCamera();
          window.visionEngine.startCamera(e.target.value);
        }
      });
    } catch (e) {
      console.log('Camera enumerate warning:', e);
    }
  }

  setupInitialEvents() {
    this.events = [
      { time: '14:32:01', type: 'info', badge: 'INFO', msg: 'NeuroDrive AI engine initialized. Neural road network active.' },
      { time: '14:32:05', type: 'info', badge: 'INFO', msg: 'MediaPipe Face Mesh 468-point pipeline ready.' },
      { time: '14:32:08', type: 'info', badge: 'INFO', msg: 'Driver face detected in ADAS primary bounding zone.' },
      { time: '14:32:12', type: 'info', badge: 'BLINK', msg: 'Normal blink detected (Duration: 0.18s, EAR: 0.12).' },
      { time: '14:32:19', type: 'warning', badge: 'YAWN', msg: 'Yawning detected (Duration: 1.8s, MAR: 0.62). Drowsiness score +20.' },
      { time: '14:32:27', type: 'info', badge: 'RECOVERY', msg: 'Driver attention verified. Drowsiness score stabilized at 18/100.' }
    ];
    this.renderEventLog();
  }

  /**
   * Called on each frame from VisionEngine
   */
  updateTelemetry(data) {
    // 1. Update Circular Gauge
    const circumference = 427.25; // 2 * PI * 68
    const offset = circumference * (1 - data.totalScore / 100);
    if (this.gaugeProgress) {
      this.gaugeProgress.style.strokeDashoffset = offset;
    }
    if (this.gaugeScoreNum) {
      this.gaugeScoreNum.textContent = Math.round(data.totalScore);
    }

    // 2. Evaluate State Tier
    let newState = 'ALERT';
    if (data.totalScore >= (window.visionEngine ? window.visionEngine.scoreThreshold : 60)) {
      newState = 'DROWSY';
    } else if (data.totalScore >= 30) {
      newState = 'WARNING';
    }

    if (newState !== this.currentState) {
      this.currentState = newState;
      this.onStateChanged(newState, data.totalScore);
    }

    // 3. Update Status Tiers Segments
    if (this.tierGreen) this.tierGreen.classList.toggle('active', newState === 'ALERT');
    if (this.tierYellow) this.tierYellow.classList.toggle('active', newState === 'WARNING');
    if (this.tierRed) this.tierRed.classList.toggle('active', newState === 'DROWSY');

    // 4. Update Gauge Color
    if (this.gaugeProgress) {
      if (newState === 'DROWSY') {
        this.gaugeProgress.style.stroke = 'var(--color-danger)';
      } else if (newState === 'WARNING') {
        this.gaugeProgress.style.stroke = 'var(--color-warning)';
      } else {
        this.gaugeProgress.style.stroke = 'var(--color-safe)';
      }
    }

    // 5. Update Status Master Card Header
    if (this.masterBadge && this.masterBadgeText) {
      this.masterBadgeText.textContent = newState;
      this.masterBadge.className = `status-badge-chip ${newState === 'DROWSY' ? 'badge-drowsy' : (newState === 'WARNING' ? 'badge-warning' : 'badge-alert')}`;
    }

    if (this.masterCard) {
      this.masterCard.classList.toggle('state-danger', newState === 'DROWSY');
    }

    // 6. Update Status Summary Banner Text
    if (this.statusSummaryText && this.statusSummaryIcon) {
      if (newState === 'DROWSY') {
        this.statusSummaryText.textContent = 'CRITICAL: Driver is experiencing heavy drowsiness. Emergency alarm active!';
        this.statusSummaryIcon.style.color = 'var(--color-danger)';
      } else if (newState === 'WARNING') {
        this.statusSummaryText.textContent = 'WARNING: Mild fatigue indicators detected (yawning / frequent blinks).';
        this.statusSummaryIcon.style.color = 'var(--color-warning)';
      } else {
        this.statusSummaryText.textContent = 'Driver is vigilant and focused on the roadway.';
        this.statusSummaryIcon.style.color = 'var(--color-safe)';
      }
    }

    // 7. Update Intelligence Breakdown Bars
    if (this.barEye) this.barEye.style.width = `${(data.scoreEye / 40) * 100}%`;
    if (this.tagEye) this.tagEye.textContent = `+${data.scoreEye} / 40`;

    if (this.barBlink) this.barBlink.style.width = `${(data.scoreBlink / 15) * 100}%`;
    if (this.tagBlink) this.tagBlink.textContent = `+${data.scoreBlink} / 15`;

    if (this.barYawn) this.barYawn.style.width = `${(data.scoreYawn / 20) * 100}%`;
    if (this.tagYawn) this.tagYawn.textContent = `+${data.scoreYawn} / 20`;

    if (this.barNod) this.barNod.style.width = `${(data.scoreNod / 15) * 100}%`;
    if (this.tagNod) this.tagNod.textContent = `+${data.scoreNod} / 15`;

    if (this.barPose) this.barPose.style.width = `${(data.scorePose / 10) * 100}%`;
    if (this.tagPose) this.tagPose.textContent = `+${data.scorePose} / 10`;

    // 8. Update Eye Analytics Card
    if (this.valEarRatio) this.valEarRatio.textContent = data.avgEAR.toFixed(2);
    if (this.valEyeDuration) this.valEyeDuration.innerHTML = `${data.eyeClosureDuration.toFixed(2)} <span class="m-unit">sec</span>`;
    if (this.barClosureDuration) {
      const maxEyeSec = window.visionEngine ? window.visionEngine.eyeThresholdSec : 2.0;
      this.barClosureDuration.style.width = `${Math.min(100, (data.eyeClosureDuration / maxEyeSec) * 100)}%`;
    }
    if (this.valBlinkRate) this.valBlinkRate.innerHTML = `${data.blinkRate} <span class="m-unit">/ min</span>`;
    if (this.valTotalBlinks) this.valTotalBlinks.textContent = data.totalBlinks;

    const eyeStateText = data.isEyeClosed ? 'CLOSED' : 'OPEN';
    if (this.badgeEyeState) {
      this.badgeEyeState.textContent = eyeStateText;
      this.badgeEyeState.className = `card-badge-pill ${data.isEyeClosed ? 'badge-drowsy' : ''}`;
    }
    if (this.txtLeftEye) {
      this.txtLeftEye.textContent = eyeStateText;
      this.txtLeftEye.className = `eye-box-state ${data.isEyeClosed ? 'status-danger' : 'status-ok'}`;
    }
    if (this.txtRightEye) {
      this.txtRightEye.textContent = eyeStateText;
      this.txtRightEye.className = `eye-box-state ${data.isEyeClosed ? 'status-danger' : 'status-ok'}`;
    }

    // Morph SVG Eyelids
    const eyelidY = data.isEyeClosed ? 30 : 5;
    if (this.eyelidLeft) this.eyelidLeft.setAttribute('d', `M5,30 Q50,${eyelidY} 95,30`);
    if (this.eyelidRight) this.eyelidRight.setAttribute('d', `M5,30 Q50,${eyelidY} 95,30`);

    // 9. Update Yawn Analytics Card
    if (this.valMarRatio) this.valMarRatio.textContent = data.mar.toFixed(2);
    if (this.valYawnsCount) this.valYawnsCount.textContent = data.yawnsCount;
    if (this.valMouthDuration) this.valMouthDuration.innerHTML = `${data.yawnDuration.toFixed(1)} <span class="m-unit">sec</span>`;
    if (this.barYawnDuration) {
      this.barYawnDuration.style.width = `${Math.min(100, (data.yawnDuration / 2.5) * 100)}%`;
    }
    if (this.valYawnImpact) this.valYawnImpact.innerHTML = `+${data.scoreYawn} <span class="m-unit">pts</span>`;

    const mouthStateText = data.isYawning ? 'YAWNING' : 'NORMAL';
    if (this.badgeMouthState) {
      this.badgeMouthState.textContent = mouthStateText;
      this.badgeMouthState.className = `card-badge-pill ${data.isYawning ? 'badge-warning' : ''}`;
    }
    if (this.txtMouthState) {
      this.txtMouthState.textContent = data.isYawning ? 'YAWNING (FATIGUE)' : 'NORMAL (CLOSED)';
      this.txtMouthState.className = `mouth-readout-val ${data.isYawning ? 'status-warn' : 'status-ok'}`;
    }

    // Morph SVG Mouth
    const mHeight = data.isYawning ? 35 : 12;
    if (this.mouthOuter) {
      this.mouthOuter.setAttribute('d', `M15,35 Q70,${35 - mHeight} 125,35 Q70,${35 + mHeight} 15,35 Z`);
    }
    if (this.mouthInner) {
      this.mouthInner.setAttribute('d', `M30,35 Q70,${35 - mHeight * 0.7} 110,35 Q70,${35 + mHeight * 0.7} 30,35 Z`);
    }

    // 10. Update Head Pose 3D Gizmo
    if (window.headPoseGizmo) {
      window.headPoseGizmo.updatePose(data.pitch, data.yaw, data.roll);
    }

    // 11. Update Camera HUD Badges
    if (this.hudFpsTag) this.hudFpsTag.textContent = `${data.fps} FPS`;
    if (this.telEarVal) this.telEarVal.textContent = data.avgEAR.toFixed(2);
    if (this.telMarVal) this.telMarVal.textContent = data.mar.toFixed(2);
    if (this.telConfidenceVal) this.telConfidenceVal.textContent = `${data.confidence}%`;

    if (this.hudEyeStatus) {
      this.hudEyeStatus.textContent = `${eyeStateText} (EAR ${data.avgEAR.toFixed(2)})`;
      this.hudEyeStatus.className = `hud-val ${data.isEyeClosed ? 'status-red' : 'status-green'}`;
    }

    if (this.hudHeadStatus) {
      this.hudHeadStatus.textContent = `${data.pitch > 14 ? 'NODDING' : 'NORMAL'} (${data.pitch.toFixed(1)}°)`;
      this.hudHeadStatus.className = `hud-val ${data.pitch > 14 ? 'status-red' : 'status-green'}`;
    }

    // 12. Update Sensor Chips
    if (this.chipEyesVal) {
      this.chipEyesVal.textContent = eyeStateText;
      this.chipEyesVal.className = `chip-status ${data.isEyeClosed ? 'status-danger' : 'status-ok'}`;
    }
    if (this.chipMouthVal) {
      this.chipMouthVal.textContent = mouthStateText;
      this.chipMouthVal.className = `chip-status ${data.isYawning ? 'status-warn' : 'status-ok'}`;
    }
    if (this.chipHeadVal) {
      this.chipHeadVal.textContent = data.pitch > 14 ? 'NODDING' : 'STABLE';
      this.chipHeadVal.className = `chip-status ${data.pitch > 14 ? 'status-danger' : 'status-ok'}`;
    }
  }

  onStateChanged(newState, score) {
    if (newState === 'DROWSY') {
      this.triggerCriticalAlert();
      this.logEvent('critical', `CRITICAL DROWSINESS DETECTED! Fatigue score: ${Math.round(score)}/100. ADAS Level 2 intervention activated.`);
    } else if (newState === 'WARNING') {
      if (window.audioAlert) window.audioAlert.playChime('warning');
      this.logEvent('warning', `Drowsiness warning threshold reached (${Math.round(score)}/100). Driver fatigue detected.`);
    } else {
      if (this.isCriticalOverlayActive) {
        this.dismissCriticalAlert();
      }
    }
  }

  triggerCriticalAlert() {
    this.isCriticalOverlayActive = true;
    if (this.alertOverlay) {
      this.alertOverlay.classList.remove('hidden');
    }
    if (window.audioAlert) {
      window.audioAlert.startEmergencyAlert();
    }
  }

  dismissCriticalAlert() {
    this.isCriticalOverlayActive = false;
    if (this.alertOverlay) {
      this.alertOverlay.classList.add('hidden');
    }
    if (window.audioAlert) {
      window.audioAlert.stopEmergencyAlert();
    }
  }

  /**
   * Log telemetry events
   */
  logEvent(type, message) {
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    let badge = 'INFO';
    if (type === 'critical') badge = 'CRITICAL';
    else if (type === 'warning') badge = 'WARNING';

    const event = { time: timeStr, type, badge, msg: message };
    this.events.unshift(event);
    if (this.events.length > 50) this.events.pop();

    this.renderEventLog();
  }

  renderEventLog(filteredList = null) {
    if (!this.logStream) return;
    const list = filteredList || this.events;
    this.logStream.innerHTML = '';

    list.forEach(ev => {
      const row = document.createElement('div');
      row.className = `log-entry log-${ev.type}`;
      row.setAttribute('data-type', ev.type);

      const timeSpan = document.createElement('span');
      timeSpan.className = 'log-timestamp';
      timeSpan.textContent = ev.time;

      const badgeSpan = document.createElement('span');
      badgeSpan.className = `log-badge badge-${ev.type}`;
      badgeSpan.textContent = ev.badge;

      const msgSpan = document.createElement('span');
      msgSpan.className = 'log-message';
      msgSpan.textContent = ev.msg;

      row.appendChild(timeSpan);
      row.appendChild(badgeSpan);
      row.appendChild(msgSpan);
      this.logStream.appendChild(row);
    });

    // Update count badges
    if (this.countAll) this.countAll.textContent = this.events.length;
    if (this.countCritical) this.countCritical.textContent = this.events.filter(e => e.type === 'critical').length;
    if (this.countWarning) this.countWarning.textContent = this.events.filter(e => e.type === 'warning').length;
    if (this.countInfo) this.countInfo.textContent = this.events.filter(e => e.type === 'info').length;
  }

  filterEventLog(filter) {
    if (filter === 'all') {
      this.renderEventLog();
    } else {
      const filtered = this.events.filter(e => e.type === filter);
      this.renderEventLog(filtered);
    }
  }

  exportEventLog() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.events, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `neurodrive_telemetry_log_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }
}

// Global App Instance
window.addEventListener('DOMContentLoaded', () => {
  window.app = new NeuroDriveApp();
});
