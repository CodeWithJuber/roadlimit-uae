# Changelog

All notable project changes are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow semantic versioning where practical for this research project.

## [Unreleased]

The current source and app manifest identify the research beta as `0.1.0`. No signed binary, GitHub Release, or `v0.1.0` tag has been published yet.

### Added

- Hybrid Expo/React Native application for Android and iOS
- Explicit manual posted-limit confirmation for every drive session
- GPS-speed validation, smoothing, hysteresis, cooldown, and fail-closed alerts
- Android foreground service and iOS background-location support
- Local notification, haptic, voice, and live visual alerts
- Session isolation, stale-fix handling, interrupted-session recovery, and runtime storage validation
- Four source-linked demonstration road references
- Privacy, security, data-licensing, contribution, CI, and dependency-notice documentation

### Safety constraints

- Radar-control values are never used as driving targets or alert thresholds
- Coordinates are neither persisted nor uploaded
- Automatic GPS-to-road limit inference is intentionally not shipped

### Release gates for v0.1.0

- Physical-device validation evidence and measured reliability results
- A signed release and matching `v0.1.0` tag
