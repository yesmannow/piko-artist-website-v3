# Navigation QA Checklist (Labs On/Off)

## Routes to verify
- `/`
- `/music`
- `/videos`
- `/studio`
- `/contact`
- `/install`
- `/timeline` (Labs only)

## Desktop (NavBar)
- [ ] Primary nav shows above routes.
- [ ] Active route highlighted.
- [ ] Labs off: `/timeline` hidden.
- [ ] Labs on: `/timeline` visible.
- [ ] Mobile drawer (NavBar) mirrors the same links.

## Mobile (TacticalBar)
- [ ] Shows core routes (Home, Music, Videos, Studio, Contact).
- [ ] Labs off: `/timeline` hidden.
- [ ] Labs on: `/timeline` visible.
- [ ] Active state highlights correct item.

## Regression checks
- [ ] No `MainNav` rendered anywhere.
- [ ] No stale/hardcoded nav arrays outside `nav.config.ts`.
