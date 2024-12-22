#!/usr/bin/env node
import { ObsidianServer } from "./server.js";
import { createCreateNoteTool } from "./tools/create-note/index.js";
import { createEditNoteTool } from "./tools/edit-note/index.js";
import { createSearchVaultTool } from "./tools/search-vault/index.js";

async function main() {
  const vaultPath = process.argv[2];
  if (!vaultPath) {
    console.error("Please provide the path to your Obsidian vault");
    process.exit(1);
  }

  try {
    const server = new ObsidianServer(vaultPath);
    
    // Register tools
    server.registerTool(createCreateNoteTool(vaultPath));
    server.registerTool(createEditNoteTool(vaultPath));
    server.registerTool(createSearchVaultTool(vaultPath));

    await server.start();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
