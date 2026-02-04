# 🔧 Priority 1 Fixes: Studio Runtime Blockers

**Date:** February 3, 2026
**Focus:** Essentia Worker + Service Worker Development Stability

---

## 🎯 Problem Statement

**Current Issues:**
1. **Essentia Worker Instability** - Complex initialization, unclear error handling
2. **Service Worker in Development** - Already disabled ✅ but worth documenting
3. **Analysis Worker Errors** - Potential WASM loading failures in dev

**Impact:**
- "Haunted" development experience with inconsistent behavior
- Precache failures when `_next/static` hashes change
- Analysis features fail unpredictably

---

## ✅ Current State Analysis

### Service Worker Configuration
**File:** `next.config.mjs`

```javascript
const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development', // ✅ CORRECT!
  maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
});
```

**Status:** ✅ **Already properly configured!**
- Service worker is **disabled in development**
- Only active in production builds
- Prevents `bad-precaching-response` errors from changing hashed assets

**No changes needed** - this is already following best practices.

---

### Essentia Worker Issues

**File:** `src/workers/essentia.worker.ts`

**Current Problems:**
1. Complex initialization with multiple fallback paths
2. Extensive debug logging even in production
3. No graceful degradation if WASM fails to load
4. Race condition potential with `initializationPromise`

**Current State:**
- Lines 59-125: Overly complex initialization
- Lines 74-99: Debug logging in all environments
- No user-facing error messages for analysis failures

---

## 🔨 Fixes to Apply

### Fix 1: Simplify Essentia Worker Initialization

**Goal:** Reliable initialization with graceful degradation

**Changes to `src/workers/essentia.worker.ts`:**

#### A. Add Environment-Aware Logging
```typescript
// At top of file
const isDev = () =>
  typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

const log = {
  debug: (...args: unknown[]) => isDev() && console.debug('[EssentiaWorker]', ...args),
  warn: (...args: unknown[]) => console.warn('[EssentiaWorker]', ...args),
  error: (...args: unknown[]) => console.error('[EssentiaWorker]', ...args),
};
```

#### B. Simplify Initialization with Clear Error Path
```typescript
const initEssentia = async () => {
  if (isInitialized && essentiaInstance) {
    log.debug('Already initialized');
    return;
  }

  if (initializationPromise !== null) {
    log.debug('Initialization in progress');
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      log.debug('Starting Essentia.js initialization');

      const module = await import('essentia.js');
      const api = extractEssentiaApi(module);

      if (!api) {
        throw new Error('Could not extract Essentia API from module');
      }

      essentiaInstance = api;
      isInitialized = true;
      log.debug('Initialization successful');

    } catch (error) {
      log.error('Initialization failed:', error);

      // Reset so we can try again on next analysis request
      initializationPromise = null;
      isInitialized = false;

      throw new Error(
        'Essentia.js failed to load. Audio analysis features will be unavailable. ' +
        'This is usually caused by missing WASM files or network issues.'
      );
    }
  })();

  return initializationPromise;
};
```

#### C. Remove Excessive Debug Logging
**Remove lines 74-99** - the extensive debug logging that runs in production

**Replace with:**
```typescript
const extractEssentiaApi = (module: unknown): EssentiaApi | null => {
  log.debug('Attempting to extract Essentia API');

  if (!module || typeof module !== 'object') {
    log.debug('Module is not an object');
    return null;
  }

  // Try module.EssentiaJs first (most common case)
  const record = module as Record<string, unknown>;
  if ('EssentiaJs' in record && hasEssentiaApi(record.EssentiaJs)) {
    log.debug('Found API at module.EssentiaJs');
    return record.EssentiaJs as EssentiaApi;
  }

  // Try module.default.EssentiaWASM
  const defaultObj = record.default as Record<string, unknown> | undefined;
  if (defaultObj?.EssentiaWASM && hasEssentiaApi(defaultObj.EssentiaWASM)) {
    log.debug('Found API at module.default.EssentiaWASM');
    return defaultObj.EssentiaWASM as EssentiaApi;
  }

  // Try module.EssentiaWASM
  if (record.EssentiaWASM && hasEssentiaApi(record.EssentiaWASM)) {
    log.debug('Found API at module.EssentiaWASM');
    return record.EssentiaWASM as EssentiaApi;
  }

  // Direct API (rare but possible)
  if (hasEssentiaApi(module)) {
    log.debug('Found API directly on module');
    return module as EssentiaApi;
  }

  log.warn('Could not find Essentia API in any expected location');
  return null;
};
```

---

### Fix 2: Add Graceful Degradation to Hook

**File:** `src/hooks/useEssentiaAnalysis.ts`

**Add user-friendly error handling:**

```typescript
const analyzeTrack = useCallback(
  async (audioBuffer: AudioBuffer, trackId: string): Promise<AnalysisResult | null> => {
    if (!workerRef.current) {
      console.warn('[Analysis] Worker not available - analysis disabled');
      return null; // Gracefully return null instead of throwing
    }

    setIsAnalyzing(true);
    setError(null);

    return new Promise((resolve) => {
      const worker = workerRef.current!;

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        worker.removeEventListener('message', handleMessage);
        setIsAnalyzing(false);
        setError('Analysis timeout - file may be too large');
        console.warn('[Analysis] Timeout after 30s');
        resolve(null);
      }, 30000);

      const handleMessage = (e: MessageEvent) => {
        if (e.data.trackId === trackId) {
          clearTimeout(timeout);
          worker.removeEventListener('message', handleMessage);
          setIsAnalyzing(false);

          if (e.data.error) {
            console.warn('[Analysis] Worker error:', e.data.error);
            setError('Analysis failed');
            resolve(null);
          } else {
            resolve(e.data.result);
          }
        }
      };

      worker.addEventListener('message', handleMessage);

      // Send analysis request
      worker.postMessage({
        audioBuffer,
        sampleRate: audioBuffer.sampleRate,
        trackId,
      });
    });
  },
  []
);
```

