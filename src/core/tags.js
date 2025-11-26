// src/core/tags.js
// ------------------------------------------------------------
// CENTRAL TAG SYSTEM — FINAL WORKING VERSION
// ------------------------------------------------------------

export let GlobalTags = [];
window.GlobalTags = GlobalTags;

/* ------------------------------------------------------------
   Get a node's PRIMARY tag
------------------------------------------------------------ */
export function getPrimaryTag(node) {
  if (!node || !Array.isArray(node.tags) || node.tags.length === 0) return null;

  const first = node.tags[0];
  const global = GlobalTags.find(t => t.name === first.name);
  return global || first;
}

/* ------------------------------------------------------------
   Detect shared tag between two nodes
------------------------------------------------------------ */
export function getSharedTag(a, b) {
  if (!a.tags || !b.tags) return null;

  for (const ta of a.tags) {
    const match = b.tags.find(tb => tb.name === ta.name);
    if (match) {
      return GlobalTags.find(t => t.name === match.name) || match;
    }
  }
  return null;
}

/* ------------------------------------------------------------
   Add or update global tag
------------------------------------------------------------ */
export function addOrUpdateTag(name, color = "#38bdf8") {
  if (!name) return;

  let existing = GlobalTags.find(t => t.name === name);

  if (existing) {
    existing.color = color;
  } else {
    GlobalTags.push({ name, color });
  }
}

/* ------------------------------------------------------------
   Assign tag to node
------------------------------------------------------------ */
export function assignTagToNode(node, name) {
  if (!node) return;
  if (!Array.isArray(node.tags)) node.tags = [];

  let global = GlobalTags.find(t => t.name === name);

  if (!global) {
    global = { name, color: "#38bdf8" };
    GlobalTags.push(global);
  }

  let existing = node.tags.find(t => t.name === name);

  if (!existing) {
    node.tags.push({ name: global.name, color: global.color });
  } else {
    existing.color = global.color;
  }
}

/* ------------------------------------------------------------
   Sync node tags with global colors
------------------------------------------------------------ */
export function syncNodeTags(node) {
  if (!node.tags) node.tags = [];

  node.tags = node.tags.map(t => {
    const g = GlobalTags.find(gt => gt.name === t.name);
    return g ? { name: g.name, color: g.color } : t;
  });
}

/* ------------------------------------------------------------
   Toggle global filter
------------------------------------------------------------ */
export function toggleTagFilter(app, name) {
  if (app.state.filterTag === name) {
    app.state.filterTag = null;
  } else {
    app.state.filterTag = name;
  }

  app.renderNodes();
  app.renderLinks();
}

/* ------------------------------------------------------------
   Remove tag globally + clean all nodes
------------------------------------------------------------ */
export function deleteTag(name, app) {
  GlobalTags = GlobalTags.filter(t => t.name !== name);
  window.GlobalTags = GlobalTags;

  if (!app || !app.state?.nodes) return;

  for (const node of app.state.nodes) {
    node.tags = (node.tags || []).filter(t => t.name !== name);
  }
}
