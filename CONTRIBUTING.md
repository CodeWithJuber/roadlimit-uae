# Contributing

Thank you for improving RoadLimit UAE.

## Code changes

1. Create a focused branch.
2. Run `npm run check`.
3. Keep the live alert path deterministic; do not add an LLM to the safety loop.
4. Preserve the fail-closed rule: uncertain, stale, or conflicting data must produce **Limit unknown**.
5. Never change an alert threshold to a radar-control value.

## Road-data corrections

- Collect evidence only while parked or as a passenger; never use a phone while driving.
- Identify emirate, direction, carriageway, exact start/end segment, posted value, observation date, and primary source.
- Remove faces, vehicle plates, precise home locations, and photo metadata before sharing evidence.
- State the data licence/permission.
- A road-name-wide value is insufficient when different sections have different limits.
- Radar control may be stored as separately labelled advisory metadata, but it must never become the alert threshold.

Data changes require review and should not be auto-merged from a scraper or AI extractor.
