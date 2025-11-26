// src/physics/forceEngine.js
//
// ForceAtlas2-style physics engine for Galaxy Brain Engine
//---------------------------------------------------------
// - Nodes live in WORLD space: node.x, node.y
// - Camera: app.state.camera { x, y, zoom }
// - Rendering uses worldToScreen() in nodes/links
// - Physics updates world positions only
//

export function initPhysics(app) {
  console.log("Physics engine initialized (ForceAtlas2-style).");

  const state = app.state;

  // Basic config
  const config = {
    repulsion: 2500,
    attraction: 0.01,
    gravity: 0.05,
    damping: 0.85,
    maxSpeed: 5,
    timeStep: 0.02
  };

  if (!state.physics) {
    state.physics = {
      running: true,
      speed: 1.0
    };
  }

  // Initialize velocity fields
  for (const node of state.nodes) {
    if (typeof node.vx !== "number") node.vx = 0;
    if (typeof node.vy !== "number") node.vy = 0;
  }

  // ------------------------------------------------------------
  // Helper: Is any node currently being dragged?
  // ------------------------------------------------------------
  function nodeBeingDragged() {
    return state.nodes.some(n => n._dragging === true);
  }

  // ------------------------------------------------------------
  // PHYSICS STEP LOOP
  // ------------------------------------------------------------
  function step() {
    if (!state.physics.running) {
      requestAnimationFrame(step);
      return;
    }

    const nodes = state.nodes;
    const links = state.links || [];
    const N = nodes.length;

    if (N === 0) {
      requestAnimationFrame(step);
      return;
    }

    const dt = config.timeStep * (state.physics.speed || 1);

    // ---------- REPULSION ----------
    for (let i = 0; i < N; i++) {
      const n1 = nodes[i];

      if (typeof n1.vx !== "number") n1.vx = 0;
      if (typeof n1.vy !== "number") n1.vy = 0;

      for (let j = i + 1; j < N; j++) {
        const n2 = nodes[j];

        if (typeof n2.vx !== "number") n2.vx = 0;
        if (typeof n2.vy !== "number") n2.vy = 0;

        let dx = n1.x - n2.x;
        let dy = n1.y - n2.y;
        let dist2 = dx * dx + dy * dy;

        if (dist2 === 0) {
          dx = (Math.random() - 0.5) * 0.01;
          dy = (Math.random() - 0.5) * 0.01;
          dist2 = dx * dx + dy * dy;
        }

        const dist = Math.sqrt(dist2);
        const force = config.repulsion / dist2;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (!isPinned(n1)) {
          n1.vx += fx * dt;
          n1.vy += fy * dt;
        }
        if (!isPinned(n2)) {
          n2.vx -= fx * dt;
          n2.vy -= fy * dt;
        }
      }
    }

    // ---------- ATTRACTION (LINK SPRINGS) ----------
    for (const link of links) {
      const a = nodes.find(n => n.id === link.source || n.id === link.sourceId);
      const b = nodes.find(n => n.id === link.target || n.id === link.targetId);
      if (!a || !b) continue;

      let dx = a.x - b.x;
      let dy = a.y - b.y;
      let dist2 = dx * dx + dy * dy;

      if (dist2 === 0) {
        dx = (Math.random() - 0.5) * 0.01;
        dy = (Math.random() - 0.5) * 0.01;
        dist2 = dx * dx + dy * dy;
      }

      const dist = Math.sqrt(dist2);
      const force = config.attraction * dist;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!isPinned(a)) {
        a.vx -= fx * dt;
        a.vy -= fy * dt;
      }
      if (!isPinned(b)) {
        b.vx += fx * dt;
        b.vy += fy * dt;
      }
    }

    // ---------- GRAVITY ----------
    for (const node of nodes) {
      if (isPinned(node)) continue;

      const dx = node.x;
      const dy = node.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const force = config.gravity * dist;

      const fx = (-dx / dist) * force;
      const fy = (-dy / dist) * force;

      node.vx += fx * dt;
      node.vy += fy * dt;
    }

    // ---------- INTEGRATION ----------
    for (const node of nodes) {
      if (isPinned(node)) continue;

      node.vx *= config.damping;
      node.vy *= config.damping;

      const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (speed > config.maxSpeed) {
        const scale = config.maxSpeed / speed;
        node.vx *= scale;
        node.vy *= scale;
      }

      node.x += node.vx * dt;
      node.y += node.vy * dt;
    }

    // ---------- RENDER ----------
    //
    // DO NOT destroy/rebuild DOM while a node is being clicked or dragged.
    //
    if (!nodeBeingDragged()) {
      app.renderNodes();
    }

    app.renderLinks();

    requestAnimationFrame(step);
  }

  requestAnimationFrame(step);

  // Allow UI to pause/resume physics
  app.pausePhysics = () => { state.physics.running = false; };
  app.resumePhysics = () => {
    if (!state.physics.running) {
      state.physics.running = true;
      requestAnimationFrame(step);
    }
  };
}

// Node is pinned if being dragged or explicitly fixed.
function isPinned(node) {
  return node._dragging || node.fixed;
}
