# Track API Endpoints — Migration Guide

**Last Updated**: February 3, 2026
**Status**: Legacy endpoints redirect to canonical endpoint

---

## Overview

All track-related API calls should use the **canonical endpoint**: `/api/tracks`

Legacy endpoints remain for backwards compatibility but permanently redirect (HTTP 308) to the canonical endpoint.

---

## Canonical Endpoint

### `GET /api/tracks`

**Base URL**: `/api/tracks`

**Modes**:

1. **List all tracks** (no query params)
   ```bash
   GET /api/tracks
   ```
   **Response**:
   ```json
   {
     "tracks": [...],
     "count": 26
   }
   ```

2. **Resolve single track** (with `trackId` param)
   ```bash
   GET /api/tracks?trackId=te-perdi
   ```
   **Response**:
   ```json
   {
     "track": {
       "id": "te-perdi",
       "title": "Te Perdi",
       "url": "/audio/tracks/te-perdi.mp3",
       ...
     }
   }
   ```

---

## Legacy Endpoints (308 Redirects)

### `GET /api/get-track`

**Status**: DEPRECATED — Permanently redirects to `/api/tracks`

**Behavior**:
- Returns HTTP 308 Permanent Redirect
- Preserves all query parameters
- Clients that follow redirects will work seamlessly

**Example**:
```bash
curl -i http://localhost:3000/api/get-track?trackId=te-perdi

# Returns:
# HTTP/1.1 308 Permanent Redirect
# Location: http://localhost:3000/api/tracks?trackId=te-perdi
```

**Migration**:
```diff
- GET /api/get-track?trackId=te-perdi
+ GET /api/tracks?trackId=te-perdi
```

---

### `GET /api/studio/track`

**Status**: DEPRECATED — Permanently redirects to `/api/tracks`

**Behavior**:
- Returns HTTP 308 Permanent Redirect
- Preserves all query parameters
- Clients that follow redirects will work seamlessly

**Example**:
```bash
curl -i http://localhost:3000/api/studio/track?trackId=te-perdi

# Returns:
# HTTP/1.1 308 Permanent Redirect
# Location: http://localhost:3000/api/tracks?trackId=te-perdi
```

**Migration**:
```diff
- GET /api/studio/track?trackId=te-perdi
+ GET /api/tracks?trackId=te-perdi
```

---

## Why HTTP 308?

**308 Permanent Redirect** indicates:
- The resource has **permanently moved** to a new URI
- The request method and body are **preserved** (important for API semantics)
- Clients should **update their bookmarks/links** to the new location
- More semantically correct than 301 for API endpoints

---

## Migration Checklist

### For Internal Code
- ✅ All internal code already uses `/api/tracks`
- ✅ No code changes required

### For External Consumers
If you maintain external code calling these APIs:

1. **No immediate action required**
   - Legacy endpoints will continue to work via redirects
   - Most HTTP clients follow 308 redirects automatically

2. **Recommended: Update to canonical endpoint**
   ```diff
   - fetch('/api/get-track?trackId=te-perdi')
   + fetch('/api/tracks?trackId=te-perdi')
   ```

3. **Test redirect behavior**
   ```bash
   # With redirect following (most clients)
   curl -L http://localhost:3000/api/get-track?trackId=te-perdi
   # → Returns track JSON

   # Without redirect following (see headers)
   curl -i http://localhost:3000/api/get-track?trackId=te-perdi
   # → Returns 308 + Location header
   ```

---

## Timeline

| Date | Action |
|------|--------|
| Feb 3, 2026 | Legacy endpoints changed from 410 Gone → 308 Redirect |
| Mar 3, 2026 | Consider removing legacy endpoints (30 days) |
| TBD | Delete legacy endpoints if no external usage detected |

---

## Examples

### JavaScript/TypeScript (fetch)

```typescript
// ✅ Recommended (canonical endpoint)
const response = await fetch('/api/tracks?trackId=te-perdi');
const { track } = await response.json();

// ⚠️ Still works (redirects automatically)
const response = await fetch('/api/get-track?trackId=te-perdi');
// fetch() follows redirects by default
const { track } = await response.json();
```

### cURL

```bash
# Follow redirects automatically
curl -L http://localhost:3000/api/get-track?trackId=te-perdi

# See redirect headers
curl -i http://localhost:3000/api/get-track?trackId=te-perdi
```

### Axios

```javascript
// Axios follows redirects by default
const response = await axios.get('/api/get-track?trackId=te-perdi');
// Automatically redirects to /api/tracks?trackId=te-perdi
```

---

## Architecture

```
Legacy Endpoints                   Canonical Endpoint
┌─────────────────────┐            ┌──────────────────┐
│ /api/get-track      │  308 →     │                  │
│ ?trackId=te-perdi   │  redirect  │  /api/tracks     │
└─────────────────────┘            │  ?trackId=...    │
                                   │                  │
┌─────────────────────┐  308 →     │  Returns:        │
│ /api/studio/track   │  redirect  │  { track: ... }  │
│ ?trackId=te-perdi   │            │  or              │
└─────────────────────┘            │  { tracks: [...] │
                                   └──────────────────┘
```

---

## Support

For questions or issues:
1. Check this migration guide
2. Review `/api/tracks` endpoint documentation in code comments
3. Test locally with curl/fetch examples above

---

## References

- [MDN: HTTP 308 Permanent Redirect](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/308)
- [Next.js Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Next.js Redirects](https://nextjs.org/docs/app/api-reference/functions/redirect)
