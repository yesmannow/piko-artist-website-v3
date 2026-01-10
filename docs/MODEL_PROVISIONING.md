# Model Provisioning Guide

Complete guide for provisioning the ONNX model for stem separation in production and development.

---

## Quick Start (Unblock Me)

**For local development:**
```bash
npm run download:model
npm run verify:vercel
```

**For production deployment:**
1. Set `NEXT_PUBLIC_MODEL_URL` in Vercel dashboard
2. Or run `npm run download:model` and use Git LFS

---

## Model Provisioning Options

### Option A: External URL (Recommended for Production) ⭐

**Best for:** Production deployments, CI/CD, avoiding large Git repos

**Setup:**
1. Upload model to external hosting:
   - Cloudflare R2 (recommended - COEP compatible)
   - AWS S3 + CloudFront
   - Vercel Blob Storage
   - Any CDN that supports CORS
2. Set in Vercel **Environment Variables** (Production + Preview):
   ```
   NEXT_PUBLIC_MODEL_URL = https://your-cdn.com/models/demucs_v4_quantized.onnx
   ```

**How it works:**
- App automatically detects external URLs
- Routes through `/api/model` proxy (same-origin)
- Eliminates COEP/CORS issues
- No code changes needed

**Benefits:**
- ✅ No Git repository bloat
- ✅ Model updates without redeployment
- ✅ Works perfectly under COEP/COOP isolation
- ✅ No CORS configuration needed

**Gotcha:**
- If external host doesn't support COEP/CORP, the `/api/model` proxy handles it automatically
- No action needed - the app routes external URLs through the proxy

---

### Option B: Ship with App (Git LFS)

**Best for:** Small teams, offline development, self-contained deployments

**Setup:**

1. **Download the model:**
   ```bash
   npm run download:model
   ```
   This downloads to `public/models/demucs_v4_quantized.onnx`

2. **If model is >90MB, use Git LFS:**
   ```bash
   # Install Git LFS (if not already installed)
   git lfs install

   # Track ONNX files
   git lfs track "*.onnx"
   git add .gitattributes

   # Add model
   git add public/models/demucs_v4_quantized.onnx
   git commit -m "Add ONNX model via Git LFS"
   ```

3. **Enable LFS in Vercel:**
   - Go to Project Settings → Git
   - Enable "Git LFS" support

**Benefits:**
- ✅ No external dependencies
- ✅ Works offline
- ✅ No CORS/COEP issues
- ✅ Self-contained deployment

**Drawbacks:**
- ⚠️ Increases repository size
- ⚠️ Slower deployments if using LFS
- ⚠️ Model updates require redeployment

**File Size Warning:**
If the model is >90MB, the download script will warn you. For files this large:
- Use Git LFS (recommended)
- Or use external hosting (Option A)

---

### Option C: API Proxy (Automatic)

**Best for:** External URLs that don't support COEP/CORP

**How it works:**
- You set `NEXT_PUBLIC_MODEL_URL` to an external URL
- App automatically detects it's external (http/https)
- Routes it through `/api/model?url=ENCODED` (same-origin)
- Worker receives model from same origin (no CORS/COEP issues)

**No configuration needed** - this happens automatically when you set an external URL.

**Benefits:**
- ✅ Works with any external host
- ✅ No CORS configuration needed
- ✅ Automatic COEP compatibility
- ✅ Can add caching, authentication, rate limiting

**Security (Optional):**
Set `MODEL_HOST_ALLOWLIST` in Vercel to restrict which hosts can be proxied:
```
MODEL_HOST_ALLOWLIST = huggingface.co,cdn.example.com
```

---

## Model Source Priority

The app uses this priority order:

1. **`NEXT_PUBLIC_MODEL_URL` environment variable:**
   - If same-origin path (`/models/...`): use directly
   - If external URL (`http://...` or `https://...`): route through `/api/model` proxy
2. **Fallback:** `/models/demucs_v4_quantized.onnx` (local file)

---

## Verification Commands

