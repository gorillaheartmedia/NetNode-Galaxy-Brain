// src/interaction/drag.js

export function initDrag(app) {
  let draggingNode = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  let startX = 0;
  let startY = 0;
  const DRAG_THRESHOLD = 4;

  app.onNodePointerDown = (node, e) => {
    e.preventDefault();

    draggingNode = node;
    node._wasDragged = false;

    startX = e.clientX;
    startY = e.clientY;

    node._dragging = true;
    node.vx = 0;
    node.vy = 0;

    const cam = app.state.camera;
    const px = (e.clientX - cam.x) / cam.zoom;
    const py = (e.clientY - cam.y) / cam.zoom;

    dragOffsetX = px - node.x;
    dragOffsetY = py - node.y;

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  function onMove(e) {
    if (!draggingNode) return;

    const cam = app.state.camera;
    const px = (e.clientX - cam.x) / cam.zoom;
    const py = (e.clientY - cam.y) / cam.zoom;

    draggingNode.x = px - dragOffsetX;
    draggingNode.y = py - dragOffsetY;

    const moved = Math.hypot(e.clientX - startX, e.clientY - startY);
    if (moved > DRAG_THRESHOLD) draggingNode._wasDragged = true;

    // ---------------------------------------------------------
    // FULL CHAIN RIPPLE via BFS
    // ---------------------------------------------------------
    const visited = new Set();
    const queue = [{ id: draggingNode.id, depth: 0 }];

    const depthFalloff = 0.65;  // lose 35% power each hop

    while (queue.length > 0) {
      const { id, depth } = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      const node = app.state.nodes.find(n => n.id === id);
      if (!node) continue;

      // Apply bounce impulse except to the drag origin
      if (id !== draggingNode.id) {
        const dx = node.x - draggingNode.x;
        const dy = node.y - draggingNode.y;
        const dist = Math.hypot(dx, dy) || 1;

        const strength = (1.2 / dist) * Math.pow(depthFalloff, depth);

        node.vx += (dx/dist) * strength;
        node.vy += (dy/dist) * strength;
      }

      // Add neighbors to BFS
      const neighbors = app.state.links
        .filter(l => l.source === id || l.target === id)
        .map(l => (l.source === id ? l.target : l.source));

      for (const nb of neighbors) {
        if (!visited.has(nb)) {
          queue.push({ id: nb, depth: depth + 1 });
        }
      }
    }

    app.renderNodes();
    app.renderLinks();

    if (app.updatePanel) app.updatePanel(draggingNode);
  }

  function onUp() {
    if (draggingNode) {
      draggingNode._dragging = false;
      draggingNode.vx = 0;
      draggingNode.vy = 0;
    }
    draggingNode = null;

    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  console.log("Drag with full-chain ripple initialized.");
}
