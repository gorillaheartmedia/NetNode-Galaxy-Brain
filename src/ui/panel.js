// src/ui/ppanel.js
// -------------------------------------------------------------
// HYBRID PANEL (Option C) WITH GLOBAL TAG CHIP BAR + LINKS TAB
// This is the COMPLETE, MERGED, ERROR-FREE VERSION
// -------------------------------------------------------------

import {
  GlobalTags,
  assignTagToNode,
  addOrUpdateTag,
  deleteTag,
  syncNodeTags,
  toggleTagFilter
} from "../core/tags.js";

export function initPanel(app) {
  buildPanelDOM(app);

  app.openPanel = (node) => openPanel(app, node);
  app.closePanel = () => closePanel(app);
  app.updatePanel = (node) => updatePanel(app, node);

  console.log("Panel system ready.");
}

/* -------------------------------------------------------------
   PANEL BASE DOM
------------------------------------------------------------- */
function buildPanelDOM(app) {
  const panel = document.createElement("div");
  panel.id = "info-panel";

  panel.style.cssText = `
    position:absolute;
    top:0;
    right:-460px;
    width:460px;
    height:100%;
    background:rgba(8,12,24,0.97);
    backdrop-filter:blur(14px);
    border-left:1px solid rgba(140,185,255,0.35);
    box-shadow:-6px 0 28px rgba(0,0,0,0.45);
    transition:right .35s ease;
    z-index:200;
    display:flex;
    flex-direction:column;
  `;

  panel.innerHTML = `
    <!-- BANNER -->
    <div id="panel-header" style="position:relative;height:180px;overflow:hidden;">
      <img id="panel-banner" style="width:100%;height:100%;object-fit:cover;display:none;">
      <input id="panel-banner-input" type="file" accept="image/*" style="display:none">
      <button id="panel-banner-btn"
        style="position:absolute;bottom:10px;right:14px;
               background:#1a2e46;color:#9bd9ff;
               padding:6px 12px;border-radius:6px;
               border:1px solid rgba(140,185,255,0.4);cursor:pointer;">
        Change Banner
      </button>
    </div>

    <!-- AVATAR -->
    <div id="panel-avatar-container"
      style="position:absolute;top:135px;left:20px;width:120px;height:120px;
             border-radius:50%;border:3px solid rgba(160,220,255,0.6);
             overflow:hidden;cursor:pointer;">
      <img id="panel-avatar" style="width:100%;height:100%;object-fit:cover;display:none;">
      <input id="panel-avatar-input" type="file" accept="image/*" style="display:none">
    </div>

    <!-- CLOSE -->
    <button id="panel-close"
      style="position:absolute;top:10px;right:10px;
             background:#162236;color:#9bd9ff;
             padding:6px 12px;border-radius:6px;
             border:1px solid rgba(140,185,255,0.45);cursor:pointer;">✕</button>

    <!-- TABS -->
    <div id="panel-tabs"
      style="margin-top:80px;display:flex;padding:0 22px;
             border-bottom:1px solid rgba(120,180,255,0.2);
             white-space:nowrap;">

      <div class="tab-btn active" data-tab="info"
        style="padding:10px 12px;margin-right:12px;cursor:pointer;color:#9bd9ff;">
        Info
      </div>

      <div class="tab-btn" data-tab="notes"
        style="padding:10px 12px;margin-right:12px;cursor:pointer;color:#9bd9ff;">
        Notes
      </div>

      <div class="tab-btn" data-tab="custom"
        style="padding:10px 12px;margin-right:12px;cursor:pointer;color:#9bd9ff;">
        Custom
      </div>

      <div class="tab-btn" data-tab="tags"
        style="padding:10px 12px;margin-right:12px;cursor:pointer;color:#9bd9ff;">
        Tags
      </div>

      <div class="tab-btn" data-tab="links"
        style="padding:10px 12px;margin-right:12px;cursor:pointer;color:#9bd9ff;">
        Links
      </div>
    </div>

    <div id="panel-content"
      style="flex-grow:1;padding:22px;overflow-y:auto;color:#c8e9ff;"></div>
  `;

  app.root.appendChild(panel);
  document.getElementById("panel-close").onclick = () => closePanel(app);

  setupTabEvents(app);
}

/* -------------------------------------------------------------
   TAB SWITCHING
------------------------------------------------------------- */
function setupTabEvents(app) {
  const tabs = document.querySelectorAll(".tab-btn");

  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      loadTab(app, tab.dataset.tab);
    };
  });

  document.getElementById("panel-banner-btn").onclick = () =>
    document.getElementById("panel-banner-input").click();

  document.getElementById("panel-avatar-container").onclick = () =>
    document.getElementById("panel-avatar-input").click();
}

