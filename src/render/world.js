// src/render/world.js

export function initWorld(app) {
  const world = document.getElementById("world");

  if (!world) {
    console.error("World element (#world) not found in DOM.");
    return;
  }

  // World is just the background / starfield / camera surface.
  // Nodes and links are NOT children of world anymore.
  app.world = world;

  console.log("World initialized.");
}
