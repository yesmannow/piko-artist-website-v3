#!/usr/bin/env node

/**
 * node20-check.mjs
 * 
 * Verifies that the current Node.js version is 20.x and runs
 * lint + build to ensure Vercel deployment compatibility.
 * 
 * This script MUST be run with Node 20:
 *   npx -y node@20 scripts/node20-check.mjs
 */

import { execSync } from 'child_process';
import { exit } from 'process';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`${colors.bright}${message}`, colors.cyan);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function success(message) {
  log(`✓ ${message}`, colors.green);
}

function error(message) {
  log(`✗ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ ${message}`, colors.yellow);
}

function runCommand(command, description) {
  try {
    log(`\n${colors.bright}Running: ${description}${colors.reset}`);
    log(`Command: ${command}`, colors.cyan);
    execSync(command, { stdio: 'inherit', encoding: 'utf-8' });
    success(`${description} completed successfully`);
    return true;
  } catch (err) {
    error(`${description} failed`);
    return false;
  }
}

// Main verification flow
async function main() {
  header('Node 20.x Verification Check for Vercel Deployment');

  // Step 1: Verify Node version
  log('\n📋 Step 1: Verify Node.js Version');
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));

  info(`Current Node.js version: ${nodeVersion}`);
  info(`npm version: ${execSync('npm -v', { encoding: 'utf-8' }).trim()}`);

  if (majorVersion !== 20) {
    header('FAIL: Node 20 build verification failed');
    error(`Expected Node.js 20.x, but found ${nodeVersion}`);
    error('This script must be run with Node 20.x');
    error('Use: npx -y node@20 scripts/node20-check.mjs');
    exit(1);
  }

  success(`Node.js version is ${nodeVersion} (20.x) ✓`);

  // Step 2: Run lint
  log('\n📋 Step 2: Run Linting');
  const lintSuccess = runCommand('npm run lint', 'ESLint check');
  if (!lintSuccess) {
    header('FAIL: Node 20 build verification failed');
    error('Linting failed. Fix lint errors before deploying.');
    exit(1);
  }

  // Step 3: Run build
  log('\n📋 Step 3: Run Production Build');
  const buildSuccess = runCommand('npm run build', 'Next.js production build');
  if (!buildSuccess) {
    header('FAIL: Node 20 build verification failed');
    error('Build failed. Fix build errors before deploying.');
    exit(1);
  }

  // All checks passed
  header('PASS: Node 20 build verified');
  success('Node version: 20.x ✓');
  success('Linting: PASS ✓');
  success('Build: PASS ✓');
  log('\n🚀 Ready for Vercel deployment!\n', colors.green);
  exit(0);
}

// Run the script
main().catch((err) => {
  header('FAIL: Node 20 build verification failed');
  error('Unexpected error during verification:');
  console.error(err);
  exit(1);
});