### Development (Non-blocking)
```bash
npm run check:model
# or
npm run check:stem-assets
```
- ✅ Passes if ORT assets exist
- ⚠️ Warns if model missing (doesn't fail)
- Allows builds to proceed for development

### Pre-Deployment (Strict)
```bash
npm run verify:vercel
# or
npm run verify:stem-strict
```
- ✅ Passes if:
  - ORT assets exist AND
  - (Model file exists OR `NEXT_PUBLIC_MODEL_URL` is set)
- ❌ Fails if model missing AND no URL configured
- Use for CI/CD and pre-deployment checks

### Override Strict Mode
```bash
STEM_STRICT=0 npm run verify:stem-strict
```
- Allows verification to pass even without model
- Not recommended for production

---

## Download Script

**Download model for local development:**
```bash
npm run download:model
```

**Custom download URL:**
```bash
MODEL_DOWNLOAD_URL=https://custom-url.com/model.onnx npm run download:model
```

**Default source:**
- Hugging Face: `https://huggingface.co/timcsy/demucs-web-onnx/resolve/main/htdemucs_embedded.onnx?download=true`

**Features:**
- Downloads to `public/models/demucs_v4_quantized.onnx`
- Shows download progress and file size
- Warns if file is >90MB (recommends Git LFS)
- Never auto-commits to git
- Works on Windows PowerShell and Unix shells

---

## Troubleshooting

### "Model file missing" at runtime

**Check:**
1. Model file exists: `ls public/models/demucs_v4_quantized.onnx`
2. `NEXT_PUBLIC_MODEL_URL` is set correctly in Vercel
3. External URL is accessible: `npm run test:model-url`

**Solutions:**
- Run `npm run download:model` (if using Option B)
- Verify `NEXT_PUBLIC_MODEL_URL` in Vercel dashboard
- Test external URL: `npm run test:model-url`

### "blocked by Cross-Origin-Embedder-Policy"

**Solution:** This is handled automatically! External URLs are routed through `/api/model` proxy.

**If you still see errors:**
- Check `/api/model` route is accessible
- Verify `NEXT_PUBLIC_MODEL_URL` is set correctly
- Check browser console for specific error

### Verification fails in CI/CD

**Check:**
1. `NEXT_PUBLIC_MODEL_URL` is set in CI environment
2. Model file exists if using Option B
3. ORT assets are present (run `npm run build:assets`)

**Solutions:**
- Set `NEXT_PUBLIC_MODEL_URL` in CI environment variables
- Or ensure model file is committed (with Git LFS if large)

---

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_MODEL_URL` | Optional* | External model URL (Option A) |
| `MODEL_DOWNLOAD_URL` | Optional | Override default download URL |
| `MODEL_HOST_ALLOWLIST` | Optional | Restrict proxy to specific hosts |
| `STEM_STRICT` | Optional | Control strict verification (0/1) |

\* Required if model is not in `public/models/`

---

## File Locations

- **Model file:** `public/models/demucs_v4_quantized.onnx`
- **ORT WASM assets:** `public/ort/*.wasm`
- **Download script:** `scripts/download-model.mjs`
- **Verification scripts:** `scripts/check-stem-assets.mjs`, `scripts/verify-stem-assets-strict.mjs`

---

## Best Practices

1. **Production:** Use Option A (External URL) with `/api/model` proxy
2. **Development:** Use Option B (Download model) for offline work
3. **CI/CD:** Set `NEXT_PUBLIC_MODEL_URL` in environment variables
4. **Large files:** Always use Git LFS or external hosting
5. **Security:** Use `MODEL_HOST_ALLOWLIST` to restrict proxy hosts

---

## Quick Reference

```bash
# Download model for local dev
npm run download:model

# Check assets (non-blocking)
npm run check:model

# Strict verification (fails if model missing)
npm run verify:stem-strict

# Full deployment check
npm run verify:vercel

# Test external model URL
NEXT_PUBLIC_MODEL_URL=https://... npm run test:model-url
```