/* -------------------------------------------------------------
   OPEN PANEL
------------------------------------------------------------- */
function openPanel(app, node) {
  app.state.selectedNode = node.id;

  syncNodeTags(node);

  const panel = document.getElementById("info-panel");
  panel.style.right = "0px";

  applyImage("panel-banner", node.banner);
  applyImage("panel-avatar", node.avatar);

  setupImageUpload(app, node);

  loadTab(app, "info");
}

/* -------------------------------------------------------------
   LOAD TAB
------------------------------------------------------------- */
function loadTab(app, tabName) {
  const node = app.state.nodes.find(n => n.id === app.state.selectedNode);
  const content = document.getElementById("panel-content");

  if (!node || !content) return;

  if (tabName === "info") renderInfoTab(app, node, content);
  else if (tabName === "notes") renderNotesTab(app, node, content);
  else if (tabName === "custom") renderCustomTab(app, node, content);
  else if (tabName === "tags") renderTagsTab(app, node, content);
  else if (tabName === "links") renderLinksTab(app, node, content);
}

/* -------------------------------------------------------------
   INFO TAB
------------------------------------------------------------- */
function renderInfoTab(app, node, content) {
  content.innerHTML = `
    <div class="node-card"
      style="background:#0e1626;padding:18px;border-radius:10px;
             border:1px solid rgba(120,180,255,0.3);
             box-shadow:0 0 14px rgba(80,140,255,0.15);">

      <label style="font-weight:600;">Name</label>
      <input id="node-panel-title" value="${node.title || ""}"
        style="${inputStyle()}">

      <label style="font-weight:600;">Cluster</label>
      <input id="node-panel-cluster" value="${node.clusterId || ""}"
        style="${inputStyle()}">

      <label style="font-weight:600;">Role / Type</label>
      <input id="node-panel-role" value="${node.role || ""}"
        style="${inputStyle()}">

      <label style="font-weight:600;">Image Placement</label>
      <select id="node-panel-image-mode" style="${inputStyle()}padding:8px;">
        <option value="auto"  ${node.imgMode==="auto"?"selected":""}>Auto</option>
        <option value="fit"   ${node.imgMode==="fit"?"selected":""}>Fit</option>
        <option value="fill"  ${node.imgMode==="fill"?"selected":""}>Fill</option>
        <option value="thumb" ${node.imgMode==="thumb"?"selected":""}>Thumbnail</option>
      </select>

      <hr style="margin:18px 0;border-color:rgba(120,180,255,0.2);">

      <button id="node-panel-delete-node"
        style="background:#3b0f18;border:1px solid rgba(200,80,80,0.7);
               color:#ffb9b9;padding:10px 14px;border-radius:8px;
               cursor:pointer;width:100%;font-size:14px;font-weight:600;">
        Delete Node
      </button>
    </div>
  `;

  wireInfoEvents(app, node);
}

/* -------------------------------------------------------------
   INFO TAB LOGIC (HELPER)
------------------------------------------------------------- */
function wireInfoEvents(app, node) {

  document.getElementById("node-panel-title").oninput = (e) => {
    node.title = e.target.value;
    app.renderNodes();
  };

  document.getElementById("node-panel-cluster").oninput = (e) => {
    node.clusterId = e.target.value;
  };

  document.getElementById("node-panel-role").oninput = (e) => {
    node.role = e.target.value;
  };

  document.getElementById("node-panel-image-mode").onchange = (e) => {
    node.imgMode = e.target.value;
    app.renderNodes();
  };

  document.getElementById("node-panel-delete-node").onclick = () => {
    if (!confirm("Delete this node and all its links?")) return;

    app.state.links = app.state.links.filter(
      l => l.source !== node.id && l.target !== node.id
    );

    app.state.nodes = app.state.nodes.filter(n => n.id !== node.id);

    app.closePanel();
    app.renderNodes();
    app.renderLinks();
  };
}

