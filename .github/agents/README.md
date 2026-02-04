# Custom Agents for Piko Studio

This directory contains custom agent definitions for consistent repository workflows.

---

## Available Agents

### 🔍 **@RepoAuditor** (Read-Only Analysis)
**Purpose**: Scan, analyze, and report on repository health without modifying code.

**When to Use:**
- Before cleanup or optimization work
- When you need evidence for deletion candidates
- To identify unused code, large files, or circular dependencies
- To generate dependency and asset reports
- When planning refactors or migrations

**Key Capabilities:**
- ✅ Read files and search codebase
- ✅ Run analysis tools (ts-prune, depcheck, madge)
- ✅ Generate audit reports in `/audit/` and `/docs/`
- ✅ Provide proof commands (ripgrep) for zero-usage verification
- ❌ **Never modifies source code**
- ❌ **Never deletes files**

**Example Prompts:**

1. **Full Repository Audit:**
   ```
   @RepoAuditor, run a complete audit:
   - Find unused exports and dependencies
   - List largest files in src/ and public/
   - Detect circular dependencies
   - Scan for unused assets
   - Generate a deletion plan with proof commands
   ```

2. **Targeted Asset Cleanup:**
   ```
   @RepoAuditor, audit public/assets/:
   - List all images, audio, and 3D models
   - Check which assets are actually referenced in the codebase
   - Generate deletion candidates with size savings estimates
   ```

---

### ⚙️ **@StudioImplementer** (Edit & Verify)
**Purpose**: Execute approved changes with mandatory build/lint verification after each batch.

**When to Use:**
- After RepoAuditor has generated an approved deletion plan
- When implementing refactors or new features
- When optimization work is ready to execute
- When you need guaranteed verification after changes

**Key Capabilities:**
- ✅ Edit, create, delete source files
- ✅ Work in small verified batches
- ✅ Run build/lint/test after each change
- ✅ Follow non-negotiable architecture rules (Tone.js only, WaveSurfer visuals-only, trackKey normalization, no client secrets)
- ✅ Enforce deletion proof checklist
- ✅ Auto-rollback on build failures
- ❌ **Never skips verification**
- ❌ **Never deletes without proof**

**Example Prompts:**

1. **Execute Approved Deletion Plan:**
   ```
   @StudioImplementer, execute Batch 1 from audit/deletion-plan.md:
   - Delete the 5 low-risk unused components
   - Verify build/lint after each deletion
   - Report any failures immediately
   ```

2. **Refactor with Verification:**
   ```
   @StudioImplementer, refactor audio playback to use Tone.js exclusively:
   - Remove all WaveSurfer.play() calls
   - Replace with Tone.Transport controls
   - Ensure trackKey normalization is used (not full URLs)
   - Verify build/lint after each component
   ```

---

## Recommended Workflow

### 1. Audit First (Read-Only)
```
@RepoAuditor, analyze the codebase and identify optimization opportunities
```
- Review generated audit reports in `/audit/`
- Decide which items to approve for implementation

### 2. Implement Approved Changes
```
@StudioImplementer, execute the approved items from audit/deletion-plan.md - low-risk batch only
```
- Changes are applied in small batches
- Verification runs automatically
- Failures trigger auto-rollback

### 3. Iterate
- If issues found, use @RepoAuditor to re-analyze
- Use @StudioImplementer for corrections
- Repeat until objectives met

---

## Agent Selection Guide

| Task | Agent | Why |
|------|-------|-----|
| "Find unused code" | @RepoAuditor | Read-only analysis |
| "List large files" | @RepoAuditor | Metrics gathering |
| "Scan for unused assets" | @RepoAuditor | Evidence collection |
| "Delete these files" | @StudioImplementer | Requires code modification |
| "Refactor this module" | @StudioImplementer | Requires code modification |
| "Implement new feature" | @StudioImplementer | Requires code modification |
| "Generate deletion plan" | @RepoAuditor | Planning, not execution |
| "Check dependency health" | @RepoAuditor | Read-only analysis |
| "Execute approved plan" | @StudioImplementer | Implementation |

---

## Safety Guarantees

### @RepoAuditor Safety
- **Zero code modifications** - only reads and reports
- **No destructive commands** - cannot delete or modify
- **Evidence-based** - all recommendations include proof commands
- **Handoff protocol** - provides ready-to-execute prompts for @StudioImplementer

### @StudioImplementer Safety
- **Mandatory verification** - build/lint/test after every batch
- **Deletion proof required** - must verify zero usage before delete
- **Auto-rollback** - reverts changes if build fails
- **Architecture enforcement** - follows non-negotiable rules (Tone.js only, trackKey normalization, no client secrets)
- **Batch limits** - works in small increments to minimize blast radius

---

## Architecture Rules Compliance

Both agents strictly follow the non-negotiable rules defined in `.github/copilot-instructions.md`:

- ✅ Tone.js is the ONLY audio engine (no alternatives)
- ✅ WaveSurfer is visuals-only (never for playback)
- ✅ Service Workers DISABLED in development
- ✅ Canonical trackKey normalization (no full URLs as IDs)
- ✅ No secrets in client code (NEXT_PUBLIC_* only)
- ✅ Small modules over monster files
- ✅ Derived state over setState loops

---

## Quick Reference

### Start an Audit
```
@RepoAuditor, run [type] audit
```

### Execute Changes
```
@StudioImplementer, execute [approved plan/refactor]
```

### Handoff from Audit to Implementation
After @RepoAuditor generates a plan, it provides a handoff prompt like:
```
@StudioImplementer, please implement the following approved deletions:
- Delete src/components/unused/OldComponent.tsx
- Delete public/assets/unused-image.png
Verify build/lint after each deletion.
```

---

*For more details, see individual agent files: `RepoAuditor.agent.md` and `StudioImplementer.agent.md`*
