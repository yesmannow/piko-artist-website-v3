# Deployment & Runtime Validation Guide

## Overview

This guide covers post-deployment validation to ensure the application runs correctly in a cross-origin isolated browser environment on Vercel with real assets.

---

## 1. ONNX Model Provisioning Strategy

The build now allows passing without the model, but **stems will be broken at runtime** unless you configure one of these options:

### Option A: External Model URL (Fastest Setup)

**Configuration:**

1. Upload model to external hosting (R2, S3, CDN, etc.)
2. Set in Vercel **Environment Variables** (Production + Preview):
   ```
   NEXT_PUBLIC_MODEL_URL = https://your-cdn.com/models/demucs_v4_quantized.onnx
   ```

**Gotcha:** Your `/studio` routes are COOP/COEP isolated for SharedArrayBuffer. External fetches can fail unless:

- The model host sends proper CORS headers
- The model host is compatible with COEP/CORP

**If you see errors like:**

- "blocked by Cross-Origin-Embedder-Policy"
- "CORS policy blocked"
- Failed `fetch` in console

**Solution:** Use Option C (API proxy) below.

### Option B: Ship Model with App

**Configuration:**

1. Place the model file at:

   ```
   public/models/demucs_v4_quantized.onnx
   ```

2. If the model is large (>100MB), use Git LFS:

   ```bash
   git lfs install
   git lfs track "*.onnx"
   git add .gitattributes
   git add public/models/demucs_v4_quantized.onnx
   git commit -m "Add ONNX model via LFS"
   ```

3. Enable LFS support in Vercel project settings.

**Benefits:**

- No external dependencies
- Works under COEP/COOP
- No CORS issues

**Drawbacks:**

- Increases repository size
- Slower deployments if using LFS

### Option C: API Proxy Route (Most Reliable Under COEP) ⭐ **RECOMMENDED**

**Configuration:**

1. Set `NEXT_PUBLIC_MODEL_URL` to your external model URL in Vercel
2. The app automatically proxies it through `/api/model` (same-origin)
3. Worker uses `/api/model` instead of external URL

**How it works:**

- External URL is set in environment variable
- `useStemService` automatically detects external URLs and routes them through `/api/model`
- API route fetches the model server-side and streams it
- Worker receives model from same origin (no CORS/COEP issues)

**Benefits:**

- Works perfectly under COEP/COOP isolation
- No CORS configuration needed on external host
- Can add caching, authentication, rate limiting
- Same-origin requests are always allowed

**Implementation:**

- ✅ API route: `src/app/api/model/route.ts`
- ✅ Auto-detection in `useStemService.ts`
- ✅ Automatic fallback to direct URL if not external

---

## 2. ORT Runtime Assets Verification

**After deployment, verify in browser DevTools → Network:**

1. Open `/studio` page
2. Open DevTools → Network tab
3. Filter by "wasm"
4. Confirm:
   - ✅ `.../ort/ort-wasm-simd-threaded.wasm` loads (200 OK)
   - ✅ No 404 errors for ORT assets
   - ✅ No console errors like "failed to load wasm" or "cannot find wasmPaths"

**If ORT assets fail to load:**

- Check `public/ort/` directory exists in deployment
- Verify `scripts/copy-ort-assets.mjs` runs during build
- Check build logs for asset copy errors

---

## 3. Deployment Smoke Test Checklist

After Vercel deployment, run through this checklist:

### A. Studio Isolation ✅

**Test:** Visit `/studio`

**Expected:**

- Console: `crossOriginIsolated === true`
- No errors about SharedArrayBuffer
- Audio engine initializes successfully

**If `crossOriginIsolated === false`:**

- Check middleware.ts sets COOP/COEP headers for `/studio*` routes
- Verify service worker doesn't cache studio routes (see `sw.ts`)
- Check Vercel headers configuration

### B. Sync (Phase 9B) ✅

**Test:**

1. Load 2 tracks with detectable BPM
2. Enable "tempo-only" sync
3. Enable "tempo+phase" sync
4. Disable sync

**Expected:**

- ✅ Rate returns to normal when disabling sync
- ✅ Beat nudge doesn't produce obvious audible jumpiness
- ✅ Sync indicators update correctly

**If sync is jumpy:**

- Increase nudge threshold in sync controller
- Restrict nudges to near downbeats only

### C. Key Detection (Phase 9C) ✅

**Test:**

1. Load tracks
2. Wait for key analysis
3. Change master deck
4. Check compatibility highlighting

**Expected:**

- ✅ Key analysis returns Camelot codes (or "unavailable" state)
- ✅ Compatibility highlighting changes when master deck changes
- ✅ No console errors from key worker