/* -------------------------------------------------------------
   NOTES TAB
------------------------------------------------------------- */
function renderNotesTab(app, node, content) {
  content.innerHTML = `
    <div class="node-card"
      style="background:#0e1626;padding:18px;border-radius:10px;
             border:1px solid rgba(120,180,255,0.3);
             box-shadow:0 0 14px rgba(80,140,255,0.15);">

      <label style="font-weight:600;">Notes</label>
      <textarea id="node-panel-notes" rows="12"
        style="width:100%;padding:10px;background:#09111d;
               border:1px solid rgba(120,180,255,0.4);
               color:#c8e9ff;border-radius:6px;resize:vertical;">
${node.notes || ""}
      </textarea>
    </div>
  `;

  document.getElementById("node-panel-notes").oninput = (e) => {
    node.notes = e.target.value;
  };
}

/* -------------------------------------------------------------
   CUSTOM TAB
------------------------------------------------------------- */
function renderCustomTab(app, node, content) {
  if (!node.customBlocks) node.customBlocks = [];

  content.innerHTML = `
    <div class="node-card"
      style="background:#0e1626;padding:18px;border-radius:10px;
             border:1px solid rgba(120,180,255,0.3);
             box-shadow:0 0 14px rgba(80,140,255,0.15);">

      <button id="add-custom-block"
        style="background:#1a2e46;border:1px solid rgba(120,180,255,0.4);
               color:#9bd9ff;padding:8px 12px;border-radius:6px;
               cursor:pointer;width:100%;margin-bottom:18px;font-weight:600;">
        + Add Section
      </button>

      <div id="custom-blocks-container"></div>
    </div>
  `;

  const container = document.getElementById("custom-blocks-container");

  for (const [i, block] of node.customBlocks.entries()) {
    addCustomBlockUI(node, block, i, container);
  }

  document.getElementById("add-custom-block").onclick = () => {
    const block = {
      label: "New Section",
      value: "",
      height: 140,
      width: "100%"
    };
    node.customBlocks.push(block);
    addCustomBlockUI(node, block, node.customBlocks.length - 1, container);
  };
}

function addCustomBlockUI(node, block, index, container) {
  const wrapper = document.createElement("div");

  wrapper.style.cssText = `
    background:#09111d;border:1px solid rgba(120,180,255,0.3);
    border-radius:8px;padding:12px;margin-bottom:16px;
  `;

  wrapper.innerHTML = `
    <input class="custom-block-label"
      value="${block.label}" style="${inputStyle("100%")}margin-bottom:8px;">

    <textarea class="custom-block-text"
      style="width:${block.width};height:${block.height}px;
             padding:10px;background:#0b1220;
             border:1px solid rgba(120,180,255,0.4);
             border-radius:6px;color:#c8e9ff;resize:both;overflow:auto;">${block.value}</textarea>
  `;

  const label = wrapper.querySelector(".custom-block-label");
  const text = wrapper.querySelector(".custom-block-text");

  label.oninput = () => {
    block.label = label.value;
  };
  text.oninput = () => {
    block.value = text.value;
  };
  text.onmouseup = () => {
    block.height = text.clientHeight;
    block.width = text.style.width || "100%";
  };

  container.appendChild(wrapper);
}

/* -------------------------------------------------------------
   TAGS TAB (with Global Tag Chips)
------------------------------------------------------------- */
function renderTagsTab(app, node, content) {
  syncNodeTags(node);

  content.innerHTML = `
    <div class="node-card"
      style="background:#0e1626;padding:18px;border-radius:10px;
             border:1px solid rgba(120,180,255,0.3);
             box-shadow:0 0 14px rgba(80,140,255,0.15);">

      <label style="font-weight:600;">Existing Tags</label>
      <div id="global-tag-chips"
        style="margin:10px 0 20px;display:flex;flex-wrap:wrap;gap:8px;">
      </div>

      <label style="font-weight:600;">Add New Tag</label>
      <div style="display:flex;gap:10px;margin-top:8px;">
        <input id="tag-name-input" placeholder="Tag name"
          style="${inputStyle("65%")}">
        <input id="tag-color-input" type="color"
          style="width:40px;height:36px;padding:0;border:none;">
        <button id="tag-add-btn"
          style="padding:8px 14px;background:#1a2e46;
                 border:1px solid rgba(120,180,255,0.4);
                 color:#9bd9ff;border-radius:6px;cursor:pointer;">
          Add
        </button>
      </div>

      <div id="tag-list" style="margin-top:18px;"></div>
    </div>
  `;

  renderGlobalTagChips(app, node);

  const list = document.getElementById("tag-list");
  for (const tag of node.tags) {
    addTagRow(app, node, tag, list);
  }

  const nameInput = document.getElementById("tag-name-input");
  const colorInput = document.getElementById("tag-color-input");

  document.getElementById("tag-add-btn").onclick = () => {
    const name = nameInput.value.trim();
    if (!name) return;

    const color = colorInput.value || "#38bdf8";

    addOrUpdateTag(name, color);
    assignTagToNode(node, name);

    syncNodeTags(node);
    app.renderNodes();
    app.renderLinks();

    renderTagsTab(app, node, content);
  };
}

