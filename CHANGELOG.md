# Changelog

All notable project changes are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow semantic versioning where practical for this research project.

## [Unreleased]

The current source and app manifest identify the replacement research beta as `0.1.1`. No signed binary, GitHub Release, or version tag has been published yet.

### Added

- Hybrid Expo/React Native application for Android and iOS
- Explicit manual posted-limit confirmation for every drive session
- GPS-speed validation, smoothing, hysteresis, cooldown, and fail-closed alerts
- Reliable Android screen-on tracking with wake lock, plus permission-gated iOS background-location support
- Premium obsidian/cyan instrument system developed with ForgeKit review discipline and an evidence-first status hierarchy
- Local notification, haptic, voice, and live visual alerts
- Session isolation, stale-fix handling, interrupted-session recovery, and runtime storage validation
- Four source-linked demonstration road references
- Privacy, security, data-licensing, contribution, CI, and dependency-notice documentation

### Safety constraints

- Radar-control values are never used as driving targets or alert thresholds
- Coordinates are neither persisted nor uploaded
- Automatic GPS-to-road limit inference is intentionally not shipped

### Release gates for a versioned public release

- Physical-device validation evidence and measured reliability results
- A store-suitable signed release and matching version tag
