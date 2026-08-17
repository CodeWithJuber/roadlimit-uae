## Summary

Describe what changed and why.

## User and safety impact

- User-visible behaviour:
- Failure behaviour:
- Privacy/data impact:
- Battery/background impact:

## Validation

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] Expo configuration/prebuild inspected when native configuration changed
- [ ] Android and iOS release bundles generated when runtime code changed
- [ ] Physical-device evidence attached when background, audio, notification, or location behaviour changed

## Safety checklist

- [ ] Alerts still use the posted legal limit, never radar control
- [ ] Uncertain, stale, conflicting, or invalid input fails closed
- [ ] No coordinate persistence or upload was introduced without explicit review
- [ ] Settings cannot mutate an active session unexpectedly
- [ ] Road data includes provenance, verification date, and redistribution terms
- [ ] Evidence was collected while parked, by a passenger, or in simulation

## Documentation

List the README, privacy, security, licence, roadmap, or changelog updates included with this change.
