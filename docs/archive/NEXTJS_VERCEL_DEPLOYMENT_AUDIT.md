# Next.js Vercel Deployment Audit - Complete Guide

**Version**: 1.0
**Last Updated**: 2024-12-19
**Next.js Version**: 15.5.9
**Target Platform**: Vercel (Linux)

---

## Table of Contents

1. [Pre-Audit Preparation](#pre-audit-preparation)
2. [Phase 1: Dependency Management](#phase-1-dependency-management)
3. [Phase 2: Configuration Verification](#phase-2-configuration-verification)
4. [Phase 3: Code Quality & Compatibility](#phase-3-code-quality--compatibility)
5. [Phase 4: Build Optimization](#phase-4-build-optimization)
6. [Phase 5: Environment Variables](#phase-5-environment-variables)
7. [Phase 6: Security Audit](#phase-6-security-audit)
8. [Phase 7: Performance Optimization](#phase-7-performance-optimization)
9. [Phase 8: Testing & Verification](#phase-8-testing--verification)
10. [Phase 9: Vercel Configuration](#phase-9-vercel-configuration)
11. [Phase 10: Deployment & Monitoring](#phase-10-deployment--monitoring)
12. [Troubleshooting Guide](#troubleshooting-guide)
13. [Best Practices Checklist](#best-practices-checklist)

---

## Pre-Audit Preparation

### Prerequisites

Before starting the audit, ensure you have:

- [ ] Node.js 20.x installed (matches `package.json` engines)
- [ ] Clean git working directory (commit or stash changes)
- [ ] Access to Vercel dashboard
- [ ] Environment variable documentation
- [ ] Production domain/URL ready
- [ ] Backup of current production (if updating)

### Initial Setup

```bash
# 1. Clean install dependencies
rm -rf node_modules package-lock.json
npm ci

# 2. Verify Node version
node -v  # Should be 20.x

# 3. Clear Next.js cache
rm -rf .next

# 4. Verify git status
git status
```

---

## Phase 1: Dependency Management

### 1.1 Package.json Structure

**Critical Checks:**

- [ ] **`"type": "module"`** is set (for ESM projects)
- [ ] **`engines.node`** matches Vercel's Node version (20.x)
- [ ] **Next.js version** is pinned (no caret `^` for production)
- [ ] **No duplicate dependencies** across `dependencies` and `devDependencies`

**Best Practices:**

```json
{
  "engines": {
    "node": ">=20 <21"  // Pin to specific major version
  },
  "dependencies": {
    "next": "15.5.9"  // Exact version, no ^
  }
}
```

### 1.2 Build-Time Dependencies

**CSS Tooling MUST be in `dependencies` (NOT `devDependencies`):**

- [ ] `tailwindcss` - Required for build
- [ ] `postcss` - Required for build
- [ ] `autoprefixer` - Required for build
- [ ] `tailwindcss-animate` - If used in `tailwind.config.ts`

**Why?** Vercel runs `npm ci --production` which excludes `devDependencies`. CSS processing happens at build time, so these packages must be available.

**Verification:**

```bash
# Check if CSS tooling is in dependencies
npm list tailwindcss postcss autoprefixer tailwindcss-animate --depth=0
```

### 1.3 Dependency Version Conflicts

**Check for conflicts:**

```bash
# Check for duplicate versions
npm ls --depth=0 | grep -E "(react|next|typescript)"

# Check for peer dependency warnings
npm install --dry-run 2>&1 | grep -i "peer\|warn\|error"
```

**Common Issues:**

- React version mismatch between `react` and `react-dom`
- TypeScript version conflicts
- Peer dependency warnings (should be resolved)

### 1.4 Optional Dependencies

**Review optional dependencies:**

- [ ] Check `optionalDependencies` in `package.json`
- [ ] Ensure optional deps don't break build if missing
- [ ] Document which features require optional deps

### 1.5 Lock File Verification

**Ensure lock file is committed:**

- [ ] `package-lock.json` exists and is committed
- [ ] Lock file is up to date (`npm ci` should not update it)
- [ ] No `.npmrc` overrides that could cause issues

**Verification:**

```bash
# Ensure lock file is in sync
npm ci
git diff package-lock.json  # Should show no changes
```

---

## Phase 2: Configuration Verification

### 2.1 ESM/CJS Correctness

**Critical for `"type": "module"` projects:**

#### 2.1.1 package.json

- [ ] `"type": "module"` is set
- [ ] All scripts use ESM-compatible commands
- [ ] No `require()` in scripts

#### 2.1.2 next.config.mjs

**Required ESM Pattern:**

```javascript
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  // config
};
```

**Checks:**

- [ ] Uses `import` statements (not `require()`)
- [ ] Uses `export default` (not `module.exports`)
- [ ] `__dirname` equivalent uses `fileURLToPath` pattern
- [ ] No CommonJS syntax

#### 2.1.3 tailwind.config.ts

**Required Pattern:**

```typescript
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config: Config = {
  // config
};

export default config;
```

**Checks:**

- [ ] Uses `import` statements
- [ ] Uses `export default` (not `module.exports`)
- [ ] TypeScript types are correct

#### 2.1.4 postcss.config.mjs

**Required Pattern:**

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Checks:**

- [ ] Uses `export default` (not `module.exports`)
- [ ] File extension is `.mjs` (or `.js` with `"type": "module"`)

### 2.2 TypeScript Configuration

#### 2.2.1 tsconfig.json Structure

**Required Settings:**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "jsx": "preserve",
    "incremental": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Checks:**

- [ ] `moduleResolution: "bundler"` (for Next.js 15)
- [ ] `paths` configured for aliases
- [ ] `baseUrl` matches path aliases
- [ ] `strict: true` for production safety

#### 2.2.2 Path Aliases

**Verification:**

```bash
# Check TypeScript can resolve paths
npx tsc --noEmit

# Check for path alias errors
npx tsc --noEmit 2>&1 | grep -i "cannot find module\|@/"
```

**Required Configuration:**

1. **tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

2. **next.config.mjs:**
```javascript
webpack: (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    '@': path.resolve(__dirname, 'src'),
  };
  return config;
}
```

### 2.3 Next.js Configuration

#### 2.3.1 next.config.mjs Best Practices

**Recommended Settings:**

```javascript
export default {
  reactStrictMode: true,  // Enable React strict mode
  swcMinify: true,        // Use SWC minification (default in Next.js 15)

  images: {
    formats: ['image/avif', 'image/webp'],  // Modern formats
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // Configure specific domains in production
      },
    ],
  },

  // Output file tracing for Vercel
  outputFileTracingRoot: __dirname,

  // Experimental features (use cautiously)
  experimental: {
    // Only enable if needed
  },
};
```

**Security Considerations:**

- [ ] `remotePatterns` should be specific domains (not `**`) in production
- [ ] No sensitive data in config
- [ ] `outputFileTracingRoot` set correctly

#### 2.3.2 Output Configuration

**For Vercel:**

- [ ] No `output: 'standalone'` (Vercel handles this)
- [ ] No `output: 'export'` (unless static site)
- [ ] `outputFileTracingRoot` set for monorepos

---

## Phase 3: Code Quality & Compatibility

### 3.1 Case-Sensitivity Audit

**CRITICAL for Linux (Vercel) deployment:**

Linux filesystems are case-sensitive. Windows/Mac are not. This causes build failures.

#### 3.1.1 Import Path Verification

**Run case-sensitivity check:**

```bash
npm run check:case
```

**Manual Verification:**

- [ ] All `@/` imports match exact file casing
- [ ] Directory names match import paths exactly
- [ ] File extensions match (`.tsx` vs `.ts`)

**Common Issues:**

- `@/components/DJInterface` vs `@/components/djinterface`
- `@/components/dj-ui/` vs `@/components/DJ-UI/`
- Mixed case in directory names

#### 3.1.2 File Naming Conventions

**Best Practices:**

- Use consistent casing (PascalCase for components, camelCase for utilities)
- Avoid mixed case in directory names
- Document naming conventions

### 3.2 Client/Server Component Separation

#### 3.2.1 Client Component Audit

**Check for Node.js-only imports in client components:**

```bash
# Search for Node.js modules in client components
grep -r "from ['\"]fs['\"]\|from ['\"]path['\"]\|from ['\"]child_process['\"]" src/components --include="*.tsx" --include="*.ts"
```

**Forbidden in Client Components:**

- `fs` - File system
- `path` - Path utilities (use browser APIs)
- `child_process` - Process execution
- `os` - OS utilities
- `crypto` (Node.js version) - Use Web Crypto API
- `http`/`https` - Use `fetch` instead

**Allowed:**

- `process.env.NODE_ENV` - Available in both
- `process.env.NEXT_PUBLIC_*` - Available in client
- Browser APIs (`window`, `document`, etc.)

#### 3.2.2 "use client" Directive

**Verification:**

- [ ] All client components have `"use client"` at top
- [ ] No server-only code in client components
- [ ] Hooks only used in client components

### 3.3 TypeScript Strictness

**Run TypeScript check:**

```bash
npx tsc --noEmit
```

**Checks:**

- [ ] No TypeScript errors
- [ ] No `any` types (unless necessary)
- [ ] All imports have proper types
- [ ] No `@ts-ignore` or `@ts-expect-error` (unless documented)

### 3.4 ESLint Configuration

**Run linter:**

```bash
npm run lint
```

**Checks:**

- [ ] No linting errors
- [ ] ESLint config matches Next.js version
- [ ] Custom rules don't conflict with Next.js

**Best Practices:**

- Use `eslint-config-next` matching Next.js version
- Fix all errors before deployment
- Document any intentional rule exceptions

---

## Phase 4: Build Optimization

### 4.1 Build Script Verification

**Check build script:**

```json
{
  "scripts": {
    "build": "next build"  // Or custom script
  }
}
```

**Custom Build Scripts:**

If using custom build script (e.g., `scripts/build.js`):

- [ ] Script uses ESM syntax
- [ ] Script handles environment variables correctly
- [ ] Script doesn't interfere with Vercel's build process

### 4.2 Build Output Verification

**Run production build:**

```bash
npm run build
```

**Expected Output:**

- [ ] Build completes successfully
- [ ] No errors or warnings
- [ ] `.next` directory created
- [ ] Static pages generated correctly
- [ ] API routes compiled

**Check Build Output:**

```bash
# Verify build artifacts
ls -la .next

# Check for build errors
npm run build 2>&1 | grep -i "error\|warn\|fail"
```

### 4.3 Bundle Size Analysis

**Analyze bundle sizes:**

```bash
# Install analyzer (optional)
npm install --save-dev @next/bundle-analyzer

# Add to next.config.mjs
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

**Targets:**

- [ ] First Load JS < 200KB (gzipped)
- [ ] No duplicate dependencies
- [ ] Large dependencies are code-split
- [ ] Images optimized

### 4.4 Image Optimization

**Next.js Image Component:**

- [ ] All images use `next/image`
- [ ] Images have proper `width` and `height`
- [ ] `sizes` prop set for responsive images
- [ ] `priority` only on above-the-fold images

**Remote Images:**

- [ ] `remotePatterns` configured in `next.config.mjs`
- [ ] Specific domains (not `**` in production)

---

## Phase 5: Environment Variables

### 5.1 Environment Variable Audit

**Required Files:**

- [ ] `.env.local` (local development, gitignored)
- [ ] `.env.example` (template, committed)
- [ ] `.env.production` (if needed, gitignored)

**Never Commit:**

- `.env.local`
- `.env.production`
- Any file with secrets

### 5.2 Variable Naming

**Client-Side Variables:**

- Must start with `NEXT_PUBLIC_`
- Available in browser
- Don't put secrets here

**Server-Side Variables:**

- No `NEXT_PUBLIC_` prefix
- Only available in server components/API routes
- Safe for secrets

### 5.3 Vercel Environment Variables

**Configuration:**

1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add variables for:
   - Production
   - Preview
   - Development

**Best Practices:**

- [ ] Use Vercel's environment variable UI
- [ ] Different values for production/preview
- [ ] Document all required variables
- [ ] Set optional variables with defaults

### 5.4 Variable Validation

**Create validation script:**

```typescript
// scripts/validate-env.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'API_KEY',
];

const missing = requiredEnvVars.filter(
  (key) => !process.env[key]
);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
```

**Runtime Checks:**

```typescript
// In API routes or server components
if (!process.env.REQUIRED_VAR) {
  throw new Error('REQUIRED_VAR is not set');
}
```

---

## Phase 6: Security Audit

### 6.1 Dependency Security

**Check for vulnerabilities:**

```bash
npm audit
npm audit fix
```

**Critical Checks:**

- [ ] No high/critical vulnerabilities
- [ ] All dependencies up to date
- [ ] No deprecated packages

### 6.2 API Route Security

**Best Practices:**

- [ ] Input validation on all API routes
- [ ] Rate limiting implemented
- [ ] CORS configured correctly
- [ ] Authentication/authorization checks
- [ ] No sensitive data in responses

### 6.3 Headers & Security

**Next.js Headers:**

```typescript
// next.config.mjs
export default {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
    ];
  },
};
```

### 6.4 Secrets Management

**Never:**

- [ ] Commit secrets to git
- [ ] Log secrets in console
- [ ] Expose secrets in client components
- [ ] Use `NEXT_PUBLIC_` for secrets

**Always:**

- [ ] Use environment variables
- [ ] Use Vercel's secret management
- [ ] Rotate secrets regularly
- [ ] Use different secrets for dev/prod

---

## Phase 7: Performance Optimization

### 7.1 Code Splitting

**Verify:**

- [ ] Dynamic imports for large components
- [ ] Route-based code splitting (automatic)
- [ ] Lazy loading for below-the-fold content

**Example:**

```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <p>Loading...</p>,
  ssr: false,  // If client-only
});
```

### 7.2 Font Optimization

**Next.js Font Optimization:**

- [ ] Use `next/font` for all fonts
- [ ] Fonts are self-hosted
- [ ] `display: 'swap'` configured
- [ ] Font subsets configured

### 7.3 Static Generation

**Where Possible:**

- [ ] Use `generateStaticParams` for dynamic routes
- [ ] Use `revalidate` for ISR
- [ ] Pre-render static pages

### 7.4 Caching Strategy

**Next.js Caching:**

- [ ] Proper cache headers set
- [ ] `revalidate` configured for ISR
- [ ] API routes cache appropriately
- [ ] Images cached correctly

---

## Phase 8: Testing & Verification

### 8.1 Pre-Build Tests

**Run all checks:**

```bash
# 1. Install dependencies
npm ci

# 2. Type check
npx tsc --noEmit

# 3. Lint
npm run lint

# 4. Case-sensitivity check
npm run check:case

# 5. Build
npm run build

# 6. Start production server
npm start
```

### 8.2 Local Production Test

**Test production build locally:**

```bash
npm run build
npm start
```

**Verify:**

- [ ] Site loads correctly
- [ ] All routes work
- [ ] No console errors
- [ ] Images load
- [ ] API routes work
- [ ] Environment variables work

### 8.3 Browser Testing

**Test in multiple browsers:**

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

**Check:**

- [ ] Responsive design works
- [ ] Touch interactions work
- [ ] No layout shifts
- [ ] Performance is acceptable

### 8.4 Accessibility Testing

**Tools:**

- Lighthouse (Chrome DevTools)
- axe DevTools
- WAVE

**Checks:**

- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient

---

## Phase 9: Vercel Configuration

### 9.1 vercel.json (Optional)

**Create if needed:**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ]
}
```

**Note:** Most settings are auto-detected. Only add if you need custom configuration.

### 9.2 Vercel Project Settings

**Dashboard Configuration:**

1. **General:**
   - [ ] Framework Preset: Next.js
   - [ ] Root Directory: `./` (or project root)
   - [ ] Build Command: `npm run build` (or custom)
   - [ ] Output Directory: `.next` (auto-detected)
   - [ ] Install Command: `npm ci`

2. **Environment Variables:**
   - [ ] All required variables set
   - [ ] Different values for Production/Preview/Development
   - [ ] Sensitive variables marked as "Sensitive"

3. **Deployment Settings:**
   - [ ] Node.js Version: 20.x (matches `engines.node`)
   - [ ] Auto-deploy from Git: Enabled
   - [ ] Preview deployments: Enabled

### 9.3 Domain Configuration

**Custom Domain:**

- [ ] Domain added in Vercel dashboard
- [ ] DNS records configured
- [ ] SSL certificate issued (automatic)
- [ ] Redirects configured if needed

---

## Phase 10: Deployment & Monitoring

### 10.1 Pre-Deployment Checklist

**Final Checks:**

- [ ] All tests pass locally
- [ ] Build succeeds locally
- [ ] Environment variables configured in Vercel
- [ ] Git branch is clean
- [ ] All changes committed
- [ ] Documentation updated

### 10.2 Deployment Process

**Steps:**

1. **Push to Git:**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Monitor Vercel Dashboard:**
   - Watch build logs
   - Check for errors
   - Verify deployment status

3. **Verify Deployment:**
   - Check production URL
   - Test critical paths
   - Verify environment variables
   - Check console for errors

### 10.3 Post-Deployment Verification

**Immediate Checks:**

- [ ] Site loads correctly
- [ ] All routes accessible
- [ ] API routes functional
- [ ] Images load
- [ ] No console errors
- [ ] Performance acceptable

**Monitoring:**

- [ ] Set up Vercel Analytics
- [ ] Configure error tracking (Sentry, etc.)
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### 10.4 Rollback Plan

**If Deployment Fails:**

1. Check Vercel build logs
2. Identify error
3. Fix locally
4. Test locally
5. Redeploy

**If Site is Broken:**

1. Use Vercel's "Redeploy" to previous version
2. Investigate issue
3. Fix and redeploy

---

## Troubleshooting Guide

### Common Build Errors

#### Error: "generate is not a function"

**Cause:** PostCSS/Tailwind processing issue with environment variables

**Solution:**
```javascript
// scripts/build.js
delete process.env.__NEXT_PRIVATE_STANDALONE_CONFIG;
delete process.env.NEXT_DEPLOYMENT_ID;
```

#### Error: "Cannot find module '@/...'"

**Cause:** Path alias not resolving

**Solution:**
1. Check `tsconfig.json` paths
2. Check `next.config.mjs` webpack alias
3. Verify file exists with exact casing

#### Error: "Module not found: Can't resolve 'fs'"

**Cause:** Node.js module imported in client component

**Solution:**
- Move to server component/API route
- Use browser alternative
- Use dynamic import with `ssr: false`

#### Error: Case-sensitivity issues

**Cause:** Import path doesn't match file casing

**Solution:**
```bash
npm run check:case
# Fix any mismatches
```

### Build Timeout

**Causes:**
- Large bundle size
- Slow build process
- Too many pages to generate

**Solutions:**
- Optimize bundle size
- Use ISR instead of SSG for large sites
- Increase Vercel build timeout (Pro plan)

### Environment Variable Issues

**Symptoms:**
- `undefined` values
- Build succeeds but runtime fails

**Solutions:**
1. Verify variables set in Vercel dashboard
2. Check variable names (case-sensitive)
3. Ensure `NEXT_PUBLIC_` prefix for client vars
4. Redeploy after adding variables

---

## Best Practices Checklist

### Code Quality

- [ ] TypeScript strict mode enabled
- [ ] ESLint configured and passing
- [ ] No `any` types
- [ ] Proper error handling
- [ ] Code is documented

### Performance

- [ ] Images optimized
- [ ] Code splitting implemented
- [ ] Fonts optimized
- [ ] Bundle size acceptable
- [ ] Lighthouse score > 90

### Security

- [ ] No secrets in code
- [ ] Dependencies audited
- [ ] API routes secured
- [ ] Headers configured
- [ ] CORS configured

### Accessibility

- [ ] WCAG compliant
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient

### SEO

- [ ] Metadata configured
- [ ] Open Graph tags
- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Structured data

### Monitoring

- [ ] Analytics configured
- [ ] Error tracking set up
- [ ] Uptime monitoring
- [ ] Performance monitoring

---

## Quick Reference Commands

```bash
# Clean install
npm ci

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Case-sensitivity check
npm run check:case

# Build
npm run build

# Start production server
npm start

# Audit dependencies
npm audit
npm audit fix

# Check bundle size
ANALYZE=true npm run build
```

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Best Practices](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

## Summary

This comprehensive audit covers all aspects of preparing a Next.js application for Vercel deployment. Follow each phase systematically, checking off items as you complete them. Address any issues before moving to the next phase.

**Key Takeaways:**

1. **Dependencies**: CSS tooling must be in `dependencies`
2. **Case-Sensitivity**: Critical for Linux builds
3. **ESM/CJS**: Must be consistent across all configs
4. **Environment Variables**: Properly configured in Vercel
5. **Testing**: Always test locally before deploying
6. **Monitoring**: Set up monitoring from day one

**Remember:** A successful deployment is the result of thorough preparation and testing. Don't skip steps, and always verify locally before deploying to production.

---

**Last Updated**: 2024-12-19
**Maintained By**: Development Team
**Next.js Version**: 15.5.9
**Vercel Platform**: Linux

