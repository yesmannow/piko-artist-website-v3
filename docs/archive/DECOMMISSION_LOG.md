# Decommission Log

This document tracks features that have been deprecated, removed, or scheduled for removal.
It reflects the current direction of Piko Artist Website V3.

## Active Features (Do Not Remove)

### Studio
The Studio is an active, core feature of the project.
Recent stabilization includes:
- OffscreenCanvas lifecycle fixes
- Deck performance throttling
- Local audio asset migration
- Service worker range-request support

Studio must NOT be removed or decommissioned.

## Deprecated Features (Safe to Remove)

### Tour
The Tour feature is deprecated and can be removed when convenient.

### Merch
The Merch feature is deprecated and can be removed when convenient.

## Notes

- Previous versions of this log incorrectly listed the Studio for removal.
- All local audio assets in `public/audio/tracks/` are part of the active Studio feature set.
- Record future decommission decisions here before removing code.
