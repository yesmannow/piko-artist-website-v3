#!/usr/bin/env node

// Unset problematic environment variables that cause "generate is not a function" error
delete process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
delete process.env.NEXT_DEPLOYMENT_ID;

// Import and run Next.js build
import { execSync } from 'child_process';
execSync('next build', { stdio: 'inherit' });

