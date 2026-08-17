# Physical-device test plan

Use this template for development and signed release builds. Never test while operating a moving vehicle; use a passenger, controlled track, or replay/simulation.

## Build record

| Field | Value |
|---|---|
| App version / commit | |
| Build type and signing | |
| Dataset version | Demo references only / other |
| Tester and date | |

## Device matrix

| Device | OS | Build | Foreground | Lock/leave behaviour | iOS background | Result / evidence |
|---|---|---|---|---|---|---|
| Pixel | | | | | | |
| Samsung Galaxy | | | | | | |
| Oppo/ColorOS | | | | | | |
| iPhone | | | | | | |

## Required scenarios

- Fresh install and incremental permission requests
- Precise location denied, reduced, revoked, and restored
- Notifications denied, channel downgraded/blocked, and restored
- Android remains awake while visible and fails closed when Home/lock is used
- iOS foregrounded, backgrounded, and screen locked
- GPS speed null, stale, inaccurate, negative, and implausibly high
- Normal acceleration/deceleration around approaching and over-limit thresholds
- Alert cooldown, hysteresis, and stop/restart session isolation
- Battery saver and OEM foreground/screen-awake restrictions
- No network / airplane mode with GPS still available
- iPhone silent mode, Focus, calls, and Bluetooth audio
- Android force-stop, recents dismissal, and reboot
- iOS force-quit and device restart
- Native callback error and silent callback loss
- Two-hour leak/crash/battery observation

## Acceptance evidence

- No road-specific value is inferred from GPS in this manual beta.
- No alert uses radar control as a threshold.
- Current speed disappears within the stale threshold while the React runtime is active.
- Notification/location failure is visible and the session fails closed when detectable.
- No prior session resumes after restart or reboot.
- No coordinates appear in app storage, logs, notifications, backups, or network traffic.
- Measured alert latency, false alerts per 100 km, missed alerts, and battery drain are reported rather than estimated.

Record failures with redacted logs/screenshots, exact permissions, timestamps, expected behaviour, and whether the OS delivered a callback or error.
