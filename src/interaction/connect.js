// src/interaction/connect.js
//
// Handles: creating new links between nodes by clicking source → target.
// Works with: drag.js, nodes.js, links.js, select.js

export function initConnect(app) {
  console.log("Connect system active.");

  let linkingFrom = null;

  // When a node is clicked (from nodes.js), this handler may run
  app.onNodeClick = (node, e) => {
    e.stopPropagation();

    // If the node was dragged → DO NOT process linking
    if (node._wasDragged) return;

    // If user is editing the panel → ignore linking
    if (e.target.closest("#info-panel")) return;

    // If no link-creation mode enabled → ignore
    if (!app.state.connectMode) {
      // Normal behavior: selecting a node
      app.state.selectedNode = node.id;
      return;
    }

    /* ----------------------------------------------------------
       LINK CREATION LOGIC
       Click #1 → choose source node
       Click #2 → choose target node
    ---------------------------------------------------------- */

    // STEP 1: Pick source
    if (!linkingFrom) {
      linkingFrom = node.id;
      app.state.selectedNode = node.id;
      console.log("Link source selected:", node.id);
      return;
    }

    // STEP 2: Pick target
    const sourceId = linkingFrom;
    const targetId = node.id;

    // Prevent self-link
    if (sourceId === targetId) {
      console.warn("Cannot link node to itself.");
      linkingFrom = null;
      return;
    }

    // Prevent duplicate link (same direction)
    const exists = app.state.links.some(
      l => l.source === sourceId && l.target === targetId
    );

    if (exists) {
      console.warn("Link already exists.");
      linkingFrom = null;
      return;
    }

    // Create new link
    const newLink = {
      id: "link_" + Math.random().toString(36).slice(2),
      source: sourceId,
      target: targetId,
      type: "normal"
    };

    app.state.links.push(newLink);
    console.log("Link created:", newLink);

    linkingFrom = null;

    // Update visuals
    app.renderLinks();
  };

  /* ----------------------------------------------------------
     ENABLE / DISABLE CONNECT MODE
     (Optional UI hook from toolbar.js)
  ---------------------------------------------------------- */

  app.enableConnectMode = () => {
    app.state.connectMode = true;
    linkingFrom = null;
    console.log("Connect mode ENABLED");
  };

  app.disableConnectMode = () => {
    app.state.connectMode = false;
    linkingFrom = null;
    console.log("Connect mode DISABLED");
  };
}
