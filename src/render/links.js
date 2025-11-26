// src/render/links.js
// ------------------------------------------------------------
// Link Renderer with:
// - Tag-based coloring
// - Tag filtering
// - Link style types (normal, strong, strained)
// - Relationship strength slider
// - Shared-tag detection
// - Click → popup link editor
// - Right-click → delete link
// ------------------------------------------------------------

import { getSharedTag } from "../core/tags.js";

export function initLinks(app) {
  const svg = document.getElementById("links-layer");
  if (!svg) {
    console.error("links.js: #links-layer not found in DOM");
    return;
  }

  svg.style.position = "absolute";
  svg.style.inset = "0";
  svg.style.width = "100%";
  svg.style.height = "100%";
  svg.style.overflow = "visible";
  svg.style.pointerEvents = "auto";

  app.linksLayer = svg;
  app.renderLinks = () => renderLinks(app);

  console.log("Links renderer initialized.");
}

/* ------------------------------------------------------------
   WORLD → SCREEN conversion
------------------------------------------------------------ */
function worldToScreen(app, x, y) {
  const cam = app.state.camera;
  return {
    x: x * cam.zoom + cam.x,
    y: y * cam.zoom + cam.y
  };
}

/* ------------------------------------------------------------
   RENDER ALL LINKS
------------------------------------------------------------ */
function renderLinks(app) {
  const svg = app.linksLayer;
  if (!svg) return;

  const { nodes, links } = app.state;

  // Clear previous lines
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  for (const link of links) {
    const a = nodes.find(n => n.id === link.source || n.id === link.sourceId);
    const b = nodes.find(n => n.id === link.target || n.id === link.targetId);
    if (!a || !b) continue;

    const path = createPath(app, a, b, link);
    path.dataset.id = link.id;

    /* --------------------------------------------------------
       LEFT CLICK → OPEN POPUP LINK EDITOR
    -------------------------------------------------------- */
    path.addEventListener("click", (e) => {
      e.stopPropagation();

      app.state.selectedLink = link.id;
      app.renderLinks();

      const editor = document.getElementById("link-editor");
      const select = document.getElementById("link-type-select");
      const strengthSlider = document.getElementById("link-strength-slider");

      // Sync values
      select.value = link.type || "normal";
      strengthSlider.value = link.strength ?? 50;

      // Position popup
      editor.style.left = `${e.clientX + 10}px`;
      editor.style.top  = `${e.clientY + 10}px`;
      editor.style.display = "block";

      // Update link type
      select.onchange = () => {
        link.type = select.value;
        app.renderLinks();
      };

      // Strength slider logic
      strengthSlider.oninput = () => {
        link.strength = parseInt(strengthSlider.value);
        app.renderLinks();
      };

      // Delete button
      const del = document.getElementById("delete-link-btn");
      del.onclick = () => {
        app.state.links = app.state.links.filter(l => l.id !== link.id);
        editor.style.display = "none";
        app.renderLinks();
      };
    });

    /* --------------------------------------------------------
       RIGHT CLICK → DELETE IMMEDIATELY
    -------------------------------------------------------- */
    path.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      e.stopPropagation();
      deleteLink(app, link.id);
    });

    svg.appendChild(path);
  }
}

/* ------------------------------------------------------------
   DELETE LINK
------------------------------------------------------------ */
function deleteLink(app, id) {
  app.state.links = app.state.links.filter(l => l.id !== id);
  app.state.selectedLink = null;
  app.renderLinks();
}

/* ------------------------------------------------------------
   CREATE INDIVIDUAL LINK PATH
------------------------------------------------------------ */
function createPath(app, a, b, link) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "line");

  // Convert world coords
  let sp = worldToScreen(app, a.x, a.y);
  let tp = worldToScreen(app, b.x, b.y);

  // Offset so lines don't hit the node center
  const offset = 7;
  const dx = tp.x - sp.x;
  const dy = tp.y - sp.y;
  const len = Math.hypot(dx, dy) || 1;

  const ox = (dx / len) * offset;
  const oy = (dy / len) * offset;

  sp = { x: sp.x + ox, y: sp.y + oy };
  tp = { x: tp.x - ox, y: tp.y - oy };

  path.setAttribute("x1", sp.x);
  path.setAttribute("y1", sp.y);
  path.setAttribute("x2", tp.x);
  path.setAttribute("y2", tp.y);

  /* ------------------------------------------------------------
     TAG-BASED COLOR
  ------------------------------------------------------------ */
  const sharedTag = getSharedTag(a, b);
  path.style.stroke = sharedTag ? sharedTag.color : "#8acbff";

  /* ------------------------------------------------------------
     RELATIONSHIP STRENGTH (0–100)
  ------------------------------------------------------------ */
  const strength = link.strength ?? 50;    // default 50
  const intensity = strength / 100;        // normalize 0–1

  /* ------------------------------------------------------------
     LINK TYPE BASE WIDTH
  ------------------------------------------------------------ */
  let baseWidth = 3;
  let dashPattern = "none";

  if (link.type === "strong") {
    baseWidth = 5;
  }
  else if (link.type === "strained") {
    baseWidth = 3;
    dashPattern = "6 4";
  }

  // Add strength-based width increase
  const widthBoost = 4 * intensity; // up to +4px
  const finalWidth = baseWidth + widthBoost;

  path.style.strokeWidth = finalWidth;
  path.style.strokeDasharray = dashPattern;

  /* ------------------------------------------------------------
     SELECTED LINK = stronger glow
  ------------------------------------------------------------ */
  if (app.state.selectedLink === link.id) {
    const glow = 6 + 14 * intensity; // 6–20px
    path.style.filter = `drop-shadow(0 0 ${glow}px ${
      sharedTag ? sharedTag.color : "white"
    })`;
  }

  /* ------------------------------------------------------------
     TAG FILTERING SYSTEM
  ------------------------------------------------------------ */
  const activeFilter = app.state.filterTag;

  if (activeFilter) {
    const aHas = a.tags?.some(t => t.name === activeFilter);
    const bHas = b.tags?.some(t => t.name === activeFilter);

    if (aHas && bHas) {
      // Highlight matching links
      path.style.opacity = "1";
      path.style.filter =
        `drop-shadow(0 0 ${8 + 10 * intensity}px ${
          sharedTag ? sharedTag.color : "#fff"
        })`;
    } else {
      // Dim non-matching links
      path.style.opacity = "0.18";
      path.style.filter = "grayscale(100%) blur(0.5px)";
    }
  }

  // Make the stroke clickable
  path.style.pointerEvents = "stroke";

  return path;
}