---

### Fix 3: Add Worker Status Indicator (Optional Enhancement)

**File:** `src/hooks/useEssentiaAnalysis.ts`

Add a status indicator to show when analysis is available:

```typescript
interface UseEssentiaAnalysisReturn {
  analyzeTrack: (audioBuffer: AudioBuffer, trackId: string) => Promise<AnalysisResult | null>;
  isAnalyzing: boolean;
  isWorkerReady: boolean; // NEW
  error: string | null;
}

export function useEssentiaAnalysis(): UseEssentiaAnalysisReturn {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isWorkerReady, setIsWorkerReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const worker = new Worker(
        new URL('../workers/essentia.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current = worker;

      // Send a test message to verify worker is ready
      worker.postMessage({ type: 'ping' });

      worker.onmessage = (e) => {
        if (e.data.type === 'ready') {
          setIsWorkerReady(true);
          console.log('[Analysis] Worker ready');
        }
      };

      worker.onerror = (e) => {
        console.error('[Analysis] Worker error:', e);
        setError('Analysis unavailable');
        setIsWorkerReady(false);
        setIsAnalyzing(false);
      };

      return () => {
        worker.terminate();
        workerRef.current = null;
        setIsWorkerReady(false);
      };
    } catch (err) {
      console.error('[Analysis] Failed to create worker:', err);
      setError('Analysis worker unavailable');
      setIsWorkerReady(false);
    }
  }, []);

  return { analyzeTrack, isAnalyzing, isWorkerReady, error };
}
```

**Update worker to respond to ping:**

```typescript
// In essentia.worker.ts, add to message handler:
self.onmessage = async (event) => {
  const { audioBuffer, sampleRate, trackId, type } = event.data;

  // Handle ping/pong for readiness check
  if (type === 'ping') {
    self.postMessage({ type: 'ready' });
    return;
  }

  // ... rest of existing code
};
```

---

## 📋 Implementation Checklist

### Phase 1: Immediate (30 minutes)
- [ ] Add environment-aware logging helper to `essentia.worker.ts`
- [ ] Simplify `initEssentia` function
- [ ] Remove excessive debug logging
- [ ] Add timeout to `analyzeTrack` hook

### Phase 2: Testing (1 hour)
- [ ] Test analysis with valid MP3 file
- [ ] Test analysis failure (corrupt file)
- [ ] Test WASM loading failure (network offline)
- [ ] Verify no console spam in production build
- [ ] Verify graceful degradation when worker fails

### Phase 3: Enhancement (30 minutes - Optional)
- [ ] Add worker readiness indicator
- [ ] Show UI feedback when analysis is unavailable
- [ ] Add retry logic for transient failures

---

## 🧪 Testing Plan

### Development Environment
```bash
# Start dev server
npm run dev

# Open Studio page
http://localhost:3000/studio

# Test scenarios:
1. Load track with analysis - should work
2. Disable network in DevTools - analysis should fail gracefully
3. Check console - should have minimal logging
```

### Production Build
```bash
# Build
npm run build

# Start production server
npm start

# Test scenarios:
1. Verify service worker is active
2. Load track - analysis should work
3. Check console - NO debug logs should appear
4. Go offline - cached assets should still work
```

---

## 📊 Success Metrics

### Before Fixes
- ❌ Inconsistent worker initialization
- ❌ Production logs cluttered with debug messages
- ❌ No graceful degradation on failure
- ❌ No user feedback when analysis unavailable

### After Fixes
- ✅ Reliable worker initialization
- ✅ Clean production logs
- ✅ Graceful degradation on WASM failure
- ✅ Clear user feedback
- ✅ Deterministic dev server behavior

---

## 🔍 Related Files

**Modified:**
- `src/workers/essentia.worker.ts` - Core worker logic
- `src/hooks/useEssentiaAnalysis.ts` - React integration

**No Changes Needed:**
- `next.config.mjs` - SW already disabled in dev ✅
- `src/app/sw.ts` - Caching strategy is correct ✅

---

## 💡 Key Insights

### Service Worker (Already Fixed)
**Finding:** Service worker is already properly configured!
- Disabled in development
- Prevents bad-precaching-response errors
- No changes needed

### Essentia Worker
**Problem:** Over-engineered initialization with poor error handling
**Solution:** Simplify + graceful degradation

### Development Experience
**Before:** "Haunted" - unpredictable failures
**After:** Deterministic - clear success/failure states

---

## 🚀 Next Priority After This

Once these runtime blockers are fixed:

1. **Priority 2:** Fix remaining setState in useEffect (34 instances)
2. **Priority 3:** Refactor Deck.tsx (643 lines)
3. **Priority 4:** Security audit send-email API

---

**Created by:** GitHub Copilot
**Status:** Ready to implement
**Time to fix:** 2 hours (including testing)