**If key detection fails:**

- Check `essentia.js` worker loads correctly
- Verify key worker compiles (check `public/workers/key.worker.js`)

### D. Stem Separation (Phase 8B) ✅

**Test:**

1. Ensure model is available (Option A, B, or C above)
2. Click stem separation button
3. Monitor progress
4. Test cancellation

**Expected:**

- ✅ Progress increments per chunk
- ✅ Cancellation works immediately
- ✅ Output stems route correctly to deck channels
- ✅ No console errors about model loading

**If stem separation fails:**

- Check model URL is accessible
- Verify ORT WASM assets load (see section 2)
- Check console for specific error messages
- If COEP error: use Option C (API proxy)

---

## 4. Verification Scripts

### Regular Build (Warns, Doesn't Fail)

```bash
npm run build
```

- Uses `check-stem-assets.mjs` (warns if model missing)
- Allows builds to pass for development

### Strict Verification (Fails if Model Missing)

```bash
npm run verify:vercel
```

- Uses `verify-stem-assets-strict.mjs`
- **Fails** if model missing UNLESS `NEXT_PUBLIC_MODEL_URL` is set
- Use for CI/CD and pre-deployment checks

### Override Strict Mode

```bash
STEM_STRICT=0 npm run verify:vercel
```

- Allows verification to pass even without model
- Not recommended for production deployments

---

## 5. Font Paths Verification

**Current Setup:**

- Fonts are in `public/fonts/`
- Layout uses `../../public/fonts/...` paths
- ✅ Production build passes

**If Vercel fails to resolve fonts:**

- Move fonts to `src/assets/fonts/`
- Update paths in `layout.tsx` to `./assets/fonts/...`
- Rebuild and redeploy

**Current Status:** ✅ Working (no changes needed)

---

## 6. Environment Variables Checklist

**Required for Production:**

| Variable                | Required   | Purpose                                       |
| ----------------------- | ---------- | --------------------------------------------- |
| `NEXT_PUBLIC_MODEL_URL` | Optional\* | ONNX model URL (external or use `/api/model`) |
| `MODEL_URL`             | Optional\* | Alternative model URL (build-time)            |

\* Required if model is not in `public/models/`

**Set in Vercel Dashboard:**

1. Go to Project Settings → Environment Variables
2. Add for **Production** and **Preview** environments
3. Redeploy after adding variables

---

## 7. Troubleshooting Common Issues

### Issue: "blocked by Cross-Origin-Embedder-Policy"

**Cause:** External model URL doesn't support COEP/CORP

**Solution:** Use Option C (API proxy route `/api/model`)

### Issue: "Model file missing" at runtime

**Cause:** Model not available at configured URL

**Solutions:**

1. Verify `NEXT_PUBLIC_MODEL_URL` is set correctly
2. Test URL in browser (should download .onnx file)
3. Check API proxy route if using `/api/model`
4. Verify model file exists if using Option B

### Issue: ORT WASM assets 404

**Cause:** Assets not copied during build

**Solutions:**

1. Check `scripts/copy-ort-assets.mjs` runs in build
2. Verify `public/ort/` exists in deployment
3. Check build logs for asset copy errors

### Issue: `crossOriginIsolated === false`

**Cause:** COOP/COEP headers not set correctly

**Solutions:**

1. Check `middleware.ts` sets headers for `/studio*` routes
2. Verify service worker doesn't interfere
3. Check Vercel headers configuration

---

## 8. Post-Deployment Validation Script

After deployment, run this in browser console on `/studio`:

```javascript
// Check isolation
console.log("Cross-origin isolated:", self.crossOriginIsolated);

// Check model availability
fetch("/api/model")
  .then((r) => {
    console.log("Model proxy:", r.ok ? "✅ Available" : "❌ Failed");
  })
  .catch((e) => console.error("Model proxy error:", e));

// Check ORT assets
fetch("/ort/ort-wasm-simd-threaded.wasm")
  .then((r) => {
    console.log("ORT WASM:", r.ok ? "✅ Available" : "❌ Failed");
  })
  .catch((e) => console.error("ORT WASM error:", e));
```

---

## Summary

**Recommended Setup:**

1. ✅ Use **Option C (API Proxy)** for model hosting
2. ✅ Set `NEXT_PUBLIC_MODEL_URL` in Vercel dashboard
3. ✅ Run `npm run verify:vercel` before deploying
4. ✅ Test all features in deployed environment
5. ✅ Monitor console for COEP/CORS errors

**If you encounter COEP/CORS issues with external model:**

- The app automatically uses `/api/model` proxy for external URLs
- No code changes needed
- Just set `NEXT_PUBLIC_MODEL_URL` and deploy
