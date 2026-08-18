# Roadmap

This roadmap is evidence-gated rather than date-gated. A phase is complete only when its acceptance evidence is public and reproducible.

## 0.1 — Research beta

- [x] Android/iOS Expo codebase
- [x] Explicit per-session posted-limit confirmation
- [x] Local GPS-speed validation and deterministic alert policy
- [x] Android screen-on and iOS background fail-closed lifecycle controls
- [x] Privacy, security, data-licensing, and contribution policies
- [x] Unit and integration tests plus CI
- [ ] Complete the physical-device matrix in `docs/DEVICE_TEST_PLAN.md`
- [ ] Publish measured false-alert and battery results

## 0.2 — Validated manual mode

- Signed internal Android and iOS builds
- Passenger-led field validation against physical signs
- Accessibility and driver-distraction review
- OEM-specific screen-on guidance and measured Android background-path evaluation
- Versioned public privacy policy matching shipped binaries

## 0.3 — Reviewed offline road data

- Legally approved data licence and attribution record
- Segment geometry, direction, carriageway, validity, and provenance schema
- Human-reviewed data build pipeline with signed/versioned packages
- Offline spatial index and low-confidence suppression
- No road-specific number when the match is ambiguous

## 0.4 — Experimental automatic matching

- Replay-tested map matcher for parallel roads, ramps, tunnels, and dropouts
- Confidence display and immediate fail-to-unknown behaviour
- Passenger-led ground-truth validation
- Public accuracy, latency, battery, and false-alert metrics

## Not planned without new evidence

- Using an LLM in the live alert loop
- Treating radar-control values as permission or alert thresholds
- Publishing radar-camera locations
- Auto-starting a drive after reboot or force-stop
- Uploading routes, selling data, or adding advertising by default
