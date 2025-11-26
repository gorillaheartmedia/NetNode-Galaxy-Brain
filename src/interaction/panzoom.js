// src/interaction/panzoom.js

export function initPanZoom(app) {
  const world = app.world;
  const cam = app.state.camera;

  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let camStartX = 0;
  let camStartY = 0;

  let animating = false;

  app.state.cameraBeforeFocus = app.state.cameraBeforeFocus || null;

  app.applyCameraTransform = () => applyCameraTransform(app);
  app.focusOnNode = (node) => focusOnNode(app, node);
  app.restoreCamera = () => restoreCamera(app);

  /* ZOOM (mouse wheel) */
  world.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      animating = false;

      const zoomIntensity = 0.1;
      const oldZoom = cam.zoom;
      const direction = Math.sign(e.deltaY);

      let newZoom = oldZoom * (1 - direction * zoomIntensity);
      newZoom = Math.min(Math.max(newZoom, 0.2), 3);

      const rect = world.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Zoom around cursor
      cam.x = mouseX - (mouseX - cam.x) * (newZoom / oldZoom);
      cam.y = mouseY - (mouseY - cam.y) * (newZoom / oldZoom);

      cam.zoom = newZoom;

      applyCameraTransform(app);
    },
    { passive: false }
  );

  /* START PANNING */
  world.addEventListener("pointerdown", (e) => {
    // ignore if starting drag on node
    if (e.target.closest(".node")) return;

    animating = false;

    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    camStartX = cam.x;
    camStartY = cam.y;

    world.style.cursor = "grabbing";
  });

  /* PAN MOVE */
  window.addEventListener("pointermove", (e) => {
    if (!isPanning) return;

    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;

    cam.x = camStartX + dx;
    cam.y = camStartY + dy;

    applyCameraTransform(app);
  });

  /* STOP PANNING */
  window.addEventListener("pointerup", () => {
    isPanning = false;
    world.style.cursor = "default";
  });

  console.log("Pan & Zoom initialized.");

  /* CINEMATIC FOCUS ON NODE (only when not in connect/delete mode) */
  function focusOnNode(app, node) {
    if (app.state.connectMode || app.state.deleteMode) return;

    const rect = app.root.getBoundingClientRect();

    const currentZoom = cam.zoom;
    const targetZoom = Math.min(1.8, Math.max(0.6, currentZoom * 1.2));

    const destX = rect.width * 0.35;
    const destY = rect.height * 0.5;

    const targetCam = {
      zoom: targetZoom,
      x: destX - node.x * targetZoom,
      y: destY - node.y * targetZoom
    };

    if (!app.state.cameraBeforeFocus) {
      app.state.cameraBeforeFocus = {
        x: cam.x,
        y: cam.y,
        zoom: cam.zoom
      };
    }

    animateCamera(app, cam, targetCam, 450);
  }

  function restoreCamera(app) {
    const saved = app.state.cameraBeforeFocus;
    if (!saved) return;

    const targetCam = {
      x: saved.x,
      y: saved.y,
      zoom: saved.zoom
    };

    animateCamera(app, cam, targetCam, 450, () => {
      app.state.cameraBeforeFocus = null;
    });
  }

  function animateCamera(app, camera, target, duration, onDone) {
    const startCam = { x: camera.x, y: camera.y, zoom: camera.zoom };
    let startTime = null;
    animating = true;

    function step(timestamp) {
      if (!animating) return;
      if (!startTime) startTime = timestamp;

      const t = Math.min(1, (timestamp - startTime) / duration);
      const ease = t * t * (3 - 2 * t);

      camera.zoom = startCam.zoom + (target.zoom - startCam.zoom) * ease;
      camera.x = startCam.x + (target.x - startCam.x) * ease;
      camera.y = startCam.y + (target.y - startCam.y) * ease;

      applyCameraTransform(app);

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        animating = false;
        if (onDone) onDone();
      }
    }

    requestAnimationFrame(step);
  }
}

/* CAMERA → re-render (no DOM transform on world) */
function applyCameraTransform(app) {
  app.renderNodes();
  app.renderLinks();
}
