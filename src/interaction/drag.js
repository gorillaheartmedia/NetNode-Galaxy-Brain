// src/interaction/drag.js

export function initDrag(app) {
  let draggingNode = null;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

  // For detecting real drag vs simple click
  let startPointerX = 0;
  let startPointerY = 0;

  const DRAG_THRESHOLD = 4; // pixels

  // Called when user presses on a node
  app.onNodePointerDown = (node, e) => {
    e.preventDefault();
    e.stopPropagation();

    draggingNode = node;
    node._wasDragged = false;

    // Capture starting pointer position (screen space)
    startPointerX = e.clientX;
    startPointerY = e.clientY;

    // Tell physics to stop moving this node
    node._dragging = true;
    node.vx = 0;
    node.vy = 0;

    const cam = app.state.camera;
    const pointerX = (e.clientX - cam.x) / cam.zoom;
    const pointerY = (e.clientY - cam.y) / cam.zoom;

    // Offset in WORLD space
    dragOffsetX = pointerX - node.x;
    dragOffsetY = pointerY - node.y;

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  function onMove(e) {
    if (!draggingNode) return;

    const cam = app.state.camera;
    const pointerX = (e.clientX - cam.x) / cam.zoom;
    const pointerY = (e.clientY - cam.y) / cam.zoom;

    // Update node position in WORLD space
    draggingNode.x = pointerX - dragOffsetX;
    draggingNode.y = pointerY - dragOffsetY;

    // Check if we've moved far enough to count as a drag
    const dxScreen = e.clientX - startPointerX;
    const dyScreen = e.clientY - startPointerY;
    const dist = Math.hypot(dxScreen, dyScreen);

    if (dist > DRAG_THRESHOLD) {
      draggingNode._wasDragged = true;
    }

    app.renderNodes();
    app.renderLinks();

    // Live update any open panel
    if (app.updatePanel) app.updatePanel(draggingNode);
  }

  function onUp(e) {
    if (draggingNode) {
      // Release physics hold
      draggingNode._dragging = false;

      // Wipe velocity so the node doesn't "slingshot"
      draggingNode.vx = 0;
      draggingNode.vy = 0;

      if (draggingNode._wasDragged) {
        console.log("Node dragged:", draggingNode.id);
      }
    }

    draggingNode = null;

    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
  }

  console.log("Drag system initialized.");
}
