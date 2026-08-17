# Privacy

RoadLimit UAE is designed to work without an account, advertising ID, analytics SDK, cloud backend, or route-history database.

## Location use

- Location access starts only after the user confirms a posted limit and taps **Start drive**.
- High-accuracy location is used only to read the device-reported speed during that active session.
- Latitude and longitude are processed per location callback and discarded; they are not written to app storage or uploaded.
- A minimal rolling buffer containing speed, accuracy, and timestamp may be stored on-device during a session so median smoothing still works in background task launches.
- That speed buffer is cleared when the drive stops and during next-launch recovery after an interrupted session.
- Android backups are disabled for this app. The app does not sell location data or track outside a user-started session.
- The Android research beta keeps tracking in the visible app and holds a wake lock during the session; it does not start a background location service. Leaving or locking the app ends the session. iOS shows its background-location indicator when its separately gated background mode is enabled.

## Notifications

Speed warnings are local notifications. iOS background mode is not started unless local-notification permission is available. On Android, notifications are an optional additional output for the screen-on session. The current research build marks its alert channel **private**, so content such as the measured speed and confirmed session limit is intended to be hidden on a secured lock screen. It may remain visible when the device is unlocked, and Android/OEM/user settings ultimately control presentation; verify this behaviour on every release device.

## Control and deletion

Tap **Stop drive** to stop location updates and clear temporary session state. You can revoke location or notification permission in device settings and erase all settings by uninstalling the app.

## Research-beta publication gate

This repository policy describes the research build and is not, by itself, an app-store privacy submission. Before publication, host a public versioned copy, verify it against the signed binary and lock-screen behaviour, complete the platform privacy disclosures, and document retention and deletion for every shipped data path.

Reassess this policy and app-store privacy labels before adding crash reporting, analytics, cloud sync, remote diagnostics, accounts, externally sourced map matching, evidence uploads, or any other networked data flow.
