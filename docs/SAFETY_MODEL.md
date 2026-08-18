# Safety model

RoadLimit UAE is an advisory research prototype. This document records the current engineering safety assumptions; it is not a certification or guarantee.

## Authority order

1. Police directions and current physical/temporary signs
2. Applicable law and official current information
3. A value manually confirmed by the driver while parked
4. Source-linked road references shown only as candidates

Radar-control values are enforcement metadata and never become a driving target or alert threshold.

## Runtime invariants

- A person explicitly starts every session and confirms the current posted limit.
- The confirmed limit and alert preferences are immutable for that session.
- The app never resumes a prior session after process restart, force-stop, or reboot.
- Android beta tracking is foreground-only: the app holds a wake lock and ends the session when it leaves the foreground or the screen locks.
- Stale, inaccurate, missing, negative, or implausible speed input suppresses alerts and clears the displayed speed.
- A required background notification failure stops the session.
- A location-task error invalidates the session and attempts to stop native tracking.
- A callback from an old session cannot write into a new session.
- Coordinates are discarded after each callback; only recent speed, accuracy, and timestamp samples may be buffered.
- No LLM, remote API, or radar-control value participates in the live decision loop.

## Known limitations

- A static manually confirmed value cannot detect a later sign or temporary limit change.
- Operating systems and OEM battery controls may delay or terminate callbacks without delivering an error.
- Silent mode, Focus/Do Not Disturb, calls, Bluetooth state, and user channel settings can suppress outputs.
- GPS speed may be unavailable or inaccurate in tunnels, dense urban areas, or poor satellite conditions.
- The four bundled road references have no segment geometry and cannot support automatic matching.
- Background execution in Expo Go is not representative; development and signed release builds are required.
- The Expo SDK 57 Android background foreground-service path is deliberately disabled pending an upstream fix and physical OEM evidence.

## Safe use

Set up only while parked. Mount the device, avoid looking at or touching it while moving, follow changed signs immediately, and stop/reconfirm when the road section changes. Validation must be performed by a passenger or in a controlled environment.

## Change review triggers

Changes to alert thresholds, smoothing, permissions, notification/audio delivery, background lifecycle, storage, road data, or native configuration require safety review, regression tests, documentation updates, and appropriate physical-device evidence.