/* -------------------------------------------------------------
   CHIP BAR: global existing tags
------------------------------------------------------------- */
function renderGlobalTagChips(app, node) {
  const container = document.getElementById("global-tag-chips");
  if (!container) return;

  container.innerHTML = "";

  if (!GlobalTags.length) {
    container.innerHTML = `<div style="opacity:0.6;font-size:12px;">No global tags yet.</div>`;
    return;
  }

  GlobalTags.forEach(tag => {
    const chip = document.createElement("div");
    chip.style.cssText = `
      padding:6px 12px;
      border-radius:999px;
      border:1px solid ${tag.color};
      background:${tag.color}22;
      color:${tag.color};
      cursor:pointer;
      font-size:12px;
      user-select:none;
      transition:0.15s;
    `;
    chip.textContent = tag.name;

    const has = node.tags?.some(t => t.name === tag.name);
    if (has) {
      chip.style.background = tag.color;
      chip.style.color = "#000";
      chip.style.fontWeight = "600";
    }

    chip.onclick = () => {
      assignTagToNode(node, tag.name);
      syncNodeTags(node);
      app.renderNodes();
      app.renderLinks();
      renderTagsTab(app, node, document.getElementById("panel-content"));
    };

    chip.oncontextmenu = (e) => {
      e.preventDefault();
      toggleTagFilter(app, tag.name);
    };

    container.appendChild(chip);
  });
}

/* -------------------------------------------------------------
   HELPER: Tag Row Inside Node
------------------------------------------------------------- */
function addTagRow(app, node, tag, list) {
  const row = document.createElement("div");
  row.style.cssText = `
    display:flex;gap:10px;align-items:center;
    padding:8px;margin-bottom:10px;
    background:#0d1524;border-radius:8px;
    border:1px solid rgba(120,180,255,0.25);
  `;

  row.innerHTML = `
    <div style="width:14px;height:14px;border-radius:50%;background:${tag.color};"></div>

    <input class="tag-name" value="${tag.name}"
      style="${inputStyle("50%")}margin-bottom:0;">

    <input class="tag-color" type="color" value="${tag.color}"
      style="width:40px;height:30px;padding:0;border:none;">

    <button class="tag-primary"
      style="padding:4px 8px;font-size:11px;
             background:#112031;color:#9bd9ff;
             border:1px solid rgba(120,180,255,0.4);
             border-radius:6px;cursor:pointer;">
      ${node.tags[0].name === tag.name ? "Primary" : "Make Primary"}
    </button>

    <button class="tag-delete"
      style="padding:4px 8px;font-size:11px;
             background:#351016;color:#ffb3b3;
             border:1px solid rgba(220,80,80,0.6);
             border-radius:6px;cursor:pointer;">
      ✕
    </button>
  `;

  row.querySelector(".tag-name").oninput = (e) => {
    const newName = e.target.value.trim();
    if (!newName) return;

    const global = GlobalTags.find(t => t.name === tag.name);
    if (global) global.name = newName;

    tag.name = newName;
    syncNodeTags(node);
  };

  row.querySelector(".tag-color").oninput = (e) => {
    addOrUpdateTag(tag.name, e.target.value);
    app.state.nodes.forEach(n => syncNodeTags(n));
    app.renderNodes();
    app.renderLinks();
  };

  row.querySelector(".tag-primary").onclick = () => {
    node.tags = node.tags.filter(t => t.name !== tag.name);
    node.tags.unshift(tag);
    syncNodeTags(node);
    app.renderNodes();
    renderTagsTab(app, node, document.getElementById("panel-content"));
  };

  row.querySelector(".tag-delete").onclick = () => {
    node.tags = node.tags.filter(t => t.name !== tag.name);
    app.renderNodes();
    renderTagsTab(app, node, document.getElementById("panel-content"));
  };

  row.oncontextmenu = (e) => {
    e.preventDefault();
    toggleTagFilter(app, tag.name);
  };

  list.appendChild(row);
}

