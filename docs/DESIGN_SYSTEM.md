# RoadLimit UAE design system

This file is the implementation contract for the research-beta interface. It applies ideas from [ForgeKit](https://github.com/CodeWithJuber/forgekit), [Hikmah Stack](https://github.com/CodeWithJuber/hikmah-stack), and [WisdomLens](https://github.com/CodeWithJuber/wisdomlens); none of those repositories is bundled as an APK runtime dependency.

## Direction

**Premium EV instrument, not a navigation game.** The driving view uses a calm radial speed instrument and communicates current GPS evidence, the manually confirmed session value, and whether protection is active at arm's length. Parked setup screens may contain explanation; the active drive screen may not invite exploration.

## Core tokens

| Role | Value |
|---|---|
| Canvas | `#030812` |
| Canvas depth | `#06101C` |
| Panel | `#091421` |
| Raised panel | `#0E1A29` |
| Primary text | `#F7FAFE` |
| Muted text | `#A6B2C3` |
| Faint text | `#718096` |
| Border | `#18283A` |
| Strong border | `#263A52` |
| Primary cyan | `#19C8FF` |
| Cyan depth | `#0A2A3A` |
| Ready / safe | `#58E39B` |
| Safety red | `#FF5C68` |

Spacing follows a 4 px base grid. Corners use 12 px controls, 16 px groups, and a 30 px radial hero. The native system sans-serif is used throughout; speed and limit numbers use tabular figures where supported. Glow is restricted to the static speed instrument and never pulses or conveys state by itself.

## Evidence and trust states

- **Ready** means the app can request a new session; it never means tracking is active.
- **Starting** means permissions or GPS evidence are not yet complete.
- **Tracking** requires a recent, usable GPS speed and a manually confirmed session limit.
- **Signal degraded** clears the current speed and suppresses alerts.
- **Stopped / needs attention** is explicit after lifecycle, delivery, or location failure.
- A candidate road value is labelled **candidate** until the person confirms the physical sign. It is never styled as automatically verified.
- Android beta is always labelled **screen-on**. Leaving or locking the app ends the session.

Every state uses an icon and words in addition to colour. Unknown is a valid state and is shown as an em dash or explicit copy; the UI does not backfill an old or inferred value.

## Driver-safety interaction rules

- Primary driving information remains visible without scrolling on a typical phone.
- Active sessions lock Roads, Settings, source links, test alerts, and other nonessential actions.
- The only active-session action is a minimum 56 px **Stop drive** target.
- Buttons and tabs have at least a 48 px touch target.
- The active view says to follow posted and temporary signs and authority instructions; it never presents the app value as legal authority.
- Status, warnings, and controls never rely on colour alone.
- No radar-control threshold, camera location, streak, score, animation loop, or gamification appears in the consumer UI.

## Accessibility and verification gates

- Body copy targets at least 4.5:1 contrast; large display text targets at least 3:1.
- Bright warning colours use dark ink where white would fail contrast.
- Text containers must tolerate Dynamic Type and wrapping without hiding the primary action.
- Motion is optional and never required to understand a state.
- A release candidate needs screenshots from the actual build at small and large text sizes, TalkBack/VoiceOver labels, Android dark-mode contrast checks, and passenger-led physical-device evidence recorded in `docs/DEVICE_TEST_PLAN.md`.

## Provenance

ForgeKit provides deterministic design-review discipline and token governance; RoadLimit deliberately uses its own premium obsidian/cyan palette after visual testing. Hikmah Stack contributes evidence-before-confidence and durable safety-boundary thinking. WisdomLens contributes explicit verification, graceful degradation, and inspectable delivery gates. RoadLimit translates those principles into native mobile components rather than copying web components or claiming plugin-powered runtime behaviour.
