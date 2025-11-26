// src/ui/toolbar.js
// ------------------------------------------------------------
// TOOLBAR — Add Node / Connect Mode / Tag Filter / Auto-Connect
// + Export / Import
// ------------------------------------------------------------

export function initToolbar(app) {
  const bar = document.getElementById("toolbar");
  if (!bar) {
    console.error("toolbar.js: #toolbar missing");
    return;
  }

  bar.innerHTML = "";

  if (typeof app.state.connectMode !== "boolean") app.state.connectMode = false;
  if (!app.state.tagFilter) app.state.tagFilter = { active: false, term: "" };

  // Utility
  function makeButton(label, action) {
    const btn = document.createElement("button");
    btn.textContent = label;
    btn.onclick = action;
    return btn;
  }

  // ------------------------------------------------------------
  // BUTTONS
  // ------------------------------------------------------------

  const addNodeBtn = makeButton("Add Node", () => addNode(app));
  const connectBtn = makeButton("Connect", () => toggleConnect(app, connectBtn));
  const tagFilterBtn = makeButton("Tag Filter", () => runTagFilter(app));
  const autoConnectBtn = makeButton("Auto-Connect Tags", () => autoConnectTags(app));

  // Export / Import
  const exportBtn = makeButton("Export", () => exportProject(app));
  const importBtn = makeButton("Import", () => window.importProjectFromFile());

  bar.appendChild(addNodeBtn);
  bar.appendChild(connectBtn);
  bar.appendChild(tagFilterBtn);
  bar.appendChild(autoConnectBtn);
  bar.appendChild(exportBtn);
  bar.appendChild(importBtn);

  console.log("Toolbar ready.");
}


// ------------------------------------------------------------
// Add Node (center of screen)
// ------------------------------------------------------------
function addNode(app) {
  const id = "n" + (app.state.nodes.length + 1);
  const cam = app.state.camera;

  const x = (window.innerWidth / 2 - cam.x) / cam.zoom;
  const y = (window.innerHeight / 2 - cam.y) / cam.zoom;

  app.state.nodes.push({
    id,
    title: "New Node",
    clusterId: "c1",
    x,
    y,
    vx: 0,
    vy: 0,
    tags: []
  });

  app.renderNodes();
}


// ------------------------------------------------------------
// Connect Mode
// ------------------------------------------------------------
function toggleConnect(app, btn) {
  app.state.connectMode = !app.state.connectMode;
  btn.style.background = app.state.connectMode ? "#1e293b" : "#0b1220";
}


// ------------------------------------------------------------
// EXPORT PROJECT
// ------------------------------------------------------------
function exportProject(app) {
  const data = {
    nodes: app.state.nodes,
    links: app.state.links,
    clusters: app.state.clusters,
    globalTags: window.GlobalTags,
    camera: app.state.camera,
    version: "1.0"
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "galaxy-brain-project.json";
  a.click();
  URL.revokeObjectURL(url);
}


// ------------------------------------------------------------
// Tag Filter
// ------------------------------------------------------------
function runTagFilter(app) {
  const val = prompt("Enter tag to filter (blank to clear):");

  if (!val) {
    app.state.tagFilter = { active: false, term: "" };
  } else {
    app.state.tagFilter = { active: true, term: val.toLowerCase() };
  }

  app.renderNodes();
  app.renderLinks();
}


// ------------------------------------------------------------
// Auto-connect nodes sharing ANY tag
// ------------------------------------------------------------
function autoConnectTags(app) {
  const nodes = app.state.nodes;
  const links = app.state.links;

  const existingKey = new Set(
    links.map(l => [l.source, l.target].sort().join("::"))
  );

  const byTag = new Map();

  for (const node of nodes) {
    if (!node.tags) continue;
    for (const t of node.tags) {
      if (!byTag.has(t.name)) byTag.set(t.name, []);
      byTag.get(t.name).push(node);
    }
  }

  let created = 0;

  for (const [tag, group] of byTag.entries()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i].id;
        const b = group[j].id;

        const key = [a, b].sort().join("::");
        if (existingKey.has(key)) continue;

        app.state.links.push({
          id: `auto-${tag}-${a}-${b}-${Date.now()}`,
          source: a,
          target: b,
          type: "tag"
        });

        existingKey.add(key);
        created++;
      }
    }
  }

  console.log(`Auto-Connect Tags created: ${created} links.`);
  app.renderLinks();
}
