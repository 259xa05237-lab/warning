/**
 * NEURODRIVE AI — 3D HEAD POSE GIZMO CONTROLLER
 * Controls the interactive 3D attitude indicator / gimbal cube in telemetry.
 */

class HeadPoseGizmo {
  constructor() {
    this.cube = document.getElementById('gimbal-cube');
    this.horizon = document.getElementById('attitude-horizon');
    this.txtDir = document.getElementById('txt-head-direction');
    this.badgeHead = document.getElementById('badge-head-state');
    
    this.valPitch = document.getElementById('val-pitch-deg');
    this.valYaw = document.getElementById('val-yaw-deg');
    this.valRoll = document.getElementById('val-roll-deg');
    this.valNod = document.getElementById('val-nod-count');
    
    this.subPitch = document.getElementById('sub-pitch-desc');
    this.subYaw = document.getElementById('sub-yaw-desc');
    this.subRoll = document.getElementById('sub-roll-desc');

    this.nodCount = 0;
  }

  updatePose(pitch, yaw, roll, nodIncrement = 0) {
    if (nodIncrement > 0) {
      this.nodCount += nodIncrement;
      if (this.valNod) this.valNod.textContent = this.nodCount;
    }

    // Update 3D Cube Transform (Pitch = X-axis, Yaw = Y-axis, Roll = Z-axis)
    if (this.cube) {
      this.cube.style.transform = `rotateX(${-pitch * 1.5}deg) rotateY(${yaw * 1.5}deg) rotateZ(${-roll * 1.5}deg)`;
    }

    // Update Artificial Horizon Line (Roll & Pitch translation)
    if (this.horizon) {
      this.horizon.style.transform = `translateY(${pitch * 1.2}px) rotate(${-roll}deg)`;
    }

    // Update Numerical Degrees
    if (this.valPitch) this.valPitch.textContent = `${pitch.toFixed(1)}°`;
    if (this.valYaw) this.valYaw.textContent = `${yaw.toFixed(1)}°`;
    if (this.valRoll) this.valRoll.textContent = `${roll.toFixed(1)}°`;

    // Determine Direction & Alert State
    let direction = 'CENTER / FORWARD';
    let isOffCenter = false;
    let isNodding = false;

    if (pitch > 14) {
      direction = 'NODDING / DOWNWARD ⚠️';
      isNodding = true;
    } else if (pitch < -14) {
      direction = 'LOOKING UP';
      isOffCenter = true;
    } else if (yaw > 18) {
      direction = 'LOOKING RIGHT';
      isOffCenter = true;
    } else if (yaw < -18) {
      direction = 'LOOKING LEFT';
      isOffCenter = true;
    } else if (Math.abs(roll) > 16) {
      direction = 'HEAD TILTED';
      isOffCenter = true;
    }

    if (this.txtDir) {
      this.txtDir.textContent = direction;
      this.txtDir.className = `gizmo-val ${isNodding ? 'status-danger' : (isOffCenter ? 'status-warn' : 'status-ok')}`;
    }

    if (this.badgeHead) {
      if (isNodding) {
        this.badgeHead.textContent = 'NODDING';
        this.badgeHead.className = 'card-badge-pill badge-drowsy';
      } else if (isOffCenter) {
        this.badgeHead.textContent = 'OFF-CENTER';
        this.badgeHead.className = 'card-badge-pill badge-warning';
      } else {
        this.badgeHead.textContent = 'NORMAL';
        this.badgeHead.className = 'card-badge-pill';
      }
    }

    // Update subtext explanations
    if (this.subPitch) {
      this.subPitch.textContent = Math.abs(pitch) > 14 ? (pitch > 0 ? 'Downward sag' : 'Upward tilt') : 'Level (±15°)';
    }
    if (this.subYaw) {
      this.subYaw.textContent = Math.abs(yaw) > 18 ? (yaw > 0 ? 'Right distraction' : 'Left distraction') : 'Forward facing';
    }
    if (this.subRoll) {
      this.subRoll.textContent = Math.abs(roll) > 16 ? 'Severe lateral tilt' : 'Neutral';
    }
  }

  reset() {
    this.updatePose(0, 0, 0);
  }
}

window.headPoseGizmo = new HeadPoseGizmo();
