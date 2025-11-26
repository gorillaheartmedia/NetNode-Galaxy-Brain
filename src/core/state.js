// src/core/state.js
// ------------------------------------------------------------
// CENTRAL STATE CONTAINER
// ------------------------------------------------------------
// Handles:
// - Nodes
// - Links
// - Clusters
// - Camera position & zoom
// - Selection
// - Interaction modes (connect / dragging)
// - Tag filtering
// ------------------------------------------------------------

export function initState() {
  return {

    /* ----------------------------------------------
       GRAPH STRUCTURE
    ---------------------------------------------- */
    nodes: [],     // { id, title, x, y, tags[], banner, avatar, etc. }
    links: [],     // { id, source, target, type }
    clusters: [],  // { id, name }

    /* ----------------------------------------------
       CAMERA + VIEWPORT
    ---------------------------------------------- */
    camera: {
      x: 0,
      y: 0,
      zoom: 1
    },

    /* ----------------------------------------------
       SELECTION
    ---------------------------------------------- */
    selectedNode: null,
    selectedLink: null,

    /* ----------------------------------------------
       LINK CREATION MODE
    ---------------------------------------------- */
    connectMode: false,
    connectingFrom: null,

    /* ----------------------------------------------
       NODE FILTERING (TAG FILTER SYSTEM)
    ---------------------------------------------- */
    filterTag: null,   // e.g. "Faction: Corp"

    /* ----------------------------------------------
       UNDO / FUTURE STATE MANAGEMENT (optional)
    ---------------------------------------------- */
    history: [],
    historyIndex: -1
  };
}
