# WSL2 Setup Script for Piko Studio Development
# Run this in WSL2 Ubuntu terminal to set up Node.js and validate builds

# Install Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Verify installation
node --version
npm --version
npx tsc --version

# Navigate to project (adjust path if different)
cd /mnt/c/dev/piko-artist-website-v3

# Install dependencies
npm ci

# Run TypeScript check
npx tsc -p tsconfig.json --noEmit

# Run full build
npm run build

# Run tests
npm run test:unit

echo "✅ WSL2 setup complete! Use this environment for reliable builds."
