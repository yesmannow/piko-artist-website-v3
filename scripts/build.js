#!/usr/bin/env node

// Unset problematic environment variables that cause "generate is not a function" error
delete process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
delete process.env.NEXT_DEPLOYMENT_ID;

// Check workers are compiled before building
import { execSync } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Run worker check (non-blocking, just warns)
try {
  execSync("node scripts/check-workers.js", {
    cwd: projectRoot,
    stdio: "inherit",
  });
} catch (error) {
  console.warn("\n⚠️  Worker check failed - continuing with build anyway");
  console.warn(
    '   Run "npm run build:workers" if workers need to be compiled\n',
  );
}

// Import and run Next.js build
execSync("next build", { stdio: "inherit" });
