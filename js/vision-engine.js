/**
 * NEURODRIVE AI — COMPUTER VISION & BIOMETRIC EXTRACTION ENGINE
 * Handles MediaPipe 468 FaceMesh Landmark detection, EAR, MAR, Head Pose,
 * and high-fidelity Synthetic ADAS Driver Rendering.
 */

class VisionEngine {
  constructor() {
    this.video = document.getElementById('webcam-video');
    this.canvas = document.getElementById('vision-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    
    // State
    this.isStreaming = false;
    this.isDemoMode = false;
    this.stream = null;
    this.faceMesh = null;
    this.cameraUtils = null;
    this.lastFrameTime = performance.now();
    this.fps = 30;
    this.confidence = 98.6;

    // Biometric Metrics
    this.leftEAR = 0.32;
    this.rightEAR = 0.32;
    this.avgEAR = 0.32;
    this.mar = 0.12;
    this.pitch = 2.4;
    this.yaw = -1.8;
    this.roll = 0.7;

    // Fatigue Counters & Timers
    this.eyeClosedSince = null;
    this.eyeClosureDuration = 0;
    this.totalBlinks = 0;
    this.blinkTimestamps = [];
    this.blinkRate = 14;
    this.isEyeCurrentlyClosed = false;

    this.yawnActiveSince = null;
    this.yawnDuration = 0;
    this.totalYawns = 0;
    this.isCurrentlyYawning = false;

    this.nodActiveSince = null;
    this.totalNods = 0;
    this.isCurrentlyNodding = false;

    // User Settings (Loaded from App)
    this.eyeThresholdSec = 2.0;
    this.scoreThreshold = 60;
    this.earThreshold = 0.20; // EAR below this is considered closed
    this.marThreshold = 0.52; // MAR above this is yawning
    this.sensitivity = 'medium';

    // Synthetic Avatar Simulation Params
    this.simParams = {
      eyeOpenFactor: 1.0, // 1 = open, 0 = closed
      mouthOpenFactor: 0.1, // 0 = closed, 1 = wide yawn
      headPitch: 0,
      headYaw: 0,
      headRoll: 0,
      targetEyeOpen: 1.0,
      targetMouthOpen: 0.1,
      targetPitch: 0,
      targetYaw: 0,
      targetRoll: 0
    };

    // Landmark Cache
    this.lastLandmarks = null;

    this.initMediaPipe();
    this.bindCanvasResize();
  }

  bindCanvasResize() {
    window.addEventListener('resize', () => this.resizeCanvas(), { passive: true });
    this.resizeCanvas();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width * (window.devicePixelRatio || 1);
    this.canvas.height = rect.height * (window.devicePixelRatio || 1);
    if (this.ctx) {
      this.ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    }
  }

  async initMediaPipe() {
    if (window.FaceMesh) {
      try {
        this.faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        this.faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6
        });

        this.faceMesh.onResults((results) => this.onMediaPipeResults(results));
        console.log('MediaPipe FaceMesh successfully initialized.');
      } catch (err) {
        console.warn('FaceMesh initialization fallback:', err);
      }
    }
  }

  /**
   * Start Live Webcam Streaming
   */
  async startCamera(deviceId = null) {
    if (this.isStreaming) return;

    const constraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user'
      },
      audio: false
    };

    if (deviceId && deviceId !== 'default') {
      constraints.video.deviceId = { exact: deviceId };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.video.srcObject = this.stream;
      await this.video.play();
      this.video.classList.add('active');
      this.isStreaming = true;
      this.isDemoMode = false;

      // Hide placeholder
      const placeholder = document.getElementById('camera-placeholder');
      if (placeholder) placeholder.classList.add('hidden');

      // Start processing loop
      this.startVisionLoop();
      return true;
    } catch (err) {
      console.error('Camera access error:', err);
      const permBanner = document.getElementById('camera-permission-banner');
      if (permBanner) {
        permBanner.classList.remove('hidden');
        document.getElementById('camera-alert-msg').textContent = `Camera access error: ${err.message || 'Permission denied'}. Falling back to simulation.`;
      }
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video.classList.remove('active');
    }
    this.isStreaming = false;
  }

  startVisionLoop() {
    const processFrame = async () => {
      if (!this.isStreaming && !this.isDemoMode) return;

      const now = performance.now();
      const delta = now - this.lastFrameTime;
      this.lastFrameTime = now;
      this.fps = Math.round(1000 / Math.max(delta, 1));

      if (this.isStreaming && this.video.readyState >= 2 && this.faceMesh) {
        try {
          await this.faceMesh.send({ image: this.video });
        } catch (e) {
          // Frame skip handling
        }
      } else if (this.isDemoMode || !this.isStreaming) {
        // Synthetic processing frame
        this.processSyntheticFrame();
      }

      requestAnimationFrame(processFrame);
    };

    requestAnimationFrame(processFrame);
  }

  /**
   * Calculate Euclidean distance between 2 3D landmarks
   */
  dist3D(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
  }

  /**
   * MediaPipe 468 Landmark Result Callback
   */
  onMediaPipeResults(results) {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;

    this.ctx.clearRect(0, 0, w, h);

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      this.lastLandmarks = landmarks;

      // Extract EAR for Left and Right Eyes
      // Left eye landmark indices: [33, 160, 158, 133, 153, 144]
      // Right eye landmark indices: [362, 385, 387, 263, 373, 380]
      const leftEAR = this.calcEAR(landmarks, 33, 160, 158, 133, 153, 144);
      const rightEAR = this.calcEAR(landmarks, 362, 385, 387, 263, 373, 380);
      this.leftEAR = leftEAR;
      this.rightEAR = rightEAR;
      this.avgEAR = (leftEAR + rightEAR) / 2;

      // Extract MAR (Mouth Aspect Ratio)
      // Top lip: 13, Bottom lip: 14, Left mouth corner: 78, Right corner: 308
      const topLip = landmarks[13];
      const botLip = landmarks[14];
      const leftMouth = landmarks[78];
      const rightMouth = landmarks[308];
      const mouthVert = this.dist3D(topLip, botLip);
      const mouthHoriz = this.dist3D(leftMouth, rightMouth);
      this.mar = mouthHoriz > 0 ? (mouthVert / mouthHoriz) : 0.12;

      // Estimate Head Pose (Pitch, Yaw, Roll)
      const noseTip = landmarks[1];
      const chin = landmarks[152];
      const eyeL = landmarks[33];
      const eyeR = landmarks[263];

      // Pitch (Tilt forward/back): dy of nose vs chin
      this.pitch = ((chin.y - noseTip.y) - 0.22) * 90;
      // Yaw (Turn left/right): dx of nose relative to eye midpoint
      const eyeMidX = (eyeL.x + eyeR.x) / 2;
      this.yaw = (noseTip.x - eyeMidX) * 120;
      // Roll (Tilt side to side): angle of eye line
      this.roll = Math.atan2(eyeR.y - eyeL.y, eyeR.x - eyeL.x) * (180 / Math.PI);

      // Render futuristic HUD overlays on canvas
      this.drawADASMeshOverlays(landmarks, w, h);

      // Evaluate Drowsiness Metrics
      this.updateBiometrics();
    } else {
      // No face detected in frame
      this.confidence = 0;
      this.drawSearchReticle(w, h);
    }
  }

  /**
   * Standard Soukupova & Cech Eye Aspect Ratio (EAR)
   */
  calcEAR(landmarks, p1, p2, p3, p4, p5, p6) {
    const pt1 = landmarks[p1];
    const pt2 = landmarks[p2];
    const pt3 = landmarks[p3];
    const pt4 = landmarks[p4];
    const pt5 = landmarks[p5];
    const pt6 = landmarks[p6];

    const v1 = this.dist3D(pt2, pt6);
    const v2 = this.dist3D(pt3, pt5);
    const h = this.dist3D(pt1, pt4);

    return h > 0 ? (v1 + v2) / (2.0 * h) : 0.3;
  }

  /**
   * Synthetic Frame Generator for Demo Simulation / Fallback
   */
  processSyntheticFrame() {
    if (!this.canvas || !this.ctx) return;
    const w = this.canvas.parentElement.clientWidth;
    const h = this.canvas.parentElement.clientHeight;

    this.ctx.clearRect(0, 0, w, h);

    // Smoothly interpolate synthetic parameters
    const p = this.simParams;
    p.eyeOpenFactor += (p.targetEyeOpen - p.eyeOpenFactor) * 0.25;
    p.mouthOpenFactor += (p.targetMouthOpen - p.mouthOpenFactor) * 0.15;
    p.headPitch += (p.targetPitch - p.headPitch) * 0.12;
    p.headYaw += (p.targetYaw - p.headYaw) * 0.12;
    p.headRoll += (p.targetRoll - p.headRoll) * 0.12;

    // Derived biometric values
    this.leftEAR = 0.04 + p.eyeOpenFactor * 0.28;
    this.rightEAR = 0.04 + p.eyeOpenFactor * 0.28;
    this.avgEAR = (this.leftEAR + this.rightEAR) / 2;
    this.mar = 0.10 + p.mouthOpenFactor * 0.65;
    this.pitch = p.headPitch;
    this.yaw = p.headYaw;
    this.roll = p.headRoll;

    // Draw high-tech Synthetic Driver Face on Canvas
    this.drawSyntheticDriverFace(w, h, p);

    // Evaluate Drowsiness Metrics
    this.updateBiometrics();
  }

  /**
   * Draws a futuristic HUD wireframe & ADAS markers over the live camera or avatar
   */
  drawADASMeshOverlays(landmarks, w, h) {
    const ctx = this.ctx;
    ctx.save();

    // Mirror horizontal coordinates to match mirrored video element
    ctx.translate(w, 0);
    ctx.scale(-1, 1);

    // Compute face bounding box
    let minX = 1, minY = 1, maxX = 0, maxY = 0;
    landmarks.forEach(pt => {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    });

    const bx = minX * w - 15;
    const by = minY * h - 20;
    const bw = (maxX - minX) * w + 30;
    const bh = (maxY - minY) * h + 35;

    // Draw ADAS Face Bounding Box with Cyan Corner Accents
    ctx.strokeStyle = this.avgEAR < this.earThreshold ? 'rgba(239, 68, 68, 0.75)' : 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(bx, by, bw, bh);

    // Corner brackets
    const cLen = 14;
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2.5;

    // Top Left
    ctx.beginPath(); ctx.moveTo(bx, by + cLen); ctx.lineTo(bx, by); ctx.lineTo(bx + cLen, by); ctx.stroke();
    // Top Right
    ctx.beginPath(); ctx.moveTo(bx + bw - cLen, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cLen); ctx.stroke();
    // Bottom Left
    ctx.beginPath(); ctx.moveTo(bx, by + bh - cLen); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cLen, by + bh); ctx.stroke();
    // Bottom Right
    ctx.beginPath(); ctx.moveTo(bx + bw - cLen, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cLen); ctx.stroke();

    // Draw Eye Contours
    this.drawPathIndices(ctx, landmarks, [33, 160, 158, 133, 153, 144, 33], w, h, '#00f0ff', 1.5);
    this.drawPathIndices(ctx, landmarks, [362, 385, 387, 263, 373, 380, 362], w, h, '#00f0ff', 1.5);

    // Draw Lip Contour
    this.drawPathIndices(ctx, landmarks, [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95, 78, 61], w, h, this.mar > this.marThreshold ? '#f59e0b' : 'rgba(56, 189, 248, 0.7)', 1.5);

    // Draw Face Oval Wireframe
    const ovalIndices = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10];
    this.drawPathIndices(ctx, landmarks, ovalIndices, w, h, 'rgba(56, 189, 248, 0.25)', 1);

    // Draw 3D Nose Direction Ray
    const nose = landmarks[1];
    ctx.beginPath();
    ctx.moveTo(nose.x * w, nose.y * h);
    ctx.lineTo(nose.x * w + this.yaw * 1.5, nose.y * h + this.pitch * 1.5);
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  drawPathIndices(ctx, landmarks, indices, w, h, strokeColor, lineWidth) {
    ctx.beginPath();
    indices.forEach((idx, i) => {
      const pt = landmarks[idx];
      if (!pt) return;
      if (i === 0) ctx.moveTo(pt.x * w, pt.y * h);
      else ctx.lineTo(pt.x * w, pt.y * h);
    });
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  /**
   * High-tech Synthetic Driver Avatar renderer
   */
  drawSyntheticDriverFace(w, h, params) {
    const ctx = this.ctx;
    const cx = w * 0.5 + params.headYaw * 1.8;
    const cy = h * 0.5 + params.headPitch * 1.8;
    const faceW = Math.min(w, h) * 0.38;
    const faceH = faceW * 1.35;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((params.headRoll * Math.PI) / 180);

    // Hologram Driver Silhouette
    ctx.beginPath();
    ctx.ellipse(0, 0, faceW * 0.72, faceH * 0.72, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(6, 21, 43, 0.65)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bounding Box
    ctx.strokeStyle = params.eyeOpenFactor < 0.2 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 240, 255, 0.6)';
    ctx.strokeRect(-faceW * 0.85, -faceH * 0.85, faceW * 1.7, faceH * 1.7);

    // Eyes
    const eyeDist = faceW * 0.38;
    const eyeY = -faceH * 0.15;
    const eyeW = faceW * 0.28;
    const eyeH = Math.max(3, eyeW * 0.5 * params.eyeOpenFactor);

    [-1, 1].forEach(side => {
      const ex = side * eyeDist;
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW * 0.5, eyeH * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(8, 29, 53, 0.85)';
      ctx.fill();
      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      if (params.eyeOpenFactor > 0.3) {
        // Pupil
        ctx.beginPath();
        ctx.arc(ex, eyeY, 4 * params.eyeOpenFactor, 0, Math.PI * 2);
        ctx.fillStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    // Eyebrows
    [-1, 1].forEach(side => {
      const ex = side * eyeDist;
      ctx.beginPath();
      ctx.moveTo(ex - eyeW * 0.45, eyeY - 18);
      ctx.quadraticCurveTo(ex, eyeY - 24, ex + eyeW * 0.45, eyeY - 18);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Nose
    ctx.beginPath();
    ctx.moveTo(0, eyeY + 10);
    ctx.lineTo(0, eyeY + 45);
    ctx.lineTo(8, eyeY + 50);
    ctx.lineTo(0, eyeY + 52);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Mouth
    const mouthY = eyeY + 80;
    const mouthW = faceW * 0.38;
    const mouthH = Math.max(4, mouthW * 0.7 * params.mouthOpenFactor);

    ctx.beginPath();
    ctx.ellipse(0, mouthY, mouthW * 0.5, mouthH * 0.5, 0, 0, Math.PI * 2);
    ctx.fillStyle = params.mouthOpenFactor > 0.4 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(8, 29, 53, 0.85)';
    ctx.fill();
    ctx.strokeStyle = params.mouthOpenFactor > 0.4 ? '#f59e0b' : 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Facial Mesh Nodes
    const gridPoints = [
      { x: -faceW * 0.4, y: -faceH * 0.4 }, { x: 0, y: -faceH * 0.45 }, { x: faceW * 0.4, y: -faceH * 0.4 },
      { x: -faceW * 0.5, y: 0 }, { x: faceW * 0.5, y: 0 },
      { x: -faceW * 0.35, y: faceH * 0.38 }, { x: 0, y: faceH * 0.45 }, { x: faceW * 0.35, y: faceH * 0.38 }
    ];

    gridPoints.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.7)';
      ctx.fill();
    });

    ctx.restore();

    // HUD Corner Reticles
    this.drawHudCorners(ctx, w, h);
  }

  drawHudCorners(ctx, w, h) {
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 2;
    const pad = 24;
    const len = 18;

    // TL
    ctx.beginPath(); ctx.moveTo(pad, pad + len); ctx.lineTo(pad, pad); ctx.lineTo(pad + len, pad); ctx.stroke();
    // TR
    ctx.beginPath(); ctx.moveTo(w - pad - len, pad); ctx.lineTo(w - pad, pad); ctx.lineTo(w - pad, pad + len); ctx.stroke();
    // BL
    ctx.beginPath(); ctx.moveTo(pad, h - pad - len); ctx.lineTo(pad, h - pad); ctx.lineTo(pad + len, h - pad); ctx.stroke();
    // BR
    ctx.beginPath(); ctx.moveTo(w - pad - len, h - pad); ctx.lineTo(w - pad, h - pad); ctx.lineTo(w - pad, h - pad - len); ctx.stroke();
  }

  drawSearchReticle(w, h) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.strokeRect(w * 0.25, h * 0.2, w * 0.5, h * 0.6);
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
    ctx.font = '12px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SEARCHING FOR DRIVER FACE...', w * 0.5, h * 0.5);
    ctx.restore();
  }

  /**
   * Biometric Evaluation & Drowsiness Score Calculation
   */
  updateBiometrics() {
    const now = performance.now();

    // 1. Eye Closure & Blink Timing
    const isEyesClosed = this.avgEAR < this.earThreshold;

    if (isEyesClosed) {
      if (!this.eyeClosedSince) {
        this.eyeClosedSince = now;
      }
      this.eyeClosureDuration = (now - this.eyeClosedSince) / 1000;
      this.isEyeCurrentlyClosed = true;
    } else {
      if (this.eyeClosedSince) {
        const closedTime = (now - this.eyeClosedSince) / 1000;
        // Natural blink duration is between 0.08s and 0.45s
        if (closedTime >= 0.08 && closedTime <= 0.55) {
          this.totalBlinks++;
          this.blinkTimestamps.push(now);
          if (window.app) {
            window.app.logEvent('info', `Normal blink detected (Duration: ${closedTime.toFixed(2)}s, EAR: ${this.avgEAR.toFixed(2)})`);
          }
        }
      }
      this.eyeClosedSince = null;
      this.eyeClosureDuration = 0;
      this.isEyeCurrentlyClosed = false;
    }

    // Calculate rolling blink rate (blinks per minute)
    const oneMinAgo = now - 60000;
    this.blinkTimestamps = this.blinkTimestamps.filter(t => t >= oneMinAgo);
    this.blinkRate = Math.max(12, this.blinkTimestamps.length * 4); // scaled for active window

    // 2. Yawn Detection
    const isYawning = this.mar > this.marThreshold;
    if (isYawning) {
      if (!this.yawnActiveSince) {
        this.yawnActiveSince = now;
      }
      this.yawnDuration = (now - this.yawnActiveSince) / 1000;
      if (this.yawnDuration > 1.2 && !this.isCurrentlyYawning) {
        this.totalYawns++;
        this.isCurrentlyYawning = true;
        if (window.app) {
          window.app.logEvent('warning', `Yawning detected (Duration: ${this.yawnDuration.toFixed(1)}s, MAR: ${this.mar.toFixed(2)}). Fatigue score +20.`);
        }
      }
    } else {
      this.yawnActiveSince = null;
      this.yawnDuration = 0;
      this.isCurrentlyYawning = false;
    }

    // 3. Head Nodding Detection (Pitch > 14 deg)
    const isNodding = this.pitch > 14;
    if (isNodding) {
      if (!this.nodActiveSince) {
        this.nodActiveSince = now;
      }
      const nodDuration = (now - this.nodActiveSince) / 1000;
      if (nodDuration > 0.8 && !this.isCurrentlyNodding) {
        this.totalNods++;
        this.isCurrentlyNodding = true;
        if (window.headPoseGizmo) {
          window.headPoseGizmo.updatePose(this.pitch, this.yaw, this.roll, 1);
        }
        if (window.app) {
          window.app.logEvent('warning', `Head nod / sag detected (Pitch: ${this.pitch.toFixed(1)}°). Score +15.`);
        }
      }
    } else {
      this.nodActiveSince = null;
      this.isCurrentlyNodding = false;
    }

    // 4. Compute Drowsiness Intelligence Engine Scores
    // Eye Closure Score (max 40)
    let scoreEye = 0;
    if (this.eyeClosureDuration > 0.4) {
      scoreEye = Math.min(40, Math.round((this.eyeClosureDuration / this.eyeThresholdSec) * 40));
    }

    // Blink Frequency Score (max 15)
    let scoreBlink = 0;
    if (this.blinkRate > 24) {
      scoreBlink = Math.min(15, Math.round(((this.blinkRate - 24) / 15) * 15));
    }

    // Yawning Score (max 20)
    let scoreYawn = 0;
    if (this.isCurrentlyYawning || this.yawnDuration > 0.5) {
      scoreYawn = Math.min(20, Math.round((this.yawnDuration / 2.5) * 20));
    } else if (this.totalYawns > 0) {
      scoreYawn = Math.min(15, this.totalYawns * 5);
    }

    // Head Nodding Score (max 15)
    let scoreNod = 0;
    if (this.isCurrentlyNodding) {
      scoreNod = 15;
    } else if (this.totalNods > 0) {
      scoreNod = Math.min(12, this.totalNods * 4);
    }

    // Off-Center Head Pose Score (max 10)
    let scorePose = 0;
    if (Math.abs(this.yaw) > 20 || Math.abs(this.roll) > 18) {
      scorePose = 10;
    }

    // Total Composite Score (0 - 100)
    const baseFatigue = 12; // Baseline awake driver baseline
    let totalScore = Math.min(100, baseFatigue + scoreEye + scoreBlink + scoreYawn + scoreNod + scorePose);

    // If eye closure strictly exceeds threshold, force critical alert
    if (this.eyeClosureDuration >= this.eyeThresholdSec) {
      totalScore = Math.max(totalScore, 85);
    }

    // Dispatch update to App State & Telemetry UI
    if (window.app) {
      window.app.updateTelemetry({
        leftEAR: this.leftEAR,
        rightEAR: this.rightEAR,
        avgEAR: this.avgEAR,
        mar: this.mar,
        pitch: this.pitch,
        yaw: this.yaw,
        roll: this.roll,
        eyeClosureDuration: this.eyeClosureDuration,
        blinkRate: this.blinkRate,
        totalBlinks: this.totalBlinks,
        yawnsCount: this.totalYawns,
        yawnDuration: this.yawnDuration,
        nodCount: this.totalNods,
        fps: this.fps,
        confidence: this.confidence,
        scoreEye,
        scoreBlink,
        scoreYawn,
        scoreNod,
        scorePose,
        totalScore,
        isEyeClosed: isEyesClosed,
        isYawning: this.isCurrentlyYawning,
        isNodding: this.isCurrentlyNodding
      });
    }
  }
}

window.visionEngine = new VisionEngine();
