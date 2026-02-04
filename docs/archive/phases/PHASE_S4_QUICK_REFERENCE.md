# PHASE S4 — Quick Reference

## Prevention System Overview

**Status:** ✅ Operational
**Components:** Pre-commit hooks + CI enforcement + Deterministic builds

---

## Commands

### Skip Pre-commit Hook (Emergency Only)
```bash
git commit --no-verify -m "message"
```
⚠️ **Warning:** CI will still enforce lint/build checks

### Run Lint-staged Manually
```bash
npx lint-staged
```

### Install Dependencies (Deterministic)
```bash
npm ci  # Use in CI, reproducible builds
npm install  # Use for development, updates lockfile
```

### Run Full Lint
```bash
npm run lint
```

### Run Build
```bash
npm run build
```

---

## What Gets Checked

### Pre-commit (Local)
- ✅ ESLint on staged `.ts`, `.tsx`, `.js`, `.jsx`, `.mjs` files
- ✅ Auto-fix applied where possible
- ❌ Commit blocked if errors remain

### CI (GitHub Actions)
- ✅ npm ci (deterministic install)
- ✅ Track validation
- ✅ TypeScript type check
- ✅ Full lint (entire codebase)
- ✅ Studio audit
- ✅ Production build
- ✅ E2E tests (Playwright)

---

## Files

### Configuration
- `.husky/pre-commit` - Runs `npx lint-staged`
- `package.json` - lint-staged config
- `.github/workflows/ci.yml` - Main CI workflow
- `package-lock.json` - Dependency lockfile (committed)

### Scripts
```json
{
  "prepare": "husky",           // Auto-installs hooks
  "lint": "next lint",          // Full lint
  "build": "next build"         // Production build
}
```

---

## Troubleshooting

### Pre-commit Hook Not Running
```bash
# Reinstall husky hooks
npm run prepare
```

### Lint Errors Blocking Commit
```bash
# Run lint to see all errors
npm run lint

# Auto-fix where possible
npx eslint --fix <file>

# Emergency: bypass (not recommended)
git commit --no-verify
```

### CI Failing on Lint
```bash
# Run locally first
npm run lint
npm run build

# Fix errors before pushing
```

### Package Lock Conflicts
```bash
# Regenerate from package.json
rm package-lock.json
npm install

# Or accept upstream version
git checkout --theirs package-lock.json
npm install
```

---

## Best Practices

1. ✅ **Run `npm run lint` before pushing** large changes
2. ✅ **Use `npm ci` in Docker/CI environments** for speed and reproducibility
3. ✅ **Commit `package-lock.json`** after dependency changes
4. ✅ **Don't use `--no-verify`** unless absolutely necessary
5. ✅ **Fix lint errors incrementally** rather than bypassing checks

---

## Quick Checklist

Before committing:
- [ ] Changes work locally
- [ ] No console errors
- [ ] Lint passes (auto-checked by pre-commit hook)
- [ ] Types are correct

Before pushing:
- [ ] `npm run lint` passes
- [ ] `npm run build` succeeds
- [ ] No merge conflicts

Before merging PR:
- [ ] All CI checks green
- [ ] Code reviewed
- [ ] No lint errors introduced
- [ ] Build succeeds

---

## Next Phase Recommendations

### Priority 1: Fix Existing Lint Errors
- 40+ setState-in-effect violations
- 20+ Math.random() purity violations
- 15+ max-lines-per-function violations

### Priority 2: Add Prettier
```bash
npm install -D prettier
```

### Priority 3: Add Commit Message Linting
```bash
npm install -D @commitlint/cli @commitlint/config-conventional
```

---

**Prevention System Active:** ✅
**Last Updated:** February 4, 2026
