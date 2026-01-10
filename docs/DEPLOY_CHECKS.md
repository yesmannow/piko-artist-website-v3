# Deploy Checks

## Vercel Deployment Verification

To ensure your changes are compatible with Vercel's Node 20.x deployment environment, run the following command locally:

```bash
npm run verify:vercel
```

This command will:
- Verify that the build runs under Node 20.x
- Run ESLint to check for code quality issues
- Run the Next.js production build to catch any build errors

### What it does

The verification script uses `npx -y node@20` to automatically download and use Node 20.x, regardless of your system's default Node version. This ensures that the build behavior matches Vercel's deployment environment.

### Exit codes

- **Exit 0**: All checks passed ✅
- **Exit 1**: One or more checks failed ❌

### Requirements

- npm (no need to install Node 20 globally)
- Internet connection (for first-time npx download of Node 20)

### Clean verification

If you want to verify with a clean installation of dependencies:

```bash
npm run verify:vercel:clean
```

This will remove `node_modules`, reinstall all dependencies, and then run the verification.

## CI/CD Integration

This verification is designed to be run locally before pushing code, but can also be integrated into:
- Pre-commit hooks
- Pre-push hooks
- CI/CD pipelines

## Troubleshooting

### Build fails locally but passes on Vercel (or vice versa)

This can happen if your local Node version differs from Vercel's. Always use `npm run verify:vercel` to test with the same Node version that Vercel uses.

### "npx: command not found"

Make sure you have npm installed. npx is included with npm 5.2.0 and higher.

### Slow first run

The first time you run `verify:vercel`, npx will download Node 20.x. Subsequent runs will be faster as it uses a cached version.
