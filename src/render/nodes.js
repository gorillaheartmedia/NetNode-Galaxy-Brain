// src/render/nodes.js

import { getPrimaryTag } from "../core/tags.js";

export function initNodes(app) {
  const layer = document.getElementById("nodes-layer");
  if (!layer) {
    console.error("nodes.js: #nodes-layer not found in DOM");
    return;
  }

  app.nodesLayer = layer;
  app.renderNodes = () => renderNodes(app);

  console.log("Nodes renderer initialized.");
}

function worldToScreen(app, x, y) {
  const cam = app.state.camera;
  return {
    x: x * cam.zoom + cam.x,
    y: y * cam.zoom + cam.y
  };
}

function renderNodes(app) {
  const layer = app.nodesLayer;
  if (!layer) return;

  layer.innerHTML = "";

  for (const node of app.state.nodes) {
    if (typeof node.vx !== "number") node.vx = 0;
    if (typeof node.vy !== "number") node.vy = 0;
    if (typeof node._dragging !== "boolean") node._dragging = false;

    const el = createNodeElement(app, node);
    layer.appendChild(el);
  }
}

/* ------------------------------------------------------------
   Create node element with TAG COLOR support
------------------------------------------------------------ */
function createNodeElement(app, node) {
  const el = document.createElement("div");
  el.className = "node";
  el.dataset.id = node.id;

  // ⭐ Primary tag = node color
  const primaryTag = getPrimaryTag(node);
  el.style.background = primaryTag ? primaryTag.color : "#0af";

  // Position
  const pos = worldToScreen(app, node.x, node.y);
  el.style.left = `${pos.x}px`;
  el.style.top = `${pos.y}px`;

  // Selected
  if (app.state.selectedNode === node.id) {
    el.classList.add("selected");
  }

  // Hover label
  const label = document.createElement("div");
  label.className = "node-label";
  label.textContent = node.title || "Untitled";
  el.appendChild(label);

  // Hover effects
  el.addEventListener("pointerenter", () => {
    label.style.opacity = "1";
    el.style.boxShadow = "0 0 14px 4px rgba(0, 200, 255, 0.95)";
    el.style.transform = "translate(-50%, -50%) scale(1.3)";
  });
  el.addEventListener("pointerleave", () => {
    label.style.opacity = "";
    el.style.boxShadow = "";
    el.style.transform = "translate(-50%, -50%)";
  });

  // Drag start
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    node._wasDragged = false;
    node._dragStartX = node.x;
    node._dragStartY = node.y;

    node._dragging = true;
    node.vx = 0;
    node.vy = 0;

    if (app.onNodePointerDown) app.onNodePointerDown(node, e);
  });

  // Drag end / click
  el.addEventListener("pointerup", (e) => {
    node._dragging = false;

    if (app.onNodePointerUp) app.onNodePointerUp(node, e);
  });

  el.addEventListener("click", (e) => {
    if (app.onNodeClick) app.onNodeClick(node, e);

    if (
      !node._wasDragged &&
      !app.state.connectMode &&
      !app.state.deleteMode &&
      typeof app.openPanel === "function"
    ) {
      app.openPanel(node);
    }
  });

  return el;
}