/* -------------------------------------------------------------
   LINKS TAB
------------------------------------------------------------- */
function renderLinksTab(app, node, content) {
  const links = app.state.links.filter(
    l => l.source === node.id || l.target === node.id
  );

  content.innerHTML = `
    <div class="node-card"
      style="background:#0e1626;padding:18px;border-radius:10px;
             border:1px solid rgba(120,180,255,0.3);
             box-shadow:0 0 14px rgba(80,140,255,0.15);">

      <h3 style="margin:0 0 14px;color:#9bd9ff;font-size:16px;">
        Connections (${links.length})
      </h3>

      <div id="links-list"></div>
    </div>
  `;

  const list = document.getElementById("links-list");

  if (links.length === 0) {
    list.innerHTML = `<div style="opacity:0.6;">No links for this node.</div>`;
    return;
  }

  for (const link of links) {
    const otherId = link.source === node.id ? link.target : link.source;
    const other = app.state.nodes.find(n => n.id === otherId) || { title: "Unknown" };

    const row = document.createElement("div");
    row.style.cssText = `
      display:flex;align-items:center;justify-content:space-between;
      padding:8px;margin-bottom:10px;
      background:#09111d;border-radius:8px;
      border:1px solid rgba(120,180,255,0.25);
    `;

    row.innerHTML = `
      <div style="flex:1;color:#c8e9ff;">
        <b>${other.title}</b><br>
        <small>Type: ${link.type || "normal"}</small><br>
        <small>Strength: ${link.strength ?? 50}</small>
      </div>

      <button class="edit-link-btn"
        style="margin-right:6px;background:#1a2e46;
               border:1px solid rgba(120,180,255,0.4);
               color:#9bd9ff;border-radius:6px;
               padding:4px 8px;cursor:pointer;">
        Edit
      </button>

      <button class="delete-link-btn"
        style="background:#3b0f18;
               border:1px solid rgba(200,80,80,0.7);
               color:#ffb3b3;border-radius:6px;
               padding:4px 8px;cursor:pointer;">
        ✕
      </button>
    `;

    row.querySelector(".edit-link-btn").onclick = (e) => {
      e.stopPropagation();

      const popup = document.getElementById("link-editor");
      popup.style.left = "200px";
      popup.style.top = "200px";
      popup.style.display = "block";
      popup.style.pointerEvents = "auto";

      document.getElementById("link-type-select").value =
        link.type || "normal";
      document.getElementById("link-strength-slider").value =
        link.strength ?? 50;

      document.getElementById("link-type-select").onchange = (ev) => {
        link.type = ev.target.value;
        app.renderLinks();
        renderLinksTab(app, node, content);
      };

      document.getElementById("link-strength-slider").oninput = (ev) => {
        link.strength = parseInt(ev.target.value);
        app.renderLinks();
        renderLinksTab(app, node, content);
      };

      document.getElementById("delete-link-btn").onclick = () => {
        app.state.links = app.state.links.filter(l => l.id !== link.id);
        popup.style.display = "none";
        popup.style.pointerEvents = "none";
        app.renderLinks();
        renderLinksTab(app, node, content);
      };
    };

    row.querySelector(".delete-link-btn").onclick = () => {
      app.state.links = app.state.links.filter(l => l.id !== link.id);
      app.renderLinks();
      renderLinksTab(app, node, content);
    };

    list.appendChild(row);
  }
}

/* -------------------------------------------------------------
   IMAGE UPLOAD
------------------------------------------------------------- */
function setupImageUpload(app, node) {
  const banner = document.getElementById("panel-banner-input");
  const avatar = document.getElementById("panel-avatar-input");

  banner.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      node.banner = r.result;
      applyImage("panel-banner", node.banner);
    };
    r.readAsDataURL(f);
  };

  avatar.onchange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      node.avatar = r.result;
      applyImage("panel-avatar", node.avatar);
    };
    r.readAsDataURL(f);
  };
}

function applyImage(id, data) {
  const img = document.getElementById(id);
  if (!img) return;

  if (!data) {
    img.style.display = "none";
  } else {
    img.src = data;
    img.style.display = "block";
  }
}

/* -------------------------------------------------------------
   CLOSE / UPDATE PANEL
------------------------------------------------------------- */
function closePanel(app) {
  document.getElementById("info-panel").style.right = "-460px";
}

function updatePanel(app, node) {
  // Reserved for reactive systems
}

/* -------------------------------------------------------------
   INPUT STYLE
------------------------------------------------------------- */
function inputStyle(width = "100%") {
  return `
    width:${width};
    padding:8px;
    margin-bottom:12px;
    background:#09111d;
    border:1px solid rgba(120,180,255,0.4);
    border-radius:6px;
    color:#c8e9ff;
  `;
}
