import { describe, expect, it } from 'vitest';

import { isUsableLocation, median, metresPerSecondToKmh, smoothedSpeedKmh } from '../speed';

describe('speed helpers', () => {
  it('converts metres per second to km/h', () => {
    expect(metresPerSecondToKmh(10)).toBe(36);
    expect(metresPerSecondToKmh(-1)).toBeNull();
    expect(metresPerSecondToKmh(null)).toBeNull();
    expect(metresPerSecondToKmh(71)).toBeNull();
  });

  it('uses a median to reject a single GPS spike', () => {
    const now = Date.now();
    const samples = [20, 20.5, 50, 21, 20].map((speedMps, index) => ({
      latitude: 25,
      longitude: 55,
      speedMps,
      accuracyMetres: 8,
      headingDegrees: 0,
      timestamp: now - (4 - index) * 1_000,
    }));
    expect(smoothedSpeedKmh(samples, now)).toBe(74);
  });

  it('responds to sustained acceleration within two new fixes', () => {
    const now = Date.now();
    const samples = [20, 20, 25, 25].map((speedMps, index) => ({
      latitude: 25,
      longitude: 55,
      speedMps,
      accuracyMetres: 8,
      headingDegrees: 0,
      timestamp: now - (3 - index) * 2_000,
    }));
    expect(smoothedSpeedKmh(samples, now)).toBe(90);
  });

  it('does not reuse an older speed when the current fix has no speed', () => {
    const now = Date.now();
    const base = {
      latitude: 25,
      longitude: 55,
      accuracyMetres: 8,
      headingDegrees: 0,
    };
    expect(
      smoothedSpeedKmh(
        [
          { ...base, speedMps: 20, timestamp: now - 2_000 },
          { ...base, speedMps: null, timestamp: now },
        ],
        now,
      ),
    ).toBeNull();
  });

  it('does not reuse an older speed when the current fix is implausible', () => {
    const now = Date.now();
    const base = {
      latitude: 25,
      longitude: 55,
      accuracyMetres: 8,
      headingDegrees: 0,
    };
    expect(
      smoothedSpeedKmh(
        [
          { ...base, speedMps: 20, timestamp: now - 2_000 },
          { ...base, speedMps: 71, timestamp: now },
        ],
        now,
      ),
    ).toBeNull();
  });

  it('fails closed when repeated fixes imply implausible acceleration', () => {
    const now = Date.now();
    const base = {
      latitude: 25,
      longitude: 55,
      accuracyMetres: 8,
      headingDegrees: 0,
    };
    expect(
      smoothedSpeedKmh(
        [
          { ...base, speedMps: 20, timestamp: now - 4_000 },
          { ...base, speedMps: 70, timestamp: now - 2_000 },
          { ...base, speedMps: 70, timestamp: now },
        ],
        now,
      ),
    ).toBeNull();
  });

  it('excludes stale and inaccurate speeds from smoothing', () => {
    const now = Date.now();
    const base = { latitude: 25, longitude: 55, headingDegrees: 0 };
    expect(
      smoothedSpeedKmh(
        [
          { ...base, speedMps: 50, accuracyMetres: 8, timestamp: now - 20_000 },
          { ...base, speedMps: 40, accuracyMetres: 100, timestamp: now - 1_000 },
          { ...base, speedMps: 20, accuracyMetres: 8, timestamp: now },
        ],
        now,
      ),
    ).toBe(72);
  });

  it('calculates medians for odd and even sets', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('rejects stale and low-accuracy fixes', () => {
    const base = {
      latitude: 25,
      longitude: 55,
      speedMps: 10,
      headingDegrees: 0,
    };
    expect(isUsableLocation({ ...base, accuracyMetres: 8, timestamp: 100_000 }, 105_000)).toBe(true);
    expect(isUsableLocation({ ...base, accuracyMetres: 8, timestamp: 99_999 }, 105_000)).toBe(false);
    expect(isUsableLocation({ ...base, accuracyMetres: 80, timestamp: 100_000 }, 105_000)).toBe(false);
    expect(isUsableLocation({ ...base, accuracyMetres: 8, timestamp: 90_000 }, 105_000)).toBe(false);
  });
});
