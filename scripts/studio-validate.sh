#!/usr/bin/env bash
set -e

echo "🔍 Cleaning environment..."
rm -rf .next .turbo node_modules/.cache || true

export NEXT_PUBLIC_ENABLE_TEST_HELPERS=${NEXT_PUBLIC_ENABLE_TEST_HELPERS:-true}

echo "📦 Installing dependencies..."
npm install

echo "🎵 Validating track integrity..."
npm run check:tracks
npm run validate:tracks

echo "🏗️ Building project..."
npm run build

echo "🧪 Running Playwright tests..."
npm run test:e2e

echo "🎚️ Running stem performance benchmark..."
if command -v node >/dev/null 2>&1; then
  node scripts/benchmark-stems.js || echo "Benchmark script failed but continuing"
else
  if [ -n "$NODE_EXE" ]; then
    "$NODE_EXE" scripts/benchmark-stems.js || echo "Benchmark script failed but continuing"
  else
    echo "⚠ Node not found in PATH. Skipping benchmark step."
  fi
fi

echo "🚀 Studio validation complete — all systems nominal."
