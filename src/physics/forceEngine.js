// src/physics/forceEngine.js
//
// Galaxy Brain Engine – Soft-Body Physics Mode Switching
//------------------------------------------------------------

export function initPhysics(app) {
  console.log("Physics engine (Soft-Body Mode) initialized.");

  // Guarantee physics state exists BEFORE first frame
  if (!app.state.physics) {
    app.state.physics = {
      running: true,
      speed: 1.0
    };
  }

  const state = app.state;

  // -------------------------------------
  // Core physics configuration
  // -------------------------------------
  const config = {
    // Base repulsion when NOT dragging
    repulsion: 2500,

    // Base damping (dragging lowers this)
    damping: 0.86,

    // Simulation time factor
    timeStep: 0.02,

    // Max movement speed
    maxSpeed: 5,

    // Spring physics
    springK: 0.015,        // base stiffness
    restLength: 90,        // default link length
    springDamping: 0.10,   // energy loss
    springBoost: 12,       // yank and wobble amplitude

    // Drift motion
    driftRadius: 160,
    driftSpeed: 0.40
  };

  // Ensure velocities exist
  for (const n of state.nodes) {
    if (typeof n.vx !== "number") n.vx = 0;
    if (typeof n.vy !== "number") n.vy = 0;
  }

  // Drift animation phase
  let driftT = 0;

  // ------------------------------------------------------------
  // DRIFT — oscillates around camera center (idle only)
  // ------------------------------------------------------------
  function applyDrift(nodes, dt) {
    driftT += config.driftSpeed * dt;

    const cam = state.camera;

    const cx = (window.innerWidth / 2 - cam.x) / cam.zoom;
    const cy = (window.innerHeight / 2 - cam.y) / cam.zoom;

    const tx = cx + Math.cos(driftT) * config.driftRadius;
    const ty = cy + Math.sin(driftT * 0.7) * config.driftRadius;

    for (const n of nodes) {
      if (n._dragging) continue;

      const dx = tx - n.x;
      const dy = ty - n.y;

      n.vx += dx * 0.0003;
      n.vy += dy * 0.0003;
    }
  }

  function nodeBeingDragged() {
    return state.nodes.some(n => n._dragging);
  }

  function isFixed(n) {
    return n._dragging || n.fixed;
  }

  // ------------------------------------------------------------
  // MAIN PHYSICS LOOP
  // ------------------------------------------------------------
  function step() {
    if (!state.physics.running) return requestAnimationFrame(step);

    const nodes = state.nodes;
    const links = state.links;
    const N = nodes.length;

    if (N === 0) return requestAnimationFrame(step);

    const dt = config.timeStep * state.physics.speed;
    const dragging = nodeBeingDragged();

    // ------------------------------------------------------------
    // 1. REPULSION — DISABLED DURING DRAG (so wobble can propagate)
    // ------------------------------------------------------------
    const repulse = dragging ? 0 : config.repulsion;

    for (let i = 0; i < N; i++) {
      const n1 = nodes[i];
      for (let j = i + 1; j < N; j++) {
        const n2 = nodes[j];

        let dx = n1.x - n2.x;
        let dy = n1.y - n2.y;

        let d2 = dx * dx + dy * dy;
        if (d2 === 0) {
          dx = (Math.random() - 0.5) * 0.02;
          dy = (Math.random() - 0.5) * 0.02;
          d2 = dx * dx + dy * dy;
        }

        const d = Math.sqrt(d2);
        const f = repulse / d2;  // 🔥 repulsion suppressed while dragging

        const fx = (dx / d) * f;
        const fy = (dy / d) * f;

        if (!isFixed(n1)) { n1.vx += fx * dt; n1.vy += fy * dt; }
        if (!isFixed(n2)) { n2.vx -= fx * dt; n2.vy -= fy * dt; }
      }
    }

    // ------------------------------------------------------------
    // 2. RUBBER-BAND SPRINGS (Hooke’s Law)
    // ------------------------------------------------------------
    for (const link of links) {
      const a = nodes.find(n => n.id === link.source);
      const b = nodes.find(n => n.id === link.target);
      if (!a || !b) continue;

      let dx = b.x - a.x;
      let dy = b.y - a.y;

      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // assign persistent rest length
      if (!link.restLength) link.restLength = config.restLength;
      const rest = link.restLength;

      // stiffness: stronger during drag
      const k = dragging ? config.springK * 4 : config.springK;

      // Hooke: F = -k (x - rest)
      const displacement = dist - rest;
      const force = k * displacement;

      const nx = dx / dist;
      const ny = dy / dist;

      // A-side
      if (!a._dragging) {
        a.vx += nx * force * dt;
        a.vy += ny * force * dt;

        a.vx *= (1 - config.springDamping);
        a.vy *= (1 - config.springDamping);
      }

      // B-side
      if (!b._dragging) {
        b.vx -= nx * force * dt;
        b.vy -= ny * force * dt;

        b.vx *= (1 - config.springDamping);
        b.vy *= (1 - config.springDamping);
      }

      // --------------------------------------------------------
      // DRAG BOOST — the secret sauce for chain-reaction wobble
      // --------------------------------------------------------
      if (dragging && (a._dragging || b._dragging)) {
        const boost = config.springBoost;

        a.vx += nx * force * dt * boost;
        a.vy += ny * force * dt * boost;

        b.vx -= nx * force * dt * boost;
        b.vy -= ny * force * dt * boost;
      }
    }

    // ------------------------------------------------------------
    // 3. DRIFT — ONLY IF NOT DRAGGING
    // ------------------------------------------------------------
    if (!dragging) {
      applyDrift(nodes, dt);
    }

    // ------------------------------------------------------------
    // 4. INTEGRATION (movement)
    // ------------------------------------------------------------
    for (const n of nodes) {
      if (isFixed(n)) continue;

      // LESS damping during drag = MORE wobble
      const damp = dragging ? 0.65 : config.damping;

      n.vx *= damp;
      n.vy *= damp;

      const s = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
      if (s > config.maxSpeed) {
        const m = config.maxSpeed / s;
        n.vx *= m;
        n.vy *= m;
      }

      n.x += n.vx * dt;
      n.y += n.vy * dt;
    }

    if (!dragging) app.renderNodes();
    app.renderLinks();

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);

  // Public controls
  app.pausePhysics = () => { state.physics.running = false; };
  app.resumePhysics = () => {
    if (!state.physics.running) {
      state.physics.running = true;
      requestAnimationFrame(step);
    }
  };
}
