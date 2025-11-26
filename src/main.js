// src/main.js
// ------------------------------------------------------------
// GALAXY BRAIN ENGINE — MAIN ENTRY POINT
// ------------------------------------------------------------

// CORE
import { initState } from './core/state.js';
import { GlobalTags } from './core/tags.js';

// RENDERERS
import { initWorld } from './render/world.js';
import { initNodes } from './render/nodes.js';
import { initLinks } from './render/links.js';

// UI
import { initToolbar } from './ui/toolbar.js';
import { initPanel } from './ui/panel.js';
import { initContextMenu } from './ui/contextMenu.js';

// INTERACTION
import { initPanZoom } from './interaction/panzoom.js';
import { initSelection } from './interaction/select.js';
import { initDrag } from './interaction/drag.js';
import { initConnect } from './interaction/connect.js';

// PHYSICS
import { initPhysics } from './physics/forceEngine.js';


// ------------------------------------------------------------
// APP ROOT + STATE
// ------------------------------------------------------------
export const App = {
  state: initState(),
  root: document.getElementById("app")
};

window.App = App;


// ------------------------------------------------------------
// INIT ENGINE LAYERS
// ------------------------------------------------------------
initWorld(App);
initNodes(App);
initLinks(App);


// ------------------------------------------------------------
// SAMPLE DATA
// ------------------------------------------------------------
App.state.clusters.push({ id: "c1", name: "Main Cluster" });

App.state.nodes.push(
  { id: "n1", title: "Kara Voss",   clusterId: "c1", x: 220, y: 240, tags: [], imgMode: "auto" },
  { id: "n2", title: "Bishop Null", clusterId: "c1", x: 480, y: 320, tags: [], imgMode: "auto" },
  { id: "n3", title: "Alcibiades",  clusterId: "c1", x: 140, y: 120, tags: [], imgMode: "auto" }
);

App.state.links.push(
  { id: "l1", source: "n1", target: "n2", type: "normal",   strength: 50 },
  { id: "l2", source: "n2", target: "n3", type: "strained", strength: 70 }
);


// ------------------------------------------------------------
// UI INIT
// ------------------------------------------------------------
initToolbar(App);
initPanel(App);
initContextMenu(App);


// ------------------------------------------------------------
// INTERACTION INIT
// ------------------------------------------------------------
initPanZoom(App);
initSelection(App);
initDrag(App);
initConnect(App);


// ------------------------------------------------------------
// PHYSICS INIT
// ------------------------------------------------------------
initPhysics(App);


// ------------------------------------------------------------
// FIRST RENDER
// ------------------------------------------------------------
App.renderNodes();
App.renderLinks();

console.log("%cGalaxy Brain Engine Loaded", "color:#7dd3fc;font-size:16px;");


// ------------------------------------------------------------
// POPUP LINK EDITOR (close when clicking outside)
// ------------------------------------------------------------
document.addEventListener("click", (e) => {
  const editor = document.getElementById("link-editor");
  if (!editor) return;
  if (!editor.contains(e.target)) editor.style.display = "none";
});

document.getElementById("link-editor").addEventListener("click", (e) => {
  e.stopPropagation();
});


// ------------------------------------------------------------
// IMPORT / EXPORT SUPPORT
// ------------------------------------------------------------

export function importProject(data) {
  try {
    App.state.nodes = data.nodes || [];
    App.state.links = data.links || [];
    App.state.clusters = data.clusters || [];

    window.GlobalTags.length = 0;
    (data.globalTags || []).forEach(t => window.GlobalTags.push(t));

    if (data.camera) App.state.camera = data.camera;

    App.renderNodes();
    App.renderLinks();

    console.log("%cProject Imported Successfully!", "color:#7bfca1");
  } catch (e) {
    console.error("Import failed:", e);
  }
}


// AUTO-LOAD
const saved = localStorage.getItem("galaxyBrainProject");
if (saved) {
  importProject(JSON.parse(saved));
  console.log("%cAutosave loaded.", "color:#9bf");
}


// AUTO-SAVE EVERY 5 SECONDS
setInterval(() => {
  const snapshot = {
    nodes: App.state.nodes,
    links: App.state.links,
    clusters: App.state.clusters,
    globalTags: window.GlobalTags,
    camera: App.state.camera
  };
  localStorage.setItem("galaxyBrainProject", JSON.stringify(snapshot));
}, 5000);


// FILE IMPORT HANDLER
const importInput = document.createElement("input");
importInput.type = "file";
importInput.accept = ".json";
importInput.style.display = "none";
document.body.appendChild(importInput);

window.importProjectFromFile = () => importInput.click();

importInput.onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const text = await file.text();
  importProject(JSON.parse(text));
};
