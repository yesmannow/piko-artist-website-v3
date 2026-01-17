#!/usr/bin/env node

/**
 * clean-node-modules.mjs
 *
 * Cross-platform script to remove node_modules directory.
 * Works with ES modules (package.json has "type": "module").
 */

import { rmSync } from "fs";
import { existsSync } from "fs";

const nodeModulesPath = "./node_modules";

if (existsSync(nodeModulesPath)) {
  try {
    rmSync(nodeModulesPath, { recursive: true, force: true });
    console.log("✓ Removed node_modules directory");
  } catch (error) {
    console.error("✗ Failed to remove node_modules:", error.message);
    process.exit(1);
  }
} else {
  console.log("ℹ node_modules directory does not exist");
}
