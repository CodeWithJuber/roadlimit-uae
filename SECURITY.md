# Security policy

Please do not open a public issue for a vulnerability that could expose location data, tokens, build credentials, or unsafe alert behaviour.

## Supported versions

| Version | Support |
|---|---|
| Current `main` research source | Security reports accepted |
| Signed store binaries | None published |

## Private reporting

Use [GitHub private vulnerability reporting](https://github.com/CodeWithJuber/roadlimit-uae/security/advisories/new). Include the affected version, platform, redacted reproduction steps, impact, and a minimal proof of concept. Do not attach real trip traces, access tokens, personal addresses, faces, or licence plates.

If that private form is unavailable, open a public issue titled **Private security contact requested** with no vulnerability details or sensitive data. A maintainer will arrange a private follow-up using the contact options available on the reporter's GitHub profile. Never post secrets or exploitable details publicly.

The project aims to acknowledge a report within seven days and provide an initial status within fourteen days. These are response targets for a volunteer research project, not a guaranteed service level. Coordinated disclosure timing will be agreed with the reporter when a fix is required.

Treat session-crossing alerts, failure to stop location tracking, stale speed displays, or any persisted/uploaded coordinates as security and safety issues. This beta has no cloud backend or API token.
