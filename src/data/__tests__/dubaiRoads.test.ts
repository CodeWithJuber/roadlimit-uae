import { describe, expect, it } from 'vitest';

import { DEMO_ROADS } from '../demoRoads';

describe('bundled demonstrator data', () => {
  it('contains unique stable IDs and names', () => {
    expect(new Set(DEMO_ROADS.map((road) => road.id)).size).toBe(DEMO_ROADS.length);
    expect(new Set(DEMO_ROADS.map((road) => road.canonicalName)).size).toBe(DEMO_ROADS.length);
  });

  it('uses only plausible posted-limit values', () => {
    for (const road of DEMO_ROADS) {
      expect(road.postedLimitsKmh.length).toBeGreaterThan(0);
      for (const value of road.postedLimitsKmh) {
        expect(value).toBeGreaterThanOrEqual(20);
        expect(value).toBeLessThanOrEqual(160);
      }
      expect(road.source.url.startsWith('https://')).toBe(true);
      expect(road.source.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
