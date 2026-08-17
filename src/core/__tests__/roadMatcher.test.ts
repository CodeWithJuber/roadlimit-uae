import { describe, expect, it } from 'vitest';

import { DEMO_ROADS } from '../../data/demoRoads';
import { matchRoadName, normalizeRoadName } from '../roadMatcher';

describe('road-name matching', () => {
  it('normalizes common spelling and suffix variants', () => {
    expect(normalizeRoadName('Sheik Zayed Rd.')).toBe('sheikh zayed');
    expect(normalizeRoadName('Umm Nahda Street')).toBe('um nahda');
  });

  it('matches a route reference exactly', () => {
    const result = matchRoadName('E611', DEMO_ROADS);
    expect(result.road?.canonicalName).toBe('Emirates Road');
    expect(result.confidence).toBe('high');
  });

  it('fails closed on an unknown name', () => {
    const result = matchRoadName('Completely Unknown Lane', DEMO_ROADS);
    expect(result.road).toBeNull();
    expect(result.confidence).toBe('unknown');
  });
});
