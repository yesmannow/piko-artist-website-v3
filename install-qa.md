# /install PWA QA Checklist

Use this to validate the install experience after build.

## Chrome Desktop (fresh, not installed)
- [ ] Visit `/install` and confirm `beforeinstallprompt` fires (native prompt available).
- [ ] CTA triggers the native install dialog.
- [ ] After install, reload: prompt should not show again.

## iOS Safari
- [ ] Manual “Add to Home Screen” instructions are visible and readable.
- [ ] Layout remains responsive; no overlap or clipping.

## Already Installed (any platform)
- [ ] No native prompt shown.
- [ ] Fallback guide or “open/manage install” message visible.

## Notes
- If `beforeinstallprompt` is undefined, ensure the fallback card renders on `/install`.
- Capture screenshots if any prompt or fallback fails to appear.
