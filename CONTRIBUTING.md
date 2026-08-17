# Contributing

Thank you for improving RoadLimit UAE.

## Development setup

Use Node.js 22+, Android Studio or Xcode, and a physical device for background/location work.

```bash
git clone https://github.com/CodeWithJuber/roadlimit-uae.git
cd roadlimit-uae
npm ci
npx expo prebuild
npx expo run:android
# or: npx expo run:ios
```

Expo Go is not a valid background-location test environment. Do not commit generated `android/`, `ios/`, build output, credentials, or local road-data review artifacts.

## Change workflow

1. Create a focused branch.
2. Add or update focused tests and documentation.
3. Run `npm run check` and `npm run doctor`; `check` includes repository metadata validation.
4. Inspect Expo prebuild output when permissions or native configuration change.
5. Complete the relevant physical-device scenarios in `docs/DEVICE_TEST_PLAN.md` for location, background, audio, or notification changes.
6. Open a pull request and complete the safety/privacy checklist. Keep unrelated changes separate.

The live alert path must remain deterministic; do not add an LLM to the safety loop. Preserve fail-closed behaviour: uncertain, stale, conflicting, or unusable data must produce **Limit unknown**. Never change an alert threshold to a radar-control value.

## Road-data corrections

- Collect evidence only while parked or as a passenger; never use a phone while driving.
- Identify emirate, direction, carriageway, exact start/end segment, posted value, observation date, and primary source.
- Remove faces, vehicle plates, precise home locations, and photo metadata before sharing evidence.
- State the data licence/permission.
- A road-name-wide value is insufficient when different sections have different limits.
- Radar control may be stored as separately labelled advisory metadata, but it must never become the alert threshold.

Data changes require review and should not be auto-merged from a scraper or AI extractor.

## Contribution rights and licence

By submitting code or documentation for inclusion, you represent that you have the right to submit it and agree that the accepted contribution is licensed under Apache-2.0, consistent with [LICENSE](LICENSE).

Road data is separate from the code licence. Do not submit third-party tables, geometry, photos, or derived databases unless you can document the applicable licence or written permission and all required attribution/share-alike terms. A public URL is not proof of redistribution rights. See [DATA_LICENSE.md](DATA_LICENSE.md).

All contributors must follow the [Code of Conduct](CODE_OF_CONDUCT.md). Never gather evidence while operating a vehicle.
