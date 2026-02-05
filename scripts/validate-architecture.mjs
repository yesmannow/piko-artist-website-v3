#!/usr/bin/env node
/**
 * Architecture Validation Script
 * Validates code against Copilot instructions rules
 *
 * Non-Negotiables:
 * 1. Tone.js is ONLY audio engine (no WaveSurfer playback)
 * 2. WaveSurfer is visuals-only
 * 3. No client-side secrets (NEXT_PUBLIC_ only)
 * 4. Canonical trackKey (not full URLs)
 * 5. Service Worker disabled in dev
 *
 * Usage: node scripts/validate-architecture.mjs [filePath]
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

// Validation rules
const RULES = [
  {
    id: 'NO_WAVESURFER_PLAYBACK',
    severity: 'error',
    description: 'WaveSurfer must not be used for audio playback (Tone.js only)',
    patterns: [
      /wavesurfer\.play\(\)/i,
      /waveSurfer\.play\(\)/i,
      /ws\.play\(\)/i,
      /\.play\(\).*wavesurfer/i,
    ],
    message: '❌ WaveSurfer used for playback - Only Tone.js allowed for audio',
  },
  {
    id: 'NO_CLIENT_SECRETS',
    severity: 'error',
    description: 'Server secrets must not be exposed client-side',
    patterns: [
      /R2_ACCESS_KEY(?!_ID)/,
      /R2_SECRET/,
      /CLOUDFLARE_TOKEN/,
      /GITHUB_TOKEN/,
      /EMAIL_PASS/,
      /RESEND_API_KEY/,
    ],
    allowPatterns: [
      /NEXT_PUBLIC_/,
      /\/\/ @ts-expect-error/,
      /process\.env\.NODE_ENV/,
    ],
    message: '❌ Server secret exposed client-side - Use NEXT_PUBLIC_ prefix only',
  },
  {
    id: 'USE_TRACKKEY',
    severity: 'warning',
    description: 'Use normalized trackKey instead of full URLs as IDs',
    patterns: [
      /trackId:\s*url/,
      /id:\s*trackData\.url/,
      /\[trackData\.url\]/,
      /key=\{trackData\.url\}/,
    ],
    allowPatterns: [
      /normalizeTrackId/,
      /trackKey/,
    ],
    message: '⚠️  Using full URL as trackId - Use normalizeTrackId() to get trackKey',
  },
  {
    id: 'NO_DEV_SERVICE_WORKER',
    severity: 'error',
    description: 'Service Worker must be disabled in development',
    patterns: [
      /serviceWorker\.register/,
      /navigator\.serviceWorker/,
    ],
    allowPatterns: [
      /NODE_ENV.*production/,
      /process\.env\.NODE_ENV === ['"]production['"]/,
      /if.*production/,
    ],
    message: '❌ Service Worker enabled in dev - Gate with NODE_ENV === "production"',
  },
  {
    id: 'NO_AUDIOMOTION_PLAYBACK',
    severity: 'error',
    description: 'AudioMotion is visualization-only (like WaveSurfer)',
    patterns: [
      /audioMotion.*\.play/,
      /audioMotion.*connect.*player/i,
    ],
    message: '❌ AudioMotion used for playback - Connect to Tone.js output only',
  },
  {
    id: 'PREFER_REFS_OVER_STATE',
    severity: 'info',
    description: 'Use refs for frequently-changing values (avoid setState loops)',
    patterns: [
      /setState.*requestAnimationFrame/,
      /set[A-Z]\w+\(.*setTimeout/,
    ],
    message: '💡 Consider useRef instead of setState in animation loops',
  },
  {
    id: 'NO_MONSTER_FUNCTIONS',
    severity: 'warning',
    description: 'Functions should be <150 lines (split into smaller hooks)',
    check: (content) => {
      const functions = content.match(/function\s+\w+\s*\([^)]*\)\s*\{/g) || [];
      const violations = [];

      functions.forEach(fn => {
        const start = content.indexOf(fn);
        let braceCount = 0;
        let i = start;

        while (i < content.length) {
          if (content[i] === '{') braceCount++;
          if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) break;
          }
          i++;
        }

        const lines = content.substring(start, i).split('\n').length;
        if (lines > 150) {
          violations.push(`Function is ${lines} lines (max 150)`);
        }
      });

      return violations.length > 0 ? violations.join(', ') : null;
    },
    message: '⚠️  Large function detected - Split into smaller hooks/utilities',
  },
];

// Color codes for terminal
const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
};

function colorize(text, color) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

async function validateFile(filePath) {
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(ROOT, filePath);

  let content;
  try {
    content = await fs.readFile(fullPath, 'utf-8');
  } catch (err) {
    console.error(colorize(`❌ Cannot read file: ${filePath}`, 'red'));
    return { errors: 1, warnings: 0, info: 0 };
  }

  const violations = [];

  for (const rule of RULES) {
    if (rule.check) {
      // Custom check function
      const result = rule.check(content);
      if (result) {
        violations.push({ rule, line: null, match: result });
      }
    } else {
      // Pattern-based check
      for (const pattern of rule.patterns) {
        const matches = [...content.matchAll(new RegExp(pattern, 'g'))];

        for (const match of matches) {
          // Check if match is allowed
          let isAllowed = false;
          if (rule.allowPatterns) {
            const context = content.substring(
              Math.max(0, match.index - 100),
              Math.min(content.length, match.index + 100)
            );

            for (const allowPattern of rule.allowPatterns) {
              if (allowPattern.test(context)) {
                isAllowed = true;
                break;
              }
            }
          }

          if (!isAllowed) {
            // Get line number
            const before = content.substring(0, match.index);
            const lineNum = before.split('\n').length;

            violations.push({ rule, line: lineNum, match: match[0] });
          }
        }
      }
    }
  }

  // Print results
  const relativePath = path.relative(ROOT, fullPath);
  console.log(`\n📄 Validating: ${colorize(relativePath, 'blue')}`);

  if (violations.length === 0) {
    console.log(colorize('✅ All architecture rules passed!', 'green'));
    return { errors: 0, warnings: 0, info: 0 };
  }

  const counts = { errors: 0, warnings: 0, info: 0 };

  violations.forEach(({ rule, line, match }) => {
    const severity = rule.severity;
    counts[severity === 'error' ? 'errors' : severity === 'warning' ? 'warnings' : 'info']++;

    const color = severity === 'error' ? 'red' : severity === 'warning' ? 'yellow' : 'gray';
    const lineStr = line ? colorize(`:${line}`, 'gray') : '';

    console.log(`\n${rule.message}`);
    console.log(`  ${colorize(rule.id, color)}${lineStr}`);
    if (typeof match === 'string') {
      console.log(`  ${colorize('Found:', 'gray')} ${match}`);
    }
  });

  return counts;
}

async function validateDirectory(dirPath) {
  const fullPath = path.isAbsolute(dirPath) ? dirPath : path.join(ROOT, dirPath);

  const files = [];

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules, .next, archive
        if (!['node_modules', '.next', 'archive', 'dist', 'build'].includes(entry.name)) {
          await walk(entryPath);
        }
      } else if (entry.isFile()) {
        // Check TypeScript/JavaScript files
        if (/\.(tsx?|jsx?)$/.test(entry.name)) {
          files.push(entryPath);
        }
      }
    }
  }

  await walk(fullPath);
  return files;
}

async function main() {
  const target = process.argv[2];

  if (!target) {
    console.error(colorize('❌ Missing file or directory path', 'red'));
    console.log('\nUsage:');
    console.log('  node scripts/validate-architecture.mjs src/components/studio/pads/HotCuePads.tsx');
    console.log('  node scripts/validate-architecture.mjs src/components/studio/');
    process.exit(1);
  }

  console.log(colorize('\n🔍 Architecture Validator', 'blue'));
  console.log(colorize('Following: .github/copilot-instructions.md\n', 'gray'));

  let files = [];

  try {
    const stat = await fs.stat(target);

    if (stat.isDirectory()) {
      files = await validateDirectory(target);
      console.log(`Found ${files.length} files to validate\n`);
    } else {
      files = [target];
    }
  } catch (err) {
    console.error(colorize(`❌ Cannot access: ${target}`, 'red'));
    process.exit(1);
  }

  const totalCounts = { errors: 0, warnings: 0, info: 0 };

  for (const file of files) {
    const counts = await validateFile(file);
    totalCounts.errors += counts.errors;
    totalCounts.warnings += counts.warnings;
    totalCounts.info += counts.info;
  }

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log(colorize('\n📊 Summary', 'blue'));
  console.log(`   Files checked: ${files.length}`);
  console.log(`   ${colorize(`Errors: ${totalCounts.errors}`, totalCounts.errors > 0 ? 'red' : 'green')}`);
  console.log(`   ${colorize(`Warnings: ${totalCounts.warnings}`, totalCounts.warnings > 0 ? 'yellow' : 'green')}`);
  console.log(`   ${colorize(`Info: ${totalCounts.info}`, 'gray')}`);

  if (totalCounts.errors > 0) {
    console.log(colorize('\n❌ Validation failed - Fix errors before commit', 'red'));
    process.exit(1);
  } else if (totalCounts.warnings > 0) {
    console.log(colorize('\n⚠️  Validation passed with warnings', 'yellow'));
  } else {
    console.log(colorize('\n✅ All files pass architecture validation!', 'green'));
  }
}

main().catch(err => {
  console.error(colorize('❌ Unexpected error:', 'red'), err);
  process.exit(1);
});
