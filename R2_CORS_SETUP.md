# R2 Bucket CORS Configuration

To allow the Piko Studio frontend to read audio bytes for waveform generation and BPM analysis, apply the following CORS policy to the `piko-media` bucket in the Cloudflare Dashboard.

## Configuration Instructions

1. Log into the Cloudflare Dashboard
2. Navigate to R2 Object Storage
3. Select the `piko-media` bucket
4. Go to Settings → CORS Policy
5. Add the following JSON configuration:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://your-production-domain.com",
      "https://*.vercel.app"
    ],
    "AllowedMethods": [
      "GET",
      "HEAD"
    ],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": [
      "Content-Length",
      "Content-Range",
      "Cross-Origin-Resource-Policy"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

**Note:** Replace `https://your-production-domain.com` with your actual production domain. The wildcard pattern `https://*.vercel.app` allows all Vercel preview deployments to access the R2 bucket during development and testing.

## Critical Headers Explained

### AllowedOrigins
- **Development**: `http://localhost:3000` - For local Next.js development
- **Production**: `https://your-production-domain.com` - Replace with your actual production domain
- **Preview Deployments**: `https://*.vercel.app` - Allows all Vercel preview deployments for testing
- **Security Note**: While wildcards are generally discouraged, `https://*.vercel.app` is acceptable for Vercel-hosted applications as it's scoped to Vercel's controlled subdomain

### AllowedMethods
- **GET**: Required for streaming audio files to the browser
- **HEAD**: Required for the browser to check file metadata (size) before downloading

### ExposeHeaders
These headers are critical for the Web Audio API and waveform visualization:

- **Content-Length**: Without this header, the frontend cannot:
  - Determine the total size of the audio file
  - Display accurate loading progress bars
  - Efficiently allocate audio buffer memory

- **Content-Range**: Without this header, the browser cannot:
  - Perform "seeking" (jumping to a specific time in the track)
  - Make partial content requests (HTTP Range Requests)
  - Enable instant response when users click different parts of the timeline

- **Cross-Origin-Resource-Policy**: This is the explicit permission key for the COEP (Cross-Origin-Embedder-Policy) check. Without this header:
  - The browser will block loading of audio files due to the `COEP: require-corp` header set in next.config.mjs
  - SharedArrayBuffer (required for WebAssembly threading) will fail to load resources
  - The "Trusted Chain" requirement for cross-origin isolation cannot be established

### MaxAgeSeconds
- Caches the CORS preflight response for 3600 seconds (1 hour)
- Reduces overhead for subsequent requests from the same origin
- Improves performance for streaming applications with multiple audio stems

## Testing CORS Configuration

After applying the CORS policy, you can test it using the browser's developer console:

```javascript
// Test CORS headers from your frontend
fetch('https://[YOUR-ACCOUNT-ID].r2.cloudflarestorage.com/piko-media/test-file.mp3', {
  method: 'HEAD',
})
.then(response => {
  console.log('Content-Length exposed:', response.headers.has('content-length'));
  console.log('Content-Range exposed:', response.headers.has('content-range'));
  console.log('Cross-Origin-Resource-Policy exposed:', response.headers.has('cross-origin-resource-policy'));
})
.catch(error => console.error('CORS Error:', error));
```

## Integration with SharedArrayBuffer

The Next.js application serves content with strict security headers:
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`

This CORS configuration acts as the "opt-in" mechanism, establishing a trusted chain that allows the high-security Next.js frontend to load and process external audio assets for:
- WebAssembly (essentia.js, ffmpeg.wasm)
- Web Audio API processing
- Waveform visualization

## Production Deployment Checklist

- [ ] Update `AllowedOrigins` with your production Vercel domain
- [ ] Verify CORS headers are present in browser Network tab
- [ ] Test audio playback and waveform rendering
- [ ] Test seeking/scrubbing functionality
- [ ] Confirm no CORS errors in browser console
