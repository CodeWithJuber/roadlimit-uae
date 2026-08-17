# GitHub repository setup

Files in the repository cannot configure every GitHub setting. A maintainer should complete and periodically re-check this list.

## About panel

- Description: `Privacy-first Android/iOS speed-awareness research beta for manually confirmed UAE road limits.`
- Website: leave empty until a versioned public privacy/project site exists.
- Topics: `expo`, `react-native`, `android`, `ios`, `road-safety`, `speed-awareness`, `uae`, `dubai`, `privacy-first`.
- Social preview: add only a sanitized capture from a validated build or an accurate project graphic; do not use a fabricated product screenshot.

## Security and branch rules

- Enable private vulnerability reporting and test the public reporter link in `SECURITY.md`.
- Protect `main`; require a pull request, the `validate` CI job, resolved conversations, and CODEOWNER review for owned paths.
- Prevent force-pushes and branch deletion. Keep emergency bypass narrowly assigned and auditable.
- Enable Dependabot alerts and security updates after reviewing repository access and notification routing.

## Labels used by automation

| Label | Purpose |
|---|---|
| `bug`, `triage` | Defect intake |
| `enhancement`, `needs-review` | Feature intake |
| `data`, `needs-verification` | Road-data correction intake |
| `question` | Usage Q&A |
| `safety`, `security` | Release-note grouping and sensitive review |
| `documentation`, `dependencies` | Maintenance grouping |
| `skip-changelog` | Deliberately exclude a pull request from generated notes |

Create these labels before relying on issue-form or release-note auto-labelling.

## Release checklist

- Do not create `v0.1.0` until the README release gates and physical-device plan have evidence.
- Create an annotated tag from the reviewed commit, publish matching release notes, and then add `date-released` to `CITATION.cff`.
- Verify the repository About text, privacy URL, notices, screenshots, and signed artifacts all describe the same build.
