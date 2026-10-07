/**
 * NEURODRIVE AI — BACKGROUND CANVAS ENGINE
 * "Neural Road Network"
 * 
 * Renders a subtle, high-performance canvas visual combining:
 * 1. Perspective futuristic highway lines scrolling downwards
 * 2. Connected AI neural network constellation with synapic pulses
 * 3. Flowing cyber data packets along pathways
 * 4. Concentric radar sweep arcs
 * 5. Faint horizon grid and soft blue radial glows
 */

class NeuralRoadBackground {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.width = 0;
    this.height = 0;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    
    // Animation state
    this.roadOffset = 0;
    this.roadSpeed = 0.6; // Smooth, slow downward flow
    this.radarAngle = 0;
    this.radarSpeed = 0.008;

    // Neural Network Nodes
    this.nodes = [];
    this.nodeCount = 45;
    this.connections = [];
    this.pulses = [];

    // Road Data Particles
    this.particles = [];
    this.particleCount = 35;

    // Init & Event Listeners
    this.init();
    this.bindEvents();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  init() {
    this.resize();
    this.createNeuralNetwork();
    this.createRoadParticles();
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize(), { passive: true });
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.scale(this.dpr, this.dpr);
    this.createNeuralNetwork();
  }

  createNeuralNetwork() {
    this.nodes = [];
    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        radius: Math.random() * 2 + 1.2,
        baseAlpha: Math.random() * 0.35 + 0.15,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  createRoadParticles() {
    this.particles = [];
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        lane: Math.floor(Math.random() * 5) - 2, // -2, -1, 0, 1, 2
        progress: Math.random(), // 0 (horizon) to 1 (bottom)
        speed: Math.random() * 0.003 + 0.002,
        size: Math.random() * 2 + 1.5,
        alpha: Math.random() * 0.6 + 0.3
      });
    }
  }

  triggerSynapticPulse() {
    if (this.nodes.length < 2 || this.pulses.length > 6) return;
    const fromIdx = Math.floor(Math.random() * this.nodes.length);
    let toIdx = Math.floor(Math.random() * this.nodes.length);
    if (fromIdx === toIdx) toIdx = (toIdx + 1) % this.nodes.length;

    const n1 = this.nodes[fromIdx];
    const n2 = this.nodes[toIdx];
    const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);

    if (dist < 220) {
      this.pulses.push({
        from: n1,
        to: n2,
        progress: 0,
        speed: 0.02
      });
    }
  }

  drawGradientBackground() {
    const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    grad.addColorStop(0, '#020817');
    grad.addColorStop(0.5, '#040e22');
    grad.addColorStop(1, '#06152B');
    this.ctx.fillStyle = grad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Subtle center-top radial glow
    const radial = this.ctx.createRadialGradient(
      this.width * 0.5, this.height * 0.3, 10,
      this.width * 0.5, this.height * 0.3, this.width * 0.7
    );
    radial.addColorStop(0, 'rgba(14, 165, 233, 0.06)');
    radial.addColorStop(0.6, 'rgba(2, 132, 199, 0.02)');
    radial.addColorStop(1, 'transparent');
    this.ctx.fillStyle = radial;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  drawNeuralNetwork() {
    const ctx = this.ctx;
    const maxDist = 160;

    // Update and draw nodes
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];
      node.x += node.vx;
      node.y += node.vy;
      node.pulsePhase += 0.02;

      // Bounce off screen margins gently
      if (node.x < 0 || node.x > this.width) node.vx *= -1;
      if (node.y < 0 || node.y > this.height) node.vy *= -1;

      const dynamicAlpha = node.baseAlpha + Math.sin(node.pulsePhase) * 0.15;

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(56, 189, 248, ${Math.max(0.05, dynamicAlpha)})`;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Connect neighboring nodes
      for (let j = i + 1; j < this.nodes.length; j++) {
        const other = this.nodes[j];
        const dist = Math.hypot(node.x - other.x, node.y - other.y);

        if (dist < maxDist) {
          const lineAlpha = (1 - dist / maxDist) * 0.12;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw Synaptic Pulses
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const pulse = this.pulses[i];
      pulse.progress += pulse.speed;

      const px = pulse.from.x + (pulse.to.x - pulse.from.x) * pulse.progress;
      const py = pulse.from.y + (pulse.to.y - pulse.from.y) * pulse.progress;

      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.85)';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      if (pulse.progress >= 1) {
        this.pulses.splice(i, 1);
      }
    }

    // Occasional trigger
    if (Math.random() < 0.04) {
      this.triggerSynapticPulse();
    }
  }

  drawPerspectiveHighway() {
    const ctx = this.ctx;
    const vpX = this.width * 0.5;
    const vpY = this.height * 0.18; // Horizon vanishing point
    const bottomY = this.height + 40;

    ctx.save();
    
    // Faint horizontal perspective grid lines
    this.roadOffset = (this.roadOffset + this.roadSpeed) % 40;
    const gridCount = 18;
    for (let i = 0; i < gridCount; i++) {
      const p = Math.pow((i + (this.roadOffset / 40)) / gridCount, 2.4);
      const y = vpY + (bottomY - vpY) * p;
      const spread = (this.width * 0.9) * p;
      const alpha = p * 0.12;

      ctx.beginPath();
      ctx.moveTo(vpX - spread, y);
      ctx.lineTo(vpX + spread, y);
      ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Perspective highway lane rays
    const lanes = [-2.2, -1.2, -0.4, 0.4, 1.2, 2.2];
    const baseWidth = this.width * 0.38;

    lanes.forEach((laneFactor, idx) => {
      const bottomX = vpX + laneFactor * baseWidth;
      const isCenter = Math.abs(laneFactor) < 0.6;

      ctx.beginPath();
      ctx.moveTo(vpX, vpY);
      ctx.lineTo(bottomX, bottomY);

      if (isCenter) {
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([15, 12]);
        ctx.lineDashOffset = -this.roadOffset * 2;
      } else {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
      }

      ctx.stroke();
    });

    ctx.setLineDash([]);

    // Draw Cyber Highway Particles
    this.particles.forEach(p => {
      p.progress += p.speed;
      if (p.progress > 1) {
        p.progress = 0;
        p.lane = (Math.random() - 0.5) * 4;
      }

      const curve = Math.pow(p.progress, 2.2);
      const currentY = vpY + (bottomY - vpY) * curve;
      const currentX = vpX + (p.lane * baseWidth) * curve;
      const currentAlpha = p.alpha * curve * 0.8;
      const currentSize = p.size * (0.6 + curve * 1.4);

      ctx.beginPath();
      ctx.arc(currentX, currentY, currentSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 240, 255, ${currentAlpha})`;
      ctx.shadowColor = 'rgba(0, 240, 255, 0.6)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.restore();
  }

  drawRadarSensorWaves() {
    const ctx = this.ctx;
    const centerX = this.width * 0.88;
    const centerY = this.height * 0.78;

    this.radarAngle += this.radarSpeed;

    ctx.save();
    ctx.translate(centerX, centerY);

    // Subtle concentric radar rings
    for (let r = 50; r <= 220; r += 55) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.04)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Sensor arc sweep
    ctx.beginPath();
    ctx.arc(0, 0, 180, this.radarAngle, this.radarAngle + 0.6);
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.drawGradientBackground();
    this.drawPerspectiveHighway();
    this.drawNeuralNetwork();
    this.drawRadarSensorWaves();
    requestAnimationFrame(this.animate);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.neuralRoadBg = new NeuralRoadBackground('neural-bg-canvas');
});
