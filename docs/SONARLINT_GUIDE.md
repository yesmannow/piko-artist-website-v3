# SonarLint Configuration Guide

## Configuration Applied

**File:** `.vscode/sonarlint.json`

### Disabled Rules (Too Noisy / Opinionated)

| Rule | What It Wanted | Why Disabled |
|------|----------------|--------------|
| `S7773` | Use `Number.parseInt()` instead of `parseInt()` | Purely stylistic, no impact |
| `S7764` | Use `globalThis` instead of `window` | We use SSR guards already |
| `S7748` | Write `1` instead of `1.0` | Trivial style preference |
| `S7761` | Use `.dataset` instead of `setAttribute` | Opinionated style |
| `S7741` | Compare `=== undefined` instead of `typeof` | `typeof` is safer in some cases |
| `S6759` | Mark props as `Readonly<>` | Good practice but too noisy during dev |
| `S6571` | Don't use `"literal" \| string` unions | We use this pattern intentionally for autocomplete |

### Enabled Rules (High Value)

| Rule | What It Checks | Why Enabled | Priority |
|------|----------------|-------------|----------|
| `S6481` | Context provider value memoization | **Critical** - Performance bug, causes cascade re-renders | 🔴 HIGH |
| `S6479` | Array index in keys | **Critical** - React correctness, breaks on reorder | 🔴 HIGH |
| `S6825` | `aria-hidden` on focusable elements | **Critical** - Accessibility violation | 🔴 HIGH |
| `S1090` | `<iframe>` missing title | **Critical** - Accessibility requirement | 🔴 HIGH |
| `S3776` | Cognitive complexity > 25 | Maintainability - encourages small functions | 🟡 MEDIUM |
| `S1874` | Deprecated symbols | Useful - catches library API changes | 🟡 MEDIUM |

## How to Use

### Reload SonarLint

After saving `.vscode/sonarlint.json`, reload VS Code or run:
- **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`)
- Type: `SonarLint: Clear Analysis Results`
- Then: `Developer: Reload Window`

### Fix High-Priority Issues Only

Focus on the **enabled rules** above. Here's how to fix each:

#### 1. Context Provider Memoization (S6481)

**Before:**
```tsx
<ThemeContext.Provider value={{ theme, setTheme }}>
```

**After:**
```tsx
const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
return <ThemeContext.Provider value={value}>...</ThemeContext.Provider>;
```

#### 2. Array Index Keys (S6479)

**Before:**
```tsx
items.map((item, index) => <Row key={index} {...item} />)
```

**After:**
```tsx
items.map(item => <Row key={item.id} {...item} />)
```

If no stable `id` exists, generate one when data is created:
```tsx
const itemsWithIds = rawItems.map((item, i) => ({ ...item, _key: `${item.name}-${i}` }));
```

#### 3. `aria-hidden` on Focusable Elements (S6825)

**Before:**
```tsx
<button aria-hidden="true" onClick={...}>Icon</button>
```

**After - Option A (remove aria-hidden):**
```tsx
<button onClick={...}>Icon</button>
```

**After - Option B (make non-focusable):**
```tsx
<span aria-hidden="true" className="decorative-icon">Icon</span>
```

#### 4. Missing iframe Title (S1090)

**Before:**
```tsx
<iframe src="https://youtube.com/embed/..." />
```

**After:**
```tsx
<iframe
  src="https://youtube.com/embed/..."
  title="Piko Official Music Video - Track Name"
/>
```

Each iframe needs a **unique, descriptive** title.

#### 5. Cognitive Complexity (S3776)

**Strategy:** Extract nested logic into helper functions

**Before:**
```tsx
function handleSubmit(data) {
  if (data) {
    if (data.email) {
      if (validateEmail(data.email)) {
        if (data.terms) {
          // ... deep nesting
        }
      }
    }
  }
}
```

**After:**
```tsx
function handleSubmit(data) {
  if (!data?.email) return;
  if (!validateEmail(data.email)) return;
  if (!data.terms) return;

  processValidSubmission(data);
}

function processValidSubmission(data) {
  // Extracted logic
}
```

## Adjusting Thresholds

If you still get too many warnings, edit `.vscode/sonarlint.json`:

### Raise Cognitive Complexity Threshold
```json
"typescript:S3776": {
  "level": "on",
  "parameters": {
    "threshold": 30  // Default 15, currently 25, can go higher
  }
}
```

### Disable More Rules
Add any rule to the "off" section:
```json
"typescript:SXXXX": {
  "level": "off"
}
```

## Tailwind IntelliSense

Also configured in `.vscode/settings.json`:

```json
"tailwindCSS.lint.recommendedVariantOrder": "ignore"
```

This stops warnings like:
- ❌ `max-w-[420px]` → `max-w-105`
- ❌ `min-h-[44px]` → `min-h-11`

These are **style preferences only** - arbitrary values work fine.

## Quick Decision Tree

```
Is it showing in PROBLEMS panel?
├─ Yes, Red (Error)
│  └─ Fix immediately (build blocker)
├─ Yes, Yellow (Warning)
│  ├─ Rule S6481, S6479, S6825, S1090?
│  │  └─ Fix (high-value: perf/a11y/correctness)
│  └─ Rule S3776?
│     └─ Fix if > 30 complexity (refactor for maintainability)
└─ Yes, Blue (Info)
   └─ Ignore (style preferences)
```

## Next Steps

1. **Reload VS Code** to apply config
2. **Check PROBLEMS panel** - should see ~70% fewer warnings
3. **Focus on**:
   - Context memoization (ThemeContext, AudioContext, etc.)
   - Array keys (TrackList, any `.map()` renders)
   - Accessibility (iframes, aria-hidden)
4. **Ignore** everything else unless you want to refactor for style

## Reference

- [SonarLint Rules](https://rules.sonarsource.com/typescript)
- [Copilot Instructions](.github/copilot-instructions.md) - Architecture rules
- [ESLint Config](eslint.config.mjs) - Our existing lint rules
